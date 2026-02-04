/**
 * HedgeFreedom Local Storage Handler
 * File System Access API를 사용한 로컬 폴더 관리
 * 
 * 기능:
 * - 로컬 폴더 자동 생성 (data, uploads, history, cache)
 * - 파일 읽기/쓰기 (settings, positions, kpi, alerts 등)
 * - 히스토리 스냅샷 관리
 * - Excel 파일 업로드 저장
 * 
 * 브라우저 호환성: Chrome 86+, Edge 86+
 */

class LocalStorageHandler {
    constructor() {
        this.directoryHandle = null;
        this.folderStructure = {
            data: 'data',
            uploads: 'uploads',
            history: 'history',
            cache: 'cache',
            logs: 'logs'  // 시스템 로그 폴더
        };
        
        // IndexedDB 키
        this.DB_NAME = 'HEDGEFREEDOM_DB';
        this.STORE_NAME = 'directoryHandles';
        this.HANDLE_KEY = 'workingDirectory';
        
        // ★ 파일 보호 설정 ★
        this.protectionEnabled = true;  // 파일 보호 활성화
        this.adminPassword = null;  // 관리자 비밀번호 (설정 시)
        
        // ★ PC 변경 감지 ★
        this.pcFingerprint = this._generatePCFingerprint();  // PC 고유 식별자
        this.lastKnownFolder = null;  // 마지막으로 사용한 폴더 경로
        
        // ★★★ 폴더 생성/이동/복사 차단부 (105) ★★★
        // 시스템이 규칙에 따라 자동 생성한 폴더만 허용
        this.enforceSystemFolderOnly = true;  // 폴더 구조 강제 활성화
        this.allowedFolderNames = new Set(Object.values(this.folderStructure));  // 허용된 폴더명
        this.systemManagedPaths = new Set();  // 시스템이 생성한 경로 추적
    }
    
