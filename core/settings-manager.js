/**
 * Settings Manager - 설정 및 폴더 관리
 * hedge-manager.html에서 분리된 모듈
 */

class SettingsManager {
    constructor() {
        this.targetHedgeRatio = 0.75; // 기본값: 75%
        console.log('⚙️ Settings Manager 초기화');
    }

    /**
     * 목표 헤지 비율 조회
     */
    async getTargetHedgeRatio() {
        try {
            // localStorage에서 먼저 시도
            const stored = localStorage.getItem('target_hedge_ratio');
            if (stored) {
                this.targetHedgeRatio = parseFloat(stored);
                console.log(`💾 localStorage에서 목표 헤지 비율 로드: ${this.targetHedgeRatio}`);
                return this.targetHedgeRatio;
            }

            // 기본값 사용
            return this.targetHedgeRatio;
        } catch (error) {
            console.warn('⚠️ 목표 헤지 비율 로드 실패:', error);
            return this.targetHedgeRatio;
        }
    }

    /**
     * 목표 헤지 비율 설정
     */
    async setTargetHedgeRatio(ratio, updateServer = true) {
        try {
            // 유효성 검사
            if (ratio < 0 || ratio > 1) {
                throw new Error('헤지 비율은 0~1 사이의 값이어야 합니다');
            }

            this.targetHedgeRatio = ratio;

            // localStorage에 저장
            localStorage.setItem('target_hedge_ratio', ratio.toString());
            console.log(`✅ 목표 헤지 비율 저장: ${ratio}`);

            // UI 업데이트
            const input = document.getElementById('targetRatioInput');
            if (input) {
                input.value = (ratio * 100).toFixed(0);
            }

            // 서버에도 업데이트 (선택사항)
            if (updateServer && window.apiClient) {
                try {
                    await window.apiClient.updateSettings({
                        targetHedgeRatio: ratio
                    });
                    console.log('✅ 서버에 설정 저장');
                } catch (error) {
                    console.warn('⚠️ 서버 저장 실패 (로컬에는 저장됨):', error);
                }
            }

            return ratio;
        } catch (error) {
            console.error('❌ 목표 헤지 비율 설정 실패:', error);
            throw error;
        }
    }

    /**
     * 폴더 설정 확인
     */
    isFoldersSetup() {
        const isSetup = localStorage.getItem('hedge_folders_setup') === 'true';
        console.log(`🔍 폴더 설정 확인: ${isSetup ? '✅ 설정됨' : '❌ 미설정'}`);
        return isSetup;
    }

    /**
     * 폴더 설정 표시
     */
    markFoldersSetup() {
        localStorage.setItem('hedge_folders_setup', 'true');
        console.log('✅ 폴더 설정 완료 표시');
    }

    /**
     * 온보딩 완료 확인
     */
    isOnboardingCompleted() {
        const isCompleted = localStorage.getItem('hedge_onboarding_completed') === 'true';
        console.log(`🔍 온보딩 확인: ${isCompleted ? '✅ 완료' : '❌ 미완료'}`);
        return isCompleted;
    }

    /**
     * 브라우저 저장소 상태 확인
     */
    checkStorageAvailability() {
        const status = {
            localStorage: false,
            indexedDB: false,
            fileSystemAccess: false
        };

        // localStorage 확인
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            status.localStorage = true;
        } catch (error) {
            console.warn('⚠️ localStorage 사용 불가:', error.message);
        }

        // IndexedDB 확인
        try {
            if (window.indexedDB) {
                status.indexedDB = true;
            }
        } catch (error) {
            console.warn('⚠️ IndexedDB 사용 불가:', error.message);
        }

        // File System Access API 확인
        try {
            if (window.showDirectoryPicker) {
                status.fileSystemAccess = true;
            }
        } catch (error) {
            console.warn('⚠️ File System Access API 사용 불가:', error.message);
        }

        console.log('📊 저장소 상태:', status);
        return status;
    }

    /**
     * 폴더 API 지원 확인
     */
    checkFolderAPISupport() {
        const supported = 'showDirectoryPicker' in window;
        const message = supported
            ? '✅ File System Access API 지원 (Chrome, Edge)'
            : '❌ 지원하지 않음 (Safari, Firefox)';

        console.log('🔍 폴더 API 지원:', message);
        return supported;
    }

    /**
     * 폴더 선택 (File System Access API)
     */
    async selectFolder() {
        try {
            if (!this.checkFolderAPISupport()) {
                throw new Error('현재 브라우저가 폴더 선택을 지원하지 않습니다. Chrome이나 Edge를 사용해주세요.');
            }

            const dirHandle = await window.showDirectoryPicker();

            console.log(`📂 폴더 선택 완료: ${dirHandle.name}`);

            // 선택된 폴더 정보 저장
            localStorage.setItem('hedge_root_folder_name', dirHandle.name);

            return dirHandle;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('⚠️ 폴더 선택 취소');
            } else {
                console.error('❌ 폴더 선택 실패:', error);
            }
            throw error;
        }
    }

    /**
     * 설정 초기화 (개발용)
     */
    resetSettings() {
        const keysToRemove = [
            'hedge_folders_setup',
            'hedge_onboarding_completed',
            'target_hedge_ratio',
            'hedge_root_folder_name'
        ];

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });

        console.log('🔄 모든 설정 초기화 완료');
    }
}

// 전역 인스턴스
window.settingsManager = new SettingsManager();
console.log('✅ Settings Manager 로드 완료');
