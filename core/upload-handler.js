/**
 * Upload Handler - 파일 및 폴더 업로드 처리
 * hedge-manager.html에서 분리된 모듈
 */

class UploadHandler {
    constructor() {
        this.tempUploadData = null;
        this.selectedFiles = [];
        console.log('📤 Upload Handler 초기화');
    }

    /**
     * 폴더 선택 핸들러
     */
    async handleFolderSelect(event) {
        const files = Array.from(event.target.files);
        
        console.log(`📁 폴더 선택 이벤트 발생: ${files.length}개 파일`);
        
        if (!files || files.length === 0) {
            console.warn('⚠️ 폴더가 비어있습니다.');
            if (window.uiManager) {
                window.uiManager.showErrorMessage('폴더가 비어있습니다');
            }
            return;
        }
        
        // Excel 파일만 필터링
        const excelFiles = files.filter(f => 
            f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
        );
        
        if (excelFiles.length === 0) {
            console.warn('⚠️ Excel 파일이 없습니다');
            if (window.uiManager) {
                window.uiManager.showErrorMessage('폴더 내 Excel 파일이 없습니다');
            }
            return;
        }
        
        console.log(`✅ ${excelFiles.length}개의 Excel 파일 발견`);
        
        // 업로드 시작
        await this.uploadFolderFiles(excelFiles);
    }

    /**
     * 파일 선택 핸들러 (단일 파일)
     */
    handleFileSelect(event) {
        const input = event.target;
        const files = Array.from(input.files);
        
        if (!files || files.length === 0) {
            console.warn('⚠️ 파일이 선택되지 않았습니다');
            return;
        }
        
        this.selectedFiles = files;
        
        // 선택된 파일명 표시
        const selectedFileNameEl = document.getElementById('selectedFileName');
        if (selectedFileNameEl) {
            selectedFileNameEl.textContent = `✅ ${files.length}개 파일 선택됨`;
        }
        
        // 업로드 버튼 활성화
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = false;
        }
        