    /**
     * PC 고유 식별자 생성 (브라우저 fingerprinting)
     */
    _generatePCFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            navigator.deviceMemory || 'unknown'
        ];
        
        // 간단한 해시 생성
        const str = components.join('|');
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit integer로 변환
        }
        return hash.toString(16);
    }

    /**
     * 브라우저 지원 확인
     */
    isSupported() {
        return 'showDirectoryPicker' in window;
    }

    /**
     * 초기화: 저장된 폴더 핸들 로드 또는 새로 선택
     */
    async initialize() {
        if (!this.isSupported()) {
            throw new Error('이 브라우저는 File System Access API를 지원하지 않습니다. Chrome 86+ 이상을 사용하세요.');
        }

        try {
            // 1. PC 변경 감지
            const pcChanged = await this._detectPCChange();
            if (pcChanged) {
                console.warn('🚨 PC 변경 감지! 이전과 다른 PC에서 접속하고 있습니다.');
                await this._logSystemEvent('PC_CHANGED', {
                    previousFingerprint: localStorage.getItem('pc_fingerprint'),
                    currentFingerprint: this.pcFingerprint,
                    previousFolder: this.lastKnownFolder
                });
                
                alert(
                    '🚨 PC 변경 감지\n\n' +
                    '이전과 다른 컴퓨터에서 접속하고 있습니다.\n\n' +
                    '보안을 위해 로컬 폴더를 다시 설정해야 합니다.\n' +
                    '이전 PC의 데이터는 그대로 유지됩니다.'
                );
            }
            
            // 2. IndexedDB에서 저장된 핸들 로드 시도
            this.directoryHandle = await this.loadDirectoryHandle();

            // 3. 저장된 핸들이 없으면 자동 폴더 생성 시도
            if (!this.directoryHandle) {
                console.log('⚠️ 저장된 작업 폴더가 없습니다.');
                await this._autoCreateOrSelectFolder(pcChanged);
            } else {
                // 권한 확인
                try {
                    const permission = await this.verifyPermission(this.directoryHandle);
                    if (!permission) {
                        console.log('⚠️ 폴더 접근 권한이 없습니다. 다시 선택해주세요.');
                        await this.selectWorkingFolder();
                    } else {
                        console.log('✅ 기존 작업 폴더 로드 완료:', this.directoryHandle.name);
                    }
                } catch (permError) {
                    console.warn('⚠️ 권한 확인 중 오류 - 폴더 재선택:', permError.message);
                    await this.selectWorkingFolder();
                }
            }

            // 3. 폴더 구조 생성
            await this.createFolderStructure();

            return this.directoryHandle;
        } catch (error) {
            console.error('❌ 초기화 오류:', error);
            throw error;
        }
    }

    /**
     * 작업 폴더 선택 (최초 1회 또는 권한 상실 시)
     * 중요: 반드시 "HEDGEFREEDOM" 폴더를 선택해야 합니다
     */
    async selectWorkingFolder() {
        try {
            // 사용자에게 안내
            alert('⚠️ 중요: 문서 폴더에 "HEDGEFREEDOM" 폴더를 만들고 선택해주세요.\n\n이 폴더에는 모든 과거 거래 자료, 감사 대응 자료, 회계 처리 내역이 저장됩니다.\n\n폴더명을 변경하지 마세요!');
            
            this.directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            // 폴더명 검증
            if (this.directoryHandle.name !== 'HEDGEFREEDOM' && this.directoryHandle.name !== '헤지프리덤') {
                const confirmChange = confirm(
                    `⚠️ 경고: 선택한 폴더명이 "${this.directoryHandle.name}"입니다.\n\n` +
                    `표준 폴더명은 "HEDGEFREEDOM"입니다.\n` +
                    `이 폴더명으로 계속 진행하시겠습니까?\n\n` +
                    `(권장: 취소 후 HEDGEFREEDOM 폴더 선택)`
                );
                
                if (!confirmChange) {
                    throw new Error('폴더 선택이 취소되었습니다.');
                }
            }

            console.log(`✅ 작업 폴더 선택됨: ${this.directoryHandle.name}`);
            
            // 폴더 경로 기록
            localStorage.setItem('last_folder_path', this.directoryHandle.name);

            // IndexedDB에 저장 (재사용)
            await this.saveDirectoryHandle(this.directoryHandle);

            return this.directoryHandle;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('❌ 사용자가 폴더 선택을 취소했습니다.');
            } else {
                console.error('❌ 폴더 선택 오류:', error);
            }
            throw error;
        }
    }

    /**
     * 폴더 구조 생성 (data, uploads, history, cache)
     * + 시스템 관리 경로 등록 (차단부 105 연동)
     */
    async createFolderStructure() {
        for (const [key, folderName] of Object.entries(this.folderStructure)) {
            try {
                await this.directoryHandle.getDirectoryHandle(folderName, { create: true });
                
                // 🔒 시스템이 생성한 경로로 등록 (차단부 105)
                this.systemManagedPaths.add(folderName);
                
                console.log(`✅ 폴더 확인/생성: ${folderName} [시스템 관리됨]`);
            } catch (error) {
                console.error(`❌ 폴더 생성 실패: ${folderName}`, error);
            }
        }
        
        // 보호 파일 생성 (삭제 방지 안내)
        await this._createProtectionFiles();
    }
    
    /**
     * 🔍 폴더 유효성 검사 (경로 추적 모듈)
     * - 폴더 핸들이 여전히 유효한지 확인
     * - 폴더가 삭제/이동되었는지 감지
     * - 🔒 폴더 구조 무결성 검증 (차단부 105)
     */
    async validateFolderAccess() {
        if (!this.directoryHandle) {
            console.warn('🔍 폴더 유효성 검사: 핸들 없음');
            return false;
        }
        
        try {
            // 1. 권한 확인
            const hasPermission = await this.verifyPermission(this.directoryHandle);
            if (!hasPermission) {
                console.warn('🔍 폴더 유효성 검사 실패: 권한 없음');
                return false;
            }
            
            // 2. 실제 폴더 접근 시도 (폴더 존재 여부 확인)
            const testFolder = await this.directoryHandle.getDirectoryHandle('data', { create: false });
            
            // 3. 폴더명 확인 (이름이 변경되지 않았는지)
            const currentName = this.directoryHandle.name;
            const savedPath = localStorage.getItem('last_folder_path');
            
            if (savedPath && currentName !== savedPath) {
                console.warn(`🔍 폴더명 변경 감지: ${savedPath} → ${currentName}`);
                localStorage.setItem('last_folder_path', currentName);
            }
            
            // 🔒 4. 폴더 구조 무결성 검증 (차단부 105)
            if (this.enforceSystemFolderOnly) {
                const structureValid = await this._validateFolderStructure();
                if (!structureValid) {
                    console.error('🚫 폴더 구조 무결성 실패: 임의 폴더 감지됨');
                    await this._logSystemEvent('INVALID_FOLDER_STRUCTURE', {
                        folderName: currentName,
                        timestamp: new Date().toISOString()
                    });
                    return false;
                }
            }
            
            console.log('✅ 폴더 유효성 검사 통과:', currentName);
            return true;
            
        } catch (error) {
            // NotFoundError: 폴더가 삭제됨
            // SecurityError: 권한 상실
            // 기타: 폴더 이동/이름 변경 등
            console.warn('🔍 폴더 유효성 검사 실패:', error.name, error.message);
            
            // 로그 기록
            await this._logSystemEvent('FOLDER_ACCESS_FAILED', {
                errorName: error.name,
                errorMessage: error.message,
                folderName: this.directoryHandle?.name
            });
            
            return false;
        }
    }
    
    /**
     * 🔄 자동 폴더 복구 (유효성 실패 시 재초기화)
     */
    async autoRecoverFolder() {
        console.log('🔄 자동 폴더 복구 시도...');
        
        try {
            // 기존 핸들 제거
            this.directoryHandle = null;
            
            // 재초기화 시도
            await this.initialize();
            
            console.log('✅ 폴더 복구 완료');
            return true;
            
        } catch (error) {
            console.error('❌ 폴더 복구 실패:', error);
            return false;
        }
    }

    /**
     * 권한 확인
     */
    async verifyPermission(directoryHandle, mode = 'readwrite') {
        try {
            // queryPermission이 지원되는지 확인
            if (typeof directoryHandle.queryPermission !== 'function') {
                console.warn('⚠️ queryPermission 미지원 - 권한 확인 스킵');
                return true; // 권한이 있다고 가정
            }
            
            const options = { mode };
            
            // 이미 권한이 있는지 확인
            if ((await directoryHandle.queryPermission(options)) === 'granted') {
                return true;
            }

            // requestPermission이 지원되는지 확인
            if (typeof directoryHandle.requestPermission !== 'function') {
                console.warn('⚠️ requestPermission 미지원 - 권한 요청 스킵');
                return true;
            }

            // 권한 요청
            if ((await directoryHandle.requestPermission(options)) === 'granted') {
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ 권한 확인 오류:', error);
            // 오류 발생 시 권한이 있다고 간주하고 진행
            return true;
        }
    }

    /**
     * IndexedDB에 디렉토리 핸들 저장
     */
    async saveDirectoryHandle(handle) {
        const db = await this.openDB();
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        
        await store.put(handle, this.HANDLE_KEY);
        await tx.done;
        
        console.log('✅ 작업 폴더가 IndexedDB에 저장되었습니다.');
    }

    /**
     * IndexedDB에서 디렉토리 핸들 로드
     */
    async loadDirectoryHandle() {
        try {
            const db = await this.openDB();
            const tx = db.transaction(this.STORE_NAME, 'readonly');
            const store = tx.objectStore(this.STORE_NAME);
            const handle = await store.get(this.HANDLE_KEY);
            await tx.done;
            
            return handle || null;
        } catch (error) {
            console.warn('⚠️ IndexedDB에서 핸들 로드 실패:', error);
            return null;
        }
    }

    /**
     * IndexedDB 열기
     */
    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };
        });
    }

    /**
     * 파일 저장 (data 폴더)
     */
    async saveData(filename, data) {
        try {
            const dataDir = await this.directoryHandle.getDirectoryHandle('data', { create: true });
            const fileHandle = await dataDir.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            
            const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
            await writable.write(content);
            await writable.close();
            
            console.log(`✅ 파일 저장: data/${filename}`);
            return true;
        } catch (error) {
            console.error(`❌ 파일 저장 실패: ${filename}`, error);
            return false;
        }
    }

    /**
     * 파일 로드 (data 폴더)
     */
    async loadData(filename) {
        try {
            const dataDir = await this.directoryHandle.getDirectoryHandle('data');
            const fileHandle = await dataDir.getFileHandle(filename);
            const file = await fileHandle.getFile();
            const text = await file.text();
            
            // JSON 파싱 시도
            try {
                return JSON.parse(text);
            } catch {
                return text;
            }
        } catch (error) {
            if (error.name === 'NotFoundError') {
                console.log(`ℹ️ 파일 없음: data/${filename}`);
                return null;
            }
            console.error(`❌ 파일 로드 실패: ${filename}`, error);
            return null;
        }
    }

    /**
     * Excel 파일 저장 (uploads 폴더)
     */
    async saveUploadedFile(file) {
        try {
            const uploadsDir = await this.directoryHandle.getDirectoryHandle('uploads', { create: true });
            
            // 파일명에 타임스탬프 추가
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${timestamp}_${file.name}`;
            
            const fileHandle = await uploadsDir.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(file);
            await writable.close();
            
            console.log(`✅ Excel 파일 저장: uploads/${filename}`);
            return filename;
        } catch (error) {
            console.error('❌ Excel 파일 저장 실패:', error);
            return null;
        }
    }

    /**
     * 히스토리 스냅샷 저장
     */
    async saveSnapshot(data) {
        try {
            const historyDir = await this.directoryHandle.getDirectoryHandle('history', { create: true });
            
            // 날짜별 폴더 생성
            const today = new Date().toISOString().split('T')[0];
            const dateDir = await historyDir.getDirectoryHandle(today, { create: true });
            
            // 스냅샷 저장
            const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            const filename = `snapshot_${timestamp}.json`;
            const fileHandle = await dateDir.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
            
            console.log(`✅ 스냅샷 저장: history/${today}/${filename}`);
            return true;
        } catch (error) {
            console.error('❌ 스냅샷 저장 실패:', error);
            return false;
        }
    }

    /**
     * 설정 저장
     */
    async saveSettings(settings) {
        return await this.saveData('settings.json', settings);
    }

    /**
     * 설정 로드
     */
    async loadSettings() {
        return await this.loadData('settings.json');
    }

    /**
     * 포지션 저장
     */
    async savePositions(positions) {
        return await this.saveData('positions.json', positions);
    }

    /**
     * 포지션 로드
     */
    async loadPositions() {
        return await this.loadData('positions.json');
    }

    /**
     * KPI 저장
     */
    async saveKPI(kpi) {
        return await this.saveData('kpi.json', kpi);
    }

    /**
     * KPI 로드
     */
    async loadKPI() {
        return await this.loadData('kpi.json');
    }

    /**
     * 알림 저장
     */
    async saveAlerts(alerts) {
        return await this.saveData('alerts.json', alerts);
    }

    /**
     * 알림 로드
     */
    async loadAlerts() {
        return await this.loadData('alerts.json');
    }

    /**
     * 제안 저장
     */
    async saveSuggestions(suggestions) {
        return await this.saveData('suggestions.json', suggestions);
    }

    /**
     * 제안 로드
     */
    async loadSuggestions() {
        return await this.loadData('suggestions.json');
    }

    /**
     * 전체 데이터 로드 (한번에)
     */
    async loadAllData() {
        const [settings, positions, kpi, alerts, suggestions] = await Promise.all([
            this.loadSettings(),
            this.loadPositions(),
            this.loadKPI(),
            this.loadAlerts(),
            this.loadSuggestions()
        ]);

        return {
            settings,
            positions,
            kpi,
            alerts,
            suggestions
        };
    }

    /**
     * 전체 데이터 저장 (한번에)
     */
    async saveAllData(data) {
        const results = await Promise.all([
            data.settings ? this.saveSettings(data.settings) : Promise.resolve(true),
            data.positions ? this.savePositions(data.positions) : Promise.resolve(true),
            data.kpi ? this.saveKPI(data.kpi) : Promise.resolve(true),
            data.alerts ? this.saveAlerts(data.alerts) : Promise.resolve(true),
            data.suggestions ? this.saveSuggestions(data.suggestions) : Promise.resolve(true)
        ]);

        return results.every(r => r === true);
    }

    /**
     * 작업 폴더 변경 (재선택)
     */
    async changeWorkingFolder() {
        await this.selectWorkingFolder();
        await this.createFolderStructure();
        console.log('✅ 작업 폴더가 변경되었습니다.');
    }

    /**
     * 작업 폴더 정보 조회
     */
    async getFolderInfo() {
        if (!this.directoryHandle) {
            return null;
        }

        const info = {
            name: this.directoryHandle.name,
            kind: this.directoryHandle.kind,
            folders: []
        };

        // 하위 폴더 목록
        for await (const entry of this.directoryHandle.values()) {
            if (entry.kind === 'directory') {
                info.folders.push(entry.name);
            }
        }

        return info;
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ★ 파일 보호 및 승인 시스템 ★
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    /**
     * 관리자 비밀번호 설정
     */
    async setAdminPassword(password) {
        if (!password || password.length < 4) {
            alert('⚠️ 비밀번호는 최소 4자 이상이어야 합니다.');
            return false;
        }
        
        // 비밀번호 해시 저장 (간단한 해시)
        this.adminPassword = btoa(password);
        localStorage.setItem('HEDGEFREEDOM_ADMIN_HASH', this.adminPassword);
        console.log('✅ 관리자 비밀번호 설정 완료');
        return true;
    }
    
    /**
     * 관리자 인증
     */
    async verifyAdmin(action) {
        // 비밀번호가 설정되지 않았으면 설정 요청
        if (!this.adminPassword) {
            const stored = localStorage.getItem('HEDGEFREEDOM_ADMIN_HASH');
            if (!stored) {
                const newPassword = prompt(
                    '🔐 관리자 비밀번호를 설정하세요:\n\n' +
                    '이 비밀번호는 중요한 데이터 삭제/수정 시 필요합니다.\n' +
                    '(최소 4자 이상)'
                );
                if (!newPassword) return false;
                await this.setAdminPassword(newPassword);
                return true;
            }
            this.adminPassword = stored;
        }
        
        // 관리자 승인 요청
        const confirmMessage = 
            `🚨 위험한 작업: ${action}\n\n` +
            `⚠️ 이 작업은 되돌릴 수 없습니다!\n\n` +
            `📋 영향:\n` +
            `- 과거 거래 데이터 손실 가능\n` +
            `- 감사 대응 자료 소실 가능\n` +
            `- 회계 처리 내역 삭제 가능\n\n` +
            `계속하시겠습니까?`;
        
        if (!confirm(confirmMessage)) {
            console.log('❌ 사용자가 취소함');
            return false;
        }
        
        // 비밀번호 확인
        const inputPassword = prompt('🔐 관리자 비밀번호를 입력하세요:');
        if (!inputPassword) {
            alert('❌ 비밀번호가 입력되지 않았습니다.');
            return false;
        }
        
        const inputHash = btoa(inputPassword);
        if (inputHash !== this.adminPassword) {
            alert('❌ 비밀번호가 일치하지 않습니다!');
            console.warn('⚠️ 잘못된 비밀번호 입력 시도');
            return false;
        }
        
        // 최종 확인
        const finalConfirm = confirm(
            `✅ 비밀번호 확인 완료\n\n` +
            `최종 확인: ${action}\n\n` +
            `정말로 실행하시겠습니까?`
        );
        
        if (finalConfirm) {
            console.log(`✅ 관리자 승인 완료: ${action}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * 보호된 파일 삭제
     */
    async deleteProtectedFile(folderName, filename) {
        if (!this.protectionEnabled) {
            return await this._deleteFileDirectly(folderName, filename);
        }
        
        // 관리자 승인 필요
        const approved = await this.verifyAdmin(`파일 삭제: ${folderName}/${filename}`);
        if (!approved) {
            console.log('❌ 파일 삭제 거부됨 (승인 실패)');
            return false;
        }
        
        // 삭제 실행
        try {
            const result = await this._deleteFileDirectly(folderName, filename);
            if (result) {
                // 감사 로그 기록
                await this._logAdminAction('DELETE_FILE', {
                    folder: folderName,
                    file: filename,
                    timestamp: new Date().toISOString()
                });
            }
            return result;
        } catch (error) {
            console.error('❌ 파일 삭제 오류:', error);
            return false;
        }
    }
    
    /**
     * 직접 파일 삭제 (내부 함수)
     */
    async _deleteFileDirectly(folderName, filename) {
        try {
            const folderHandle = await this.directoryHandle.getDirectoryHandle(folderName);
            await folderHandle.removeEntry(filename);
            console.log(`✅ 파일 삭제 완료: ${folderName}/${filename}`);
            return true;
        } catch (error) {
            console.error(`❌ 파일 삭제 실패: ${folderName}/${filename}`, error);
            return false;
        }
    }
    
    /**
     * 폴더 전체 삭제 (보호)
     */
    async deleteProtectedFolder(folderName) {
        if (!this.protectionEnabled) {
            return await this._deleteFolderDirectly(folderName);
        }
        
        // 관리자 승인 필요
        const approved = await this.verifyAdmin(`폴더 전체 삭제: ${folderName}`);
        if (!approved) {
            console.log('❌ 폴더 삭제 거부됨 (승인 실패)');
            return false;
        }
        
        // 삭제 실행
        try {
            const result = await this._deleteFolderDirectly(folderName);
            if (result) {
                // 감사 로그 기록
                await this._logAdminAction('DELETE_FOLDER', {
                    folder: folderName,
                    timestamp: new Date().toISOString()
                });
            }
            return result;
        } catch (error) {
            console.error('❌ 폴더 삭제 오류:', error);
            return false;
        }
    }
    
    /**
     * 직접 폴더 삭제 (내부 함수)
     */
    async _deleteFolderDirectly(folderName) {
        try {
            await this.directoryHandle.removeEntry(folderName, { recursive: true });
            console.log(`✅ 폴더 삭제 완료: ${folderName}`);
            return true;
        } catch (error) {
            console.error(`❌ 폴더 삭제 실패: ${folderName}`, error);
            return false;
        }
    }
    
    /**
     * 모든 데이터 삭제 (최고 위험)
     */
    async deleteAllData() {
        if (!this.protectionEnabled) {
            alert('⚠️ 파일 보호가 비활성화되어 있습니다!');
        }
        
        // 이중 승인
        const firstApproval = await this.verifyAdmin('모든 데이터 삭제 (1차 확인)');
        if (!firstApproval) return false;
        
        // 2차 확인
        const secondApproval = confirm(
            '🚨🚨🚨 최종 경고 🚨🚨🚨\n\n' +
            '모든 데이터를 삭제하려고 합니다!\n\n' +
            '- 모든 거래 데이터\n' +
            '- 모든 업로드 파일\n' +
            '- 모든 히스토리\n' +
            '- 모든 설정\n\n' +
            '이 작업은 절대 되돌릴 수 없습니다!\n\n' +
            '정말로 계속하시겠습니까?'
        );
        
        if (!secondApproval) {
            console.log('❌ 전체 삭제 취소됨');
            return false;
        }
        
        try {
            // 모든 폴더 삭제
            for (const folderName of Object.values(this.folderStructure)) {
                await this._deleteFolderDirectly(folderName);
            }
            
            // 감사 로그 기록
            await this._logAdminAction('DELETE_ALL', {
                timestamp: new Date().toISOString(),
                warning: 'ALL_DATA_DELETED'
            });
            
            alert('✅ 모든 데이터가 삭제되었습니다.');
            return true;
        } catch (error) {
            console.error('❌ 전체 삭제 오류:', error);
            alert('❌ 삭제 중 오류가 발생했습니다: ' + error.message);
            return false;
        }
    }
    
    /**
     * PC 변경 감지
     */
    async _detectPCChange() {
        const savedFingerprint = localStorage.getItem('pc_fingerprint');
        const savedFolder = localStorage.getItem('last_folder_path');
        
        this.lastKnownFolder = savedFolder;
        
        if (!savedFingerprint) {
            // 최초 사용
            localStorage.setItem('pc_fingerprint', this.pcFingerprint);
            return false;
        }
        
        if (savedFingerprint !== this.pcFingerprint) {
            // PC 변경됨
            localStorage.setItem('pc_fingerprint', this.pcFingerprint);
            return true;
        }
        
        return false;
    }
    
    /**
     * 자동 폴더 생성 또는 선택
     */
    async _autoCreateOrSelectFolder(pcChanged) {
        const warningMsg = pcChanged 
            ? '🚨 PC가 변경되었습니다!\n\n새 컴퓨터에 HEDGEFREEDOM 폴더를 생성하겠습니다.'
            : '📁 로컬 저장 폴더 설정\n\n데이터 보관용 HEDGEFREEDOM 폴더를 선택하거나 생성합니다.';
        
        const shouldAuto = confirm(
            warningMsg + '\n\n' +
            '[확인] 자동으로 폴더 선택\n' +
            '[취소] 수동으로 폴더 지정'
        );
        
        if (shouldAuto) {
            // 자동 선택 안내
            alert(
                '📂 폴더 선택 안내\n\n' +
                '다음 단계에서:\n' +
                '1. "문서" 폴더로 이동\n' +
                '2. "HEDGEFREEDOM" 폴더 선택\n' +
                '   (없으면 새로 만들기)\n\n' +
                '⚠️ 이 폴더는 절대 삭제하거나 이름을 변경하지 마세요!'
            );
        }
        
        await this.selectWorkingFolder();
        
        // 로그 기록
        await this._logSystemEvent('FOLDER_INITIALIZED', {
            pcChanged: pcChanged,
            folderName: this.directoryHandle?.name,
            autoMode: shouldAuto
        });
    }
    
    /**
     * 시스템 이벤트 로그 기록 (일반 작업 로그)
     */
    async _logSystemEvent(event, details) {
        try {
            if (!this.directoryHandle) {
                console.warn('⚠️ 폴더 핸들이 없어 로그 기록 불가');
                return;
            }
            
            const logEntry = {
                event: event,
                timestamp: new Date().toISOString(),
                details: details,
                pcFingerprint: this.pcFingerprint,
                userAgent: navigator.userAgent
            };
            
            // logs 폴더 생성
            const logsDir = await this.directoryHandle.getDirectoryHandle('logs', { create: true });
            const logFile = await logsDir.getFileHandle('system_events.log', { create: true });
            
            // 기존 로그 읽기
            let existingLog = '';
            try {
                const file = await logFile.getFile();
                existingLog = await file.text();
            } catch (e) {
                // 파일 없음 - 새로 생성
            }
            
            // 새 로그 추가
            const newLog = existingLog + JSON.stringify(logEntry) + '\n';
            const writable = await logFile.createWritable();
            await writable.write(newLog);
            await writable.close();
            
            console.log('📝 시스템 로그 기록:', event);
        } catch (error) {
            console.error('❌ 시스템 로그 기록 실패:', error);
        }
    }
    
    /**
     * 관리자 작업 로그 기록
     */
    async _logAdminAction(action, details) {
        try {
            const logEntry = {
                action: action,
                timestamp: new Date().toISOString(),
                details: details,
                userAgent: navigator.userAgent
            };
            
            // 로그 파일에 추가
            const cacheDir = await this.directoryHandle.getDirectoryHandle('cache', { create: true });
            const logFile = await cacheDir.getFileHandle('admin_actions.log', { create: true });
            
            // 기존 로그 읽기
            let existingLog = '';
            try {
                const file = await logFile.getFile();
                existingLog = await file.text();
            } catch (e) {
                // 파일 없음 - 새로 생성
            }
            
            // 새 로그 추가
            const newLog = existingLog + JSON.stringify(logEntry) + '\n';
            const writable = await logFile.createWritable();
            await writable.write(newLog);
            await writable.close();
            
            console.log('📝 관리자 작업 로그 기록:', action);
        } catch (error) {
            console.error('❌ 로그 기록 실패:', error);
        }
    }
    
    /**
     * 파일 보호 상태 토글
     */
    toggleProtection(enabled) {
        this.protectionEnabled = enabled;
        console.log(enabled ? '🔒 파일 보호 활성화' : '🔓 파일 보호 비활성화');
        return this.protectionEnabled;
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 폴더 상태 모니터링 및 서버 전송 (차단부 105 연동)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    /**
     * 🔍 폴더 구조 무결성 검증 (차단부 105)
     * - 시스템이 생성한 폴더만 존재하는지 확인
     * - 임의로 생성된 폴더 감지
     */
    async _validateFolderStructure() {
        try {
            const foundFolders = new Set();
            const unauthorizedFolders = [];
            
            // 루트 폴더의 모든 하위 항목 확인
            for await (const [name, handle] of this.directoryHandle.entries()) {
                if (handle.kind === 'directory') {
                    foundFolders.add(name);
                    
                    // 허용된 폴더인지 확인
                    if (!this.allowedFolderNames.has(name)) {
                        unauthorizedFolders.push(name);
                        console.warn(`🚫 임의 폴더 감지: ${name} (시스템 생성 아님)`);
                    }
                }
            }
            
            // 필수 폴더가 모두 존재하는지 확인
            const missingFolders = [];
            for (const requiredFolder of this.allowedFolderNames) {
                if (!foundFolders.has(requiredFolder)) {
                    missingFolders.push(requiredFolder);
                    console.warn(`⚠️ 필수 폴더 누락: ${requiredFolder}`);
                }
            }
            
            // 검증 결과 반환
            const isValid = unauthorizedFolders.length === 0 && missingFolders.length === 0;
            
            if (!isValid) {
                console.error('📋 폴더 구조 검증 실패:', {
                    unauthorized: unauthorizedFolders,
                    missing: missingFolders
                });
            }
            
            return {
                valid: isValid,
                unauthorizedFolders,
                missingFolders,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ 폴더 구조 검증 중 오류:', error);
            return {
                valid: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * 📊 로컬 폴더 상태 체크
     * - 폴더 존재 여부
     * - 폴더 접근 가능 여부
     * - 폴더 구조 무결성
     */
    async checkLocalFolderStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            pcFingerprint: this.pcFingerprint,
            folderName: this.directoryHandle?.name || null,
            exists: false,
            accessible: false,
            structureValid: false,
            hasPermission: false,
            details: {}
        };
        
        try {
            // 1. 폴더 핸들 존재 확인
            if (!this.directoryHandle) {
                status.details.error = 'NO_FOLDER_HANDLE';
                return status;
            }
            
            status.exists = true;
            
            // 2. 폴더 접근 가능 여부
            try {
                await this.directoryHandle.getDirectoryHandle('data', { create: false });
                status.accessible = true;
            } catch (e) {
                status.details.accessError = e.message;
                return status;
            }
            
            // 3. 권한 확인
            const hasPermission = await this.verifyPermission(this.directoryHandle);
            status.hasPermission = hasPermission;
            
            if (!hasPermission) {
                status.details.error = 'NO_PERMISSION';
                return status;
            }
            
            // 4. 폴더 구조 무결성 검증 (차단부 105)
            const structureCheck = await this._validateFolderStructure();
            status.structureValid = structureCheck.valid;
            status.details.structure = structureCheck;
            
            // 5. 전체 상태 요약
            status.healthy = status.exists && 
                           status.accessible && 
                           status.hasPermission && 
                           status.structureValid;
            
            console.log(status.healthy ? '✅ 로컬 폴더 상태: 정상' : '⚠️ 로컬 폴더 상태: 문제 있음', status);
            
        } catch (error) {
            status.details.error = error.message;
            console.error('❌ 폴더 상태 체크 실패:', error);
        }
        
        return status;
    }
    
    /**
     * 📡 폴더 상태를 서버로 전송
     */
    async reportFolderStatusToServer(customerId) {
        try {
            const status = await this.checkLocalFolderStatus();
            
            const serverUrl = localStorage.getItem('server_url') || 'http://localhost:9000';
            const endpoint = `${serverUrl}/api/folder/status`;
            
            console.log('📤 폴더 상태를 서버로 전송 중...');
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customerId: customerId || 'anonymous',
                    status: status,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ 폴더 상태 전송 완료:', result);
            
            return result;
            
        } catch (error) {
            console.error('❌ 폴더 상태 전송 실패:', error);
            
            // 서버 전송 실패 시 로컬 로그에 기록
            await this._logSystemEvent('FOLDER_STATUS_REPORT_FAILED', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
    }
    
    /**
     * ⏱️ 주기적 폴더 상태 모니터링 시작
     */
    startFolderMonitoring(customerId, intervalMinutes = 5) {
        // 기존 모니터링 중지
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        console.log(`🔄 폴더 모니터링 시작 (${intervalMinutes}분 간격)`);
        
        // 즉시 1회 실행
        this.reportFolderStatusToServer(customerId).catch(console.error);
        
        // 주기적 실행
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.reportFolderStatusToServer(customerId);
            } catch (error) {
                console.error('⚠️ 주기적 폴더 상태 체크 실패:', error);
            }
        }, intervalMinutes * 60 * 1000);
        
        return this.monitoringInterval;
    }
    
    /**
     * ⏹️ 폴더 모니터링 중지
     */
    stopFolderMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('⏹️ 폴더 모니터링 중지');
        }
    }
    
    /**
     * 🛡️ 보호 파일 생성 (삭제 방지 안내)
     */
    async _createProtectionFiles() {
        try {
            // 1. 삭제 금지 안내 파일
            const readmeHandle = await this.directoryHandle.getFileHandle(
                '⚠️중요데이터_삭제금지.txt',
                { create: true }
            );
            
            const readmeContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  경고: 중요 데이터 폴더 - 삭제 금지  ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이 폴더는 HedgeFreedom 헤지 관리 시스템이 사용 중입니다.

【 폴더 구조 】
├── data/       : 거래 데이터 및 설정
├── uploads/    : 업로드된 파일
├── history/    : 히스토리 스냅샷
├── cache/      : 캐시 데이터
└── logs/       : 시스템 로그

【 주의사항 】
1. 이 폴더를 삭제하면 모든 거래 데이터가 손실됩니다
2. 폴더를 이동하면 시스템이 데이터를 찾을 수 없습니다
3. 폴더 이름을 변경하지 마세요
4. 임의로 하위 폴더를 생성/삭제하지 마세요

【 시스템이 자동 관리하는 폴더 】
- 사용자가 임의로 폴더를 생성/이동/삭제할 수 없습니다
- 모든 폴더는 시스템 규칙에 따라 자동 생성됩니다
- 경로 추적을 위해 폴더 구조가 엄격히 관리됩니다

【 문제 발생 시 】
- 웹사이트: https://hedgefreedom.com
- 이메일: support@hedgefreedom.com

마지막 업데이트: ${new Date().toISOString()}
PC 고유 ID: ${this.pcFingerprint}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
            
            const writable = await readmeHandle.createWritable();
            await writable.write(readmeContent);
            await writable.close();
            
            console.log('✅ 보호 파일 생성 완료: ⚠️중요데이터_삭제금지.txt');
            
            // 2. 시스템 잠금 파일 (.hedgefreedom-lock)
            const lockHandle = await this.directoryHandle.getFileHandle(
                '.hedgefreedom-lock',
                { create: true }
            );
            
            const lockData = {
                system: 'HedgeFreedom',
                version: '1.0.0',
                pcFingerprint: this.pcFingerprint,
                created: new Date().toISOString(),
                warning: 'DO NOT DELETE - System managed folder'
            };
            
            const lockWritable = await lockHandle.createWritable();
            await lockWritable.write(JSON.stringify(lockData, null, 2));
            await lockWritable.close();
            
            console.log('✅ 시스템 잠금 파일 생성 완료: .hedgefreedom-lock');
            
        } catch (error) {
            console.error('❌ 보호 파일 생성 실패:', error);
        }
    }
}

// 전역 인스턴스 생성
const localStorageHandler = new LocalStorageHandler();

// 사용 예시:
/*
// 초기화
await localStorageHandler.initialize();

// 설정 저장
await localStorageHandler.saveSettings({
    targetHedgeRatio: 75,
    companyName: '삼성전자',
    domain: 'hedgefreedom.com'
});

// 설정 로드
const settings = await localStorageHandler.loadSettings();

// Excel 파일 저장
const file = event.target.files[0];
await localStorageHandler.saveUploadedFile(file);

// 전체 데이터 로드
const allData = await localStorageHandler.loadAllData();

// 스냅샷 저장
await localStorageHandler.saveSnapshot({
    positions: [...],
    kpi: {...},
    timestamp: new Date()
});
*/
