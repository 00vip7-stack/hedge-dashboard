/**
 * API Client - 서버 통신 관리
 * 익명화된 데이터만 전송
 */

class APIClient {
    constructor() {
        this.baseURL = '';  // 동일 도메인
        this.endpoints = {
            upload: '/api/upload',
            calculate: '/api/calculate',
            optimize: '/api/optimize'
        };
        console.log('🌐 APIClient 초기화');
    }
    
    /**
     * 익명화된 포지션 데이터 업로드
     */
    async uploadAnonymizedPositions(anonymizedPositions, metadata = {}) {
        console.log(`📤 익명화된 데이터 업로드: ${anonymizedPositions.length}건`);
        
        // 익명화 검증
        const isValid = window.dataAnonymizer.validateAnonymization(anonymizedPositions);
        if (!isValid) {
            throw new Error('익명화 검증 실패: 민감정보가 포함되어 있습니다');
        }
        
        try {
            const response = await fetch(this.endpoints.upload, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    positions: anonymizedPositions,
                    metadata: {
                        ...metadata,
                        _anonymized: true,
                        _note: '익명화된 데이터 (거래처명, 은행명 제거됨)',
                        uploadTime: new Date().toISOString()
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ 업로드 성공:', result);
            
            window.eventBus.emit(window.EventTypes.DATA_UPLOADED, {
                count: anonymizedPositions.length,
                result: result
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ 업로드 실패:', error);
            
            window.eventBus.emit(window.EventTypes.ERROR_OCCURRED, {
                type: 'UPLOAD_ERROR',
                message: error.message
            });
            
            throw error;
        }
    }
    
    /**
     * 헤지 계산 요청 (익명화된 데이터)
     */
    async calculateHedge(anonymizedPositions, targetRatio) {
        console.log(`🧮 헤지 계산 요청: ${anonymizedPositions.length}건, 목표비율 ${targetRatio}%`);
        
        try {
            const response = await fetch(this.endpoints.calculate, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    positions: anonymizedPositions,
                    targetRatio: targetRatio,
                    _anonymized: true
                })
            });
            
            if (!response.ok) {
                // 서버 없을 때 Mock 데이터 반환
                console.warn('⚠️ 서버 응답 없음, Mock 데이터 사용');
                return this.getMockCalculationResult(anonymizedPositions, targetRatio);
            }
            
            const result = await response.json();
            console.log('✅ 계산 완료:', result);
            
            window.eventBus.emit(window.EventTypes.CALCULATION_COMPLETED, {
                result: result
            });
            
            return result;
            
        } catch (error) {
            console.warn('⚠️ 서버 연결 실패, Mock 데이터 사용:', error.message);
            
            // 서버 연결 실패 시 Mock 데이터 반환
            return this.getMockCalculationResult(anonymizedPositions, targetRatio);
        }
    }
    
    /**
     * Mock 계산 결과 생성
     */
    getMockCalculationResult(positions, targetRatio) {
        console.log('🎭 Mock 데이터 생성 중...');
        
        // 총 노출액 계산
        const totalExposure = positions.reduce((sum, pos) => sum + (pos.amount || 0), 0);
        const targetHedgeAmount = totalExposure * (targetRatio / 100);
        const currentHedgedAmount = positions.reduce((sum, pos) => sum + (pos.hedgedAmount || 0), 0);
        const currentHedgeRatio = totalExposure > 0 ? (currentHedgedAmount / totalExposure) * 100 : 0;
        const gap = currentHedgeRatio - targetRatio;
        
        const result = {
            success: true,
            kpi: {
                totalExposure: totalExposure,
                targetHedgeRatio: targetRatio,
                targetHedgeAmount: targetHedgeAmount,
                currentHedgedAmount: currentHedgedAmount,
                currentHedgeRatio: currentHedgeRatio,
                gap: gap,
                unhedgedAmount: totalExposure - currentHedgedAmount
            },
            suggestions: [
                {
                    currency: 'USD',
                    amount: targetHedgeAmount - currentHedgedAmount,
                    product: '선물환',
                    priority: '높음'
                }
            ],
            _mock: true
        };
        
        console.log('✅ Mock 데이터 생성 완료:', result);
        
        window.eventBus.emit(window.EventTypes.CALCULATION_COMPLETED, {
            result: result
        });
        
        return result;
    }
    
    /**
     * 최적화 제안 요청
     */
    async getOptimizationSuggestions(anonymizedPositions) {
        console.log(`💡 최적화 제안 요청`);
        
        try {
            const response = await fetch(this.endpoints.optimize, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    positions: anonymizedPositions,
                    _anonymized: true
                })
            });
            
            if (!response.ok) {
                throw new Error(`최적화 실패: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ 최적화 제안:', result);
            
            return result;
            
        } catch (error) {
            console.error('❌ 최적화 실패:', error);
            throw error;
        }
    }
}

// 전역 인스턴스
window.apiClient = new APIClient();

console.log('✅ API Client 로드 완료');
