/**
 * Folder Manager - 로컬 폴더 설정 및 관리
 * File System Access API + IndexedDB
 */

class FolderManager {
    constructor() {
        this.dbName = 'HedgeDashboardDB';
        this.dbVersion = 1;
        this.db = null;
        
        this.folderHandles = {
            원본: null,
            결과: null
        };
        
        console.log('📁 FolderManager 초기화');
        this.initDB();
    }
    
    /**
     * IndexedDB 초기화
     */
    async initDB() {
        try {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = () => {
                    console.warn('⚠️ IndexedDB 열기 실패 (선택적 기능):', request.error);
                    // 에러를 reject하지 않고 resolve - 앱 계속 실행
                    resolve(null);
                };
                
                request.onsuccess = () => {
                    this.db = request.result;
                    console.log('✅ IndexedDB 연결 성공');
                    resolve(this.db);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                
                    if (!db.objectStoreNames.contains('folderHandles')) {
                        db.createObjectStore('folderHandles', { keyPath: 'type' });
                        console.log('✅ folderHandles 스토어 생성');
                    }
                };
            });
        } catch (error) {
            console.warn('⚠️ IndexedDB 초기화 실패 (선택적 기능):', error);
            return null;
        }
    }
    
    /**
     * 폴더 선택 및 저장
     */
    async setupLocalFolder(folderType) {
        if (!('showDirectoryPicker' in window)) {
            throw new Error('이 브라우저는 폴더 선택을 지원하지 않습니다. Chrome/Edge를 사용해주세요.');
        }
        
        try {
            const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });
            
            console.log(`✅ ${folderType} 폴더 선택:`, dirHandle.name);
            
            this.folderHandles[folderType] = dirHandle;
            
            // IndexedDB에 저장
            await this.saveFolderHandle(folderType, dirHandle);
            
            window.eventBus.emit(window.EventTypes.FOLDER_SETUP_COMPLETED, {
                folderType: folderType,
                folderName: dirHandle.name
            });
            
            return dirHandle;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('사용자가 폴더 선택을 취소했습니다');
            } else {
                console.error('❌ 폴더 선택 실패:', error);
            }
            throw error;
        }
    }
    
    /**
     * 폴더 핸들 IndexedDB에 저장
     */
    async saveFolderHandle(type, dirHandle) {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['folderHandles'], 'readwrite');
            const store = transaction.objectStore('folderHandles');
            
            const request = store.put({
                type: type,
                handle: dirHandle,
                savedAt: new Date().toISOString()
            });
            
            request.onsuccess = () => {
                console.log(`✅ ${type} 폴더 핸들 저장 완료`);
                resolve();
            };
            
            request.onerror = () => {
                console.error(`❌ ${type} 폴더 핸들 저장 실패:`, request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * 저장된 폴더 핸들 복원
     */
    async restoreFolderHandles() {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['folderHandles'], 'readonly');
            const store = transaction.objectStore('folderHandles');
            const request = store.getAll();
            
            request.onsuccess = async () => {
                const savedHandles = request.result;
                console.log(`📂 저장된 폴더 핸들: ${savedHandles.length}개`);
                
                for (const saved of savedHandles) {
                    try {
                        // 권한 확인
                        const permission = await saved.handle.queryPermission({ mode: 'readwrite' });
                        
                        if (permission === 'granted') {
                            this.folderHandles[saved.type] = saved.handle;
                            console.log(`✅ ${saved.type} 폴더 복원 성공`);
                        } else {
                            console.log(`⚠️ ${saved.type} 폴더 권한 필요: ${permission}`);
                            // 권한 요청
                            const newPermission = await saved.handle.requestPermission({ mode: 'readwrite' });
                            if (newPermission === 'granted') {
                                this.folderHandles[saved.type] = saved.handle;
                                console.log(`✅ ${saved.type} 폴더 권한 승인됨`);
                            }
                        }
                    } catch (error) {
                        console.warn(`⚠️ ${saved.type} 폴더 복원 실패:`, error);
                    }
                }
                
                resolve(this.folderHandles);
            };
            
            request.onerror = () => {
                console.error('❌ 폴더 핸들 복원 실패:', request.error);
                reject(request.error);
            };
        });
    }
    
    /**
     * 폴더에 파일 저장
     */
    async saveFileToFolder(folderType, fileName, content) {
        const dirHandle = this.folderHandles[folderType];
        
        if (!dirHandle) {
            throw new Error(`${folderType} 폴더가 설정되지 않았습니다`);
        }
        
        try {
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            
            if (typeof content === 'string') {
                await writable.write(content);
            } else {
                await writable.write(new Blob([content]));
            }
            
            await writable.close();
            
            console.log(`✅ 파일 저장 완료: ${folderType}/${fileName}`);
            
            window.eventBus.emit(window.EventTypes.FILE_SAVED, {
                folderType: folderType,
                fileName: fileName
            });
            
            return true;
            
        } catch (error) {
            console.error(`❌ 파일 저장 실패:`, error);
            throw error;
        }
    }
    
    /**
     * 폴더에서 파일 읽기
     */
    async readFileFromFolder(folderType, fileName) {
        const dirHandle = this.folderHandles[folderType];
        
        if (!dirHandle) {
            throw new Error(`${folderType} 폴더가 설정되지 않았습니다`);
        }
        
        try {
            const fileHandle = await dirHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            const content = await file.text();
            
            console.log(`✅ 파일 읽기 완료: ${folderType}/${fileName}`);
            
            return content;
            
        } catch (error) {
            console.error(`❌ 파일 읽기 실패:`, error);
            throw error;
        }
    }
    
    /**
     * 폴더 설정 상태 확인
     */
    isFolderSetup(folderType) {
        return this.folderHandles[folderType] !== null;
    }
    
    /**
     * 모든 폴더 설정 확인
     */
    areAllFoldersSetup() {
        return this.isFolderSetup('원본') && this.isFolderSetup('결과');
    }
}

// 전역 인스턴스
window.folderManager = new FolderManager();

console.log('✅ Folder Manager 로드 완료');
