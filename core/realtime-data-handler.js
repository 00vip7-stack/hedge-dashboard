/**
 * HedgeFreedom 실시간 데이터 핸들러
 * 서버에서 받은 데이터를 대시보드에 실시간 바인딩
 */

class RealtimeDataHandler {
    constructor(serverUrl = 'http://localhost:8000') {
        this.serverUrl = serverUrl;
        this.wsConnection = null;
        this.pollingInterval = null;
        this.updateCallbacks = new Map();
    }

    /**
     * WebSocket 연결 시작 (실시간 푸시)
     */
    connectWebSocket() {
        this.wsConnection = new WebSocket(this.serverUrl.replace('http', 'ws') + '/ws');
        
        this.wsConnection.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.updateDashboard(data);
        };

        this.wsConnection.onerror = (error) => {
            console.error('WebSocket 오류, Polling으로 전환:', error);
            this.startPolling();
        };
    }

    /**
     * Polling 방식 (WebSocket 실패 시 대안)
     */
    startPolling(interval = 5000) {
        this.pollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.serverUrl}/api/realtime-data`);
                const data = await response.json();
                this.updateDashboard(data);
            } catch (error) {
                console.error('Polling 오류:', error);
            }
        }, interval);
    }

    /**
     * 대시보드 업데이트 (서버 데이터 → DOM)
     */
    updateDashboard(serverData) {
        // 1. 숫자 값 업데이트
        this.updateNumericValues(serverData);

        // 2. 상태 표시 업데이트 (조건부 텍스트)
        this.updateStatusMessages(serverData);

        // 3. 차트 업데이트
        this.updateCharts(serverData);

        // 4. 알림 체크
        this.checkAlerts(serverData);

        // 5. 등록된 콜백 실행
        this.updateCallbacks.forEach((callback, id) => {
            callback(serverData);
        });
    }

    /**
     * 숫자 값 실시간 업데이트
     */
    updateNumericValues(data) {
        // data-bind 속성을 가진 모든 요소 자동 업데이트
        document.querySelectorAll('[data-bind]').forEach(element => {
            const bindPath = element.getAttribute('data-bind');
            const value = this.getNestedValue(data, bindPath);
            
            if (value !== undefined) {
                // 숫자 포맷팅
                if (element.hasAttribute('data-format')) {
                    const format = element.getAttribute('data-format');
                    element.textContent = this.formatValue(value, format);
                } else {
                    element.textContent = value;
                }

                // 변화 애니메이션
                if (element.hasAttribute('data-animate')) {
                    this.animateChange(element);
                }
            }
        });
    }

    /**
     * 조건부 텍스트 메시지 업데이트 (자연어 생성 X, 템플릿 기반)
     */
    updateStatusMessages(data) {
        // 예시: 마진 상태 메시지
        const marginElement = document.getElementById('margin-status-message');
        if (marginElement && data.margin) {
            const margin = data.margin.current;
            
            // 조건부 템플릿 (미리 작성된 텍스트 중 선택)
            if (margin > 30) {
                marginElement.innerHTML = `
                    <span class="text-red-600 font-bold">⚠️ 마진이 매우 높습니다 (${margin}원)</span>
                    <p class="text-sm text-gray-600 mt-1">즉시 은행과 협상이 필요합니다</p>
                `;
            } else if (margin > 20) {
                marginElement.innerHTML = `
                    <span class="text-orange-600 font-bold">📊 마진이 높은 편입니다 (${margin}원)</span>
                    <p class="text-sm text-gray-600 mt-1">협상으로 개선 가능성이 있습니다</p>
                `;
            } else if (margin > 10) {
                marginElement.innerHTML = `
                    <span class="text-blue-600 font-bold">✅ 마진이 적정 수준입니다 (${margin}원)</span>
                    <p class="text-sm text-gray-600 mt-1">현재 조건을 유지하세요</p>
                `;
            } else {
                marginElement.innerHTML = `
                    <span class="text-green-600 font-bold">🎉 마진이 매우 낮습니다 (${margin}원)</span>
                    <p class="text-sm text-gray-600 mt-1">우수한 협상 결과입니다</p>
                `;
            }
        }

        // 예시: 환율 변동성 메시지
        const volatilityElement = document.getElementById('volatility-message');
        if (volatilityElement && data.volatility) {
            const vol = data.volatility.current;
            const threshold = data.volatility.threshold;

            if (vol > threshold * 1.5) {
                volatilityElement.textContent = '🔴 급격한 변동성 - 헤지 긴급 검토 필요';
                volatilityElement.className = 'text-red-600 font-bold animate-pulse';
            } else if (vol > threshold) {
                volatilityElement.textContent = '🟡 변동성 증가 - 주의 관찰';
                volatilityElement.className = 'text-orange-600 font-semibold';
            } else {
                volatilityElement.textContent = '🟢 변동성 안정 - 정상 범위';
                volatilityElement.className = 'text-green-600';
            }
        }
    }

    /**
     * AI 자연어 권고사항 (서버에서 생성된 텍스트 수신)
     */
    updateAIRecommendations(data) {
        // AI가 생성한 자연어는 서버에서 완성되어 옴
        const aiElement = document.getElementById('ai-recommendation');
        if (aiElement && data.ai_analysis) {
            aiElement.innerHTML = `
                <div class="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                    <h4 class="font-bold text-purple-800 mb-2">🤖 AI 분석</h4>
                    <p class="text-sm text-gray-700">${data.ai_analysis.recommendation}</p>
                    ${data.ai_analysis.confidence ? 
                        `<p class="text-xs text-gray-500 mt-2">신뢰도: ${data.ai_analysis.confidence}%</p>` 
                        : ''}
                </div>
            `;
        }
    }

    /**
     * 차트 업데이트
     */
    updateCharts(data) {
        // Chart.js 차트 업데이트
        if (window.chartInstances) {
            Object.entries(window.chartInstances).forEach(([chartId, chart]) => {
                if (data.charts && data.charts[chartId]) {
                    chart.data.datasets[0].data = data.charts[chartId].data;
                    chart.data.labels = data.charts[chartId].labels;
                    chart.update('none'); // 애니메이션 없이 즉시 업데이트
                }
            });
        }
    }

    /**
     * 알림 체크
     */
    checkAlerts(data) {
        if (data.alerts && data.alerts.length > 0) {
            data.alerts.forEach(alert => {
                this.showNotification(alert);
            });
        }
    }

    /**
     * 브라우저 알림
     */
    showNotification(alert) {
        if (Notification.permission === 'granted') {
            new Notification('HedgeFreedom 알림', {
                body: alert.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico'
            });
        }

        // 화면 내 알림 배너
        const alertBanner = document.createElement('div');
        alertBanner.className = `fixed top-4 right-4 z-50 bg-${alert.type === 'critical' ? 'red' : 'yellow'}-500 text-white p-4 rounded-lg shadow-lg animate-bounce`;
        alertBanner.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${alert.message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">✕</button>
            </div>
        `;
        document.body.appendChild(alertBanner);

        setTimeout(() => alertBanner.remove(), 10000);
    }

    /**
     * 값 포맷팅
     */
    formatValue(value, format) {
        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('ko-KR', {
                    style: 'currency',
                    currency: 'KRW'
                }).format(value);
            
            case 'number':
                return new Intl.NumberFormat('ko-KR').format(value);
            
            case 'percent':
                return `${(value * 100).toFixed(2)}%`;
            
            case 'exchange-rate':
                return `${value.toFixed(2)}원`;
            
            default:
                return value;
        }
    }

    /**
     * 변화 애니메이션
     */
    animateChange(element) {
        element.classList.add('bg-yellow-200');
        setTimeout(() => {
            element.classList.remove('bg-yellow-200');
        }, 500);
    }

    /**
     * 중첩된 객체 값 가져오기
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, prop) => 
            current ? current[prop] : undefined, obj
        );
    }

    /**
     * 커스텀 업데이트 콜백 등록
     */
    registerCallback(id, callback) {
        this.updateCallbacks.set(id, callback);
    }

    /**
     * 연결 종료
     */
    disconnect() {
        if (this.wsConnection) {
            this.wsConnection.close();
        }
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
    }
}

// 전역 인스턴스 생성
window.realtimeHandler = new RealtimeDataHandler();

// 페이지 로드 시 자동 연결
document.addEventListener('DOMContentLoaded', () => {
    // WebSocket 시도 → 실패 시 Polling
    try {
        window.realtimeHandler.connectWebSocket();
    } catch (error) {
        console.warn('WebSocket 불가, Polling 사용:', error);
        window.realtimeHandler.startPolling();
    }

    // 알림 권한 요청
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