        console.log(`✅ ${files.length}개 파일 선택됨`);
    }

    /**
     * 드래그 오버 핸들러
     */
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.classList.add('bg-blue-50', 'border-blue-500');
        }
    }

    /**
     * 드래그 떠나기 핸들러
     */
    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.classList.remove('bg-blue-50', 'border-blue-500');
        }
    }

    /**
     * 드롭 핸들러
     */
    async handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.classList.remove('bg-blue-50', 'border-blue-500');
        }
        
        const files = Array.from(event.dataTransfer.files);
        
        if (!files || files.length === 0) {
            console.warn('⚠️ 드롭된 파일이 없습니다');
            return;
        }
        
        console.log(`📁 드롭된 파일: ${files.length}개`);
        
        // Excel 파일만 필터링
        const excelFiles = files.filter(f => 
            f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.type.includes('spreadsheet')
        );
        
        if (excelFiles.length === 0) {
            console.warn('⚠️ Excel 파일이 없습니다');
            if (window.uiManager) {
                window.uiManager.showErrorMessage('Excel 파일을 드롭해주세요');
            }
            return;
        }
        
        await this.uploadFolderFiles(excelFiles);
    }

    /**
     * 단일 파일 업로드
     */
    async uploadExcelFile() {
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            console.warn('⚠️ 선택된 파일이 없습니다');
            if (window.uiManager) {
                window.uiManager.showErrorMessage('파일을 선택해주세요');
            }
            return;
        }
        
        await this.uploadFolderFiles(this.selectedFiles);
    }

    /**
     * 폴더 내 모든 파일 업로드
     */
    async uploadFolderFiles(files) {
        const progressDiv = document.getElementById('uploadProgress');
        
        try {
            // 필수 모듈 확인
            if (!window.excelParser) {
                throw new Error('❌ Excel Parser 모듈이 로드되지 않았습니다. 페이지를 새로고침해주세요.');
            }
            
            if (!window.dataAnonymizer) {
                throw new Error('❌ Data Anonymizer 모듈이 로드되지 않았습니다. 페이지를 새로고침해주세요.');
            }
            
            if (!window.eventBus) {
                throw new Error('❌ Event Bus 모듈이 로드되지 않았습니다. 페이지를 새로고침해주세요.');
            }
            
            console.log(`📁 파일 업로드 시작 - 총 ${files.length}개 파일`);
            console.log(`✅ 필수 모듈 확인 완료`);
            
            // 진행률 UI 표시
            if (progressDiv) {
                progressDiv.classList.remove('hidden');
            }
            
            this.updateProgress(10, '파일 읽기 중...');
            
            let allOriginalPositions = [];
            let allAnonymizedPositions = [];
            let processedCount = 0;
            let successCount = 0;
            let failedFiles = [];
            
            // 각 파일을 Excel Parser 모듈로 처리
            for (const file of files) {
                try {
                    console.log(`📄 [${processedCount + 1}/${files.length}] 처리 중: ${file.name}`);
                    
                    // Excel 파싱
                    const parseResult = await window.excelParser.parseExcelWithMapping(file);
                    
                    console.log(`📊 ${file.name} 파싱 결과:`, {
                        데이터건수: parseResult.data.length,
                        헤더: parseResult.headers,
                        매핑: parseResult.mapping
                    });
                    
                    // 데이터 익명화
                    const { original, anonymized } = window.dataAnonymizer.anonymizePositions(parseResult.data);
                    
                    if (original && original.length > 0) {
                        allOriginalPositions = allOriginalPositions.concat(
                            original.map(pos => ({ ...pos, sourceFile: file.name }))
                        );
                        allAnonymizedPositions = allAnonymizedPositions.concat(
                            anonymized.map(pos => ({ ...pos, sourceFile: file.name }))
                        );
                        successCount++;
                    } else {
                        failedFiles.push({ name: file.name, reason: '데이터 없음' });
                    }
                    
                    processedCount++;
                    const progress = 10 + Math.round((processedCount / files.length) * 40);
                    this.updateProgress(progress, `파일 읽는 중... (${processedCount}/${files.length})`);
                    
                } catch (fileError) {
                    console.error(`❌ ${file.name} 처리 실패:`, fileError);
                    failedFiles.push({ 
                        name: file.name, 
                        reason: fileError.message || '파싱 실패'
                    });
                    processedCount++;
                }
            }
            
            console.log(`📊 처리 완료: 성공 ${successCount}개, 실패 ${failedFiles.length}개`);
            
            if (allOriginalPositions.length === 0) {
                const errorMsg = `⚠️ 모든 파일(${files.length}개)에서 데이터를 읽을 수 없습니다.`;
                throw new Error(errorMsg);
            }
            
            // 익명화 프리뷰 생성
            const anonymizationPreview = window.dataAnonymizer.generatePreview(allOriginalPositions);
            
            // 임시 데이터 저장
            this.tempUploadData = {
                original: allOriginalPositions,
                anonymized: window.dataAnonymizer.anonymizePositions(allOriginalPositions).anonymized,
                mapping: {},
                fileName: `${files.length}개 파일`,
                isFolder: true,
                fileCount: files.length,
                successCount: successCount
            };
            
            // 익명화 승인 모달 표시
            if (window.modalManager) {
                window.modalManager.showAnonymizationApprovalModal(anonymizationPreview);
            }
            
            if (progressDiv) {
                progressDiv.classList.add('hidden');
            }
            
            console.log('✅ 업로드 준비 완료 - 익명화 승인 대기 중');
            
        } catch (error) {
            console.error('❌ 파일 업로드 오류:', error);
            
            this.updateProgress(0, '오류 발생');
            
            setTimeout(() => {
                if (window.uiManager) {
                    window.uiManager.showErrorMessage(error.message);
                }
                if (progressDiv) {
                    progressDiv.classList.add('hidden');
                }
                
                // Input 초기화
                const folderInput = document.getElementById('folderInput');
                if (folderInput) {
                    folderInput.value = '';
                }
                
                const excelInput = document.getElementById('excelFileInput');
                if (excelInput) {
                    excelInput.value = '';
                }
            }, 500);
        }
    }

    /**
     * 진행률 업데이트
     */
    updateProgress(percentage, message = '') {
        const progressBar = document.getElementById('uploadProgressBar');
        const progressPercentage = document.getElementById('uploadPercentage');
        const uploadStatus = document.getElementById('uploadStatus');
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        if (progressPercentage) {
            progressPercentage.textContent = `${percentage}%`;
        }
        
        if (uploadStatus && message) {
            uploadStatus.textContent = message;
        }
        
        console.log(`📊 진행률: ${percentage}% - ${message}`);
    }

    /**
     * 임시 업로드 데이터 조회
     */
    getTempUploadData() {
        return this.tempUploadData;
    }

    /**
     * 임시 업로드 데이터 초기화
     */
    clearTempUploadData() {
        this.tempUploadData = null;
        this.selectedFiles = [];
        console.log('🗑️ 임시 업로드 데이터 초기화');
    }
}

// 전역 인스턴스
window.uploadHandler = new UploadHandler();
console.log('✅ Upload Handler 로드 완료');
