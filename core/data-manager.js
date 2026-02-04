/**
 * Data Manager - 데이터 상태 관리
 * 원본/익명화 데이터 분리 관리
 */

class DataManager {
    constructor() {
        this.state = {
            originalPositions: [],      // 원본 데이터 (거래처명 포함)
            anonymizedPositions: [],    // 익명화된 데이터
            kpiData: null,
            suggestions: [],
            targetHedgeRatio: 80
        };
        
        console.log('💾 DataManager 초기화');
        this.loadFromLocalStorage();
        this.setupEventListeners();
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 파일 파싱 완료
        window.eventBus.on(window.EventTypes.FILE_PARSED, (data) => {
            console.log('📊 파일 파싱 완료 이벤트 수신');
        });
        
        // 계산 완료
        window.eventBus.on(window.EventTypes.CALCULATION_COMPLETED, (data) => {
            console.log('🧮 계산 완료 이벤트 수신');
            if (data.result) {
                this.updateKPI(data.result);
            }
        });
    }
    
    /**
     * 포지션 데이터 추가
     */
    addPositions(originalData, anonymizedData) {
        console.log(`💾 데이터 추가: 원본 ${originalData.length}건, 익명화 ${anonymizedData.length}건`);
        
        this.state.originalPositions = [...this.state.originalPositions, ...originalData];
        this.state.anonymizedPositions = [...this.state.anonymizedPositions, ...anonymizedData];
        
        // 로컬 스토리지에 원본만 저장 (화면 표시용)
        this.saveToLocalStorage();
        
        window.eventBus.emit(window.EventTypes.DATA_LOADED, {
            originalCount: this.state.originalPositions.length,
            anonymizedCount: this.state.anonymizedPositions.length
        });
    }
    
    /**
     * 포지션 데이터 업데이트
     */
    updatePositions(originalData, anonymizedData) {
        console.log(`💾 데이터 업데이트: 원본 ${originalData.length}건`);
        
        this.state.originalPositions = originalData;
        this.state.anonymizedPositions = anonymizedData;
        
        this.saveToLocalStorage();
        
        window.eventBus.emit(window.EventTypes.DATA_UPDATED, {
            originalCount: this.state.originalPositions.length,
            anonymizedCount: this.state.anonymizedPositions.length
        });
    }
    
    /**
     * 전체 데이터 삭제
     */
    clearAllData() {
        console.log('🗑️ 전체 데이터 삭제');
        
        this.state.originalPositions = [];
        this.state.anonymizedPositions = [];
        this.state.kpiData = null;
        this.state.suggestions = [];
        
        this.saveToLocalStorage();
        
        window.eventBus.emit(window.EventTypes.DATA_CLEARED, {});
    }
    
    /**
     * KPI 데이터 업데이트
     */
    updateKPI(kpiData) {
        console.log('📊 KPI 업데이트:', kpiData);
        
        this.state.kpiData = kpiData;
        this.saveToLocalStorage();
        
        window.eventBus.emit(window.EventTypes.KPI_UPDATED, {
            kpi: kpiData
        });
    }
    
    /**
     * 제안 데이터 업데이트
     */
    updateSuggestions(suggestions) {
        console.log(`💡 제안 업데이트: ${suggestions.length}건`);
        
        this.state.suggestions = suggestions;
        this.saveToLocalStorage();
        
        window.eventBus.emit(window.EventTypes.SUGGESTIONS_UPDATED, {
            suggestions: suggestions
        });
    }
    
    /**
     * 목표 헤지 비율 설정
     */
    setTargetHedgeRatio(ratio) {
        console.log(`🎯 목표 헤지 비율 설정: ${ratio}%`);
        
        this.state.targetHedgeRatio = ratio;
        localStorage.setItem('targetHedgeRatio', ratio);
        
        window.eventBus.emit(window.EventTypes.SETTINGS_CHANGED, {
            targetHedgeRatio: ratio
        });
    }
    
    /**
     * 목표 헤지 비율 가져오기
     */
    getTargetHedgeRatio() {
        const saved = localStorage.getItem('targetHedgeRatio');
        if (saved) {
            this.state.targetHedgeRatio = parseFloat(saved);
        }
        return this.state.targetHedgeRatio;
    }
    
    /**
     * 원본 포지션 가져오기 (화면 표시용)
     */
    getOriginalPositions() {
        return this.state.originalPositions;
    }
    
    /**
     * 익명화된 포지션 가져오기 (서버 전송용)
     */
    getAnonymizedPositions() {
        return this.state.anonymizedPositions;
    }
    
    /**
     * KPI 데이터 가져오기
     */
    getKPI() {
        return this.state.kpiData;
    }
    
    /**
     * 제안 데이터 가져오기
     */
    getSuggestions() {
        return this.state.suggestions;
    }
    
    /**
     * 로컬 스토리지에 저장
     */
    saveToLocalStorage() {
        try {
            // 원본 데이터만 로컬에 저장 (화면 표시용)
            localStorage.setItem('hedgePositions', JSON.stringify(this.state.originalPositions));
            
            if (this.state.kpiData) {
                localStorage.setItem('hedgeKPI', JSON.stringify(this.state.kpiData));
            }
            
            if (this.state.suggestions.length > 0) {
                localStorage.setItem('hedgeSuggestions', JSON.stringify(this.state.suggestions));
            }
            
            console.log('✅ 로컬 스토리지 저장 완료');
            
        } catch (error) {
            console.error('❌ 로컬 스토리지 저장 실패:', error);
        }
    }
    
    /**
     * 로컬 스토리지에서 로드
     */
    loadFromLocalStorage() {
        try {
            const savedPositions = localStorage.getItem('hedgePositions');
            if (savedPositions) {
                this.state.originalPositions = JSON.parse(savedPositions);
                console.log(`✅ 포지션 ${this.state.originalPositions.length}건 로드`);
            }
            
            const savedKPI = localStorage.getItem('hedgeKPI');
            if (savedKPI) {
                this.state.kpiData = JSON.parse(savedKPI);
                console.log('✅ KPI 데이터 로드');
            }
            
            const savedSuggestions = localStorage.getItem('hedgeSuggestions');
            if (savedSuggestions) {
                this.state.suggestions = JSON.parse(savedSuggestions);
                console.log(`✅ 제안 ${this.state.suggestions.length}건 로드`);
            }
            
            this.getTargetHedgeRatio();
            
        } catch (error) {
            console.error('❌ 로컬 스토리지 로드 실패:', error);
        }
    }
}

// 전역 인스턴스
window.dataManager = new DataManager();

console.log('✅ Data Manager 로드 완료');
