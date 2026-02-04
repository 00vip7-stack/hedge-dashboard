/**
 * Event Bus - 중앙 이벤트 관리 시스템
 * 모든 모듈 간 통신을 담당
 */

class EventBus {
    constructor() {
        this.listeners = {};
    }
    
    /**
     * 이벤트 구독
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        
        // 구독 해제 함수 반환
        return () => {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        };
    }
    
    /**
     * 이벤트 발행
     */
    emit(event, data) {
        console.log(`📢 Event: ${event}`, data);
        
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Event handler error for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * 한 번만 실행되는 이벤트 구독
     */
    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }
    
    /**
     * 이벤트 구독 해제
     */
    off(event, callback) {
        if (this.listeners[event]) {
            if (callback) {
                this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
            } else {
                delete this.listeners[event];
            }
        }
    }
}

// 전역 이벤트 버스 인스턴스
window.EventBus = EventBus;
window.eventBus = new EventBus();

// 이벤트 타입 정의
window.EventTypes = {
    // 데이터 관련
    DATA_LOADED: 'data:loaded',
    DATA_UPDATED: 'data:updated',
    DATA_DELETED: 'data:deleted',
    
    // 파일 업로드
    FILE_SELECTED: 'file:selected',
    FILE_UPLOADED: 'file:uploaded',
    FOLDER_SELECTED: 'folder:selected',
    FOLDER_UPLOADED: 'folder:uploaded',
    
    // 계산 관련
    CALCULATION_STARTED: 'calc:started',
    CALCULATION_COMPLETED: 'calc:completed',
    CALCULATION_FAILED: 'calc:failed',
    
    // UI 업데이트
    UI_RENDER_POSITIONS: 'ui:render:positions',
    UI_RENDER_KPI: 'ui:render:kpi',
    UI_RENDER_SUGGESTIONS: 'ui:render:suggestions',
    UI_SHOW_MODAL: 'ui:show:modal',
    UI_HIDE_MODAL: 'ui:hide:modal',
    UI_PROGRESS: 'ui:progress',
    
    // 설정 관련
    SETTINGS_UPDATED: 'settings:updated',
    TARGET_RATIO_CHANGED: 'settings:targetRatio:changed',
    
    // 에러
    ERROR_OCCURRED: 'error:occurred',
};

console.log('✅ Event Bus 초기화 완료');
