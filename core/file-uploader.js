/**
 * File Uploader - 파일/폴더 업로드 처리
 * 익명화 자동 처리
 */

class FileUploader {
    constructor() {
        console.log('📤 FileUploader 초기화');
    }
    
    /**
     * 단일 파일 업로드
     */
    async uploadSingleFile(file) {
        console.log(`📤 단일 파일 업로드: ${file.name}`);
        
        try {
            // Excel 파일 파싱 (원본 + 익명화)
            const { original, anonymized } = await window.excelParser.readExcelFile(file);
            
            // 데이터 매니저에 저장
            window.dataManager.addPositions(original, anonymized);
            
            // 서버에 익명화된 데이터만 전송
            await window.apiClient.uploadAnonymizedPositions(anonymized, {
                fileName: file.name,
                fileSize: file.size,
                uploadType: 'single'
            });
            
            window.eventBus.emit(window.EventTypes.FILE_UPLOADED, {
                fileName: file.name,
                count: original.length
            });
            
            return { original, anonymized };
            
        } catch (error) {
            console.error('❌ 파일 업로드 실패:', error);
            throw error;
        }
    }
    
    /**
     * 폴더 업로드 (여러 파일)
     */
    async uploadFolder(files) {
        console.log(`📁 폴더 업로드: ${files.length}개 파일`);
        
        const allOriginal = [];
        const allAnonymized = [];
        const results = [];
        
        for (const file of files) {
            try {
                // Excel 파일만 처리
                if (!file.name.match(/\.(xlsx?|csv)$/i)) {
                    console.log(`⏭️ ${file.name} 건너뜀 (Excel 파일 아님)`);
                    continue;
                }
                
                console.log(`📄 처리 중: ${file.name}`);
                
                // 파일 파싱
                const { original, anonymized } = await window.excelParser.readExcelFile(file);
                
                allOriginal.push(...original);
                allAnonymized.push(...anonymized);
                
                results.push({
                    fileName: file.name,
                    success: true,
                    count: original.length
                });
                
            } catch (error) {
                console.error(`❌ ${file.name} 처리 실패:`, error);
                
                results.push({
                    fileName: file.name,
                    success: false,
                    error: error.message
                });
            }
        }
        
        // 데이터 매니저에 저장
        if (allOriginal.length > 0) {
            window.dataManager.addPositions(allOriginal, allAnonymized);
            
            // 서버에 익명화된 데이터만 전송
            await window.apiClient.uploadAnonymizedPositions(allAnonymized, {
                uploadType: 'folder',
                fileCount: results.filter(r => r.success).length
            });
        }
        
        window.eventBus.emit(window.EventTypes.FOLDER_UPLOADED, {
            totalFiles: files.length,
            successCount: results.filter(r => r.success).length,
            totalPositions: allOriginal.length
        });
        
        return {
            original: allOriginal,
            anonymized: allAnonymized,
            results: results
        };
    }
    
    /**
     * 드래그 앤 드롭 파일 처리
     */
    async handleDroppedFiles(dataTransfer) {
        const files = [];
        
        // 파일 수집
        if (dataTransfer.items) {
            for (let i = 0; i < dataTransfer.items.length; i++) {
                const item = dataTransfer.items[i];
                
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    files.push(file);
                }
            }
        } else {
            for (let i = 0; i < dataTransfer.files.length; i++) {
                files.push(dataTransfer.files[i]);
            }
        }
        
        console.log(`🎯 드롭된 파일: ${files.length}개`);
        
        if (files.length === 0) {
            throw new Error('파일을 찾을 수 없습니다');
        }
        
        // 단일 파일 vs 여러 파일
        if (files.length === 1) {
            return await this.uploadSingleFile(files[0]);
        } else {
            return await this.uploadFolder(files);
        }
    }
    
    /**
     * 파일 선택 다이얼로그
     */
    async showFilePicker() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx,.xls,.csv';
            input.multiple = false;
            
            input.onchange = async (e) => {
                try {
                    const file = e.target.files[0];
                    if (file) {
                        const result = await this.uploadSingleFile(file);
                        resolve(result);
                    } else {
                        reject(new Error('파일이 선택되지 않았습니다'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            input.click();
        });
    }
    
    /**
     * 폴더 선택 다이얼로그
     */
    async showFolderPicker() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx,.xls,.csv';
            input.multiple = true;
            input.webkitdirectory = true;
            
            input.onchange = async (e) => {
                try {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                        const result = await this.uploadFolder(files);
                        resolve(result);
                    } else {
                        reject(new Error('파일이 선택되지 않았습니다'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            input.click();
        });
    }
}

// 전역 인스턴스
window.fileUploader = new FileUploader();

console.log('✅ File Uploader 로드 완료');
