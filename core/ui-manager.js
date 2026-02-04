/**
 * UI Manager - 모든 UI 렌더링 및 표시 함수
 * hedge-manager.html에서 분리된 모듈
 */

class UIManager {
    constructor() {
        console.log('🎨 UI Manager 초기화');
    }

    /**
     * 포지션 테이블 렌더링
     */
    renderPositions(positions) {
        const tbody = document.querySelector('#positionsTable tbody');
        if (!tbody) {
            console.warn('⚠️ 포지션 테이블을 찾을 수 없습니다');
            return;
        }

        tbody.innerHTML = '';

        if (!positions || positions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">데이터 없음</td></tr>';
            return;
        }

        positions.forEach((pos, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4 py-2 border">${index + 1}</td>
                <td class="px-4 py-2 border font-mono">${pos.currency}</td>
                <td class="px-4 py-2 border text-right font-mono">${(pos.amount || 0).toLocaleString('ko-KR')}</td>
                <td class="px-4 py-2 border">${pos.date || '-'}</td>
                <td class="px-4 py-2 border">${pos.type || '-'}</td>
                <td class="px-4 py-2 border text-right font-mono">${(pos.hedgedAmount || 0).toLocaleString('ko-KR')}</td>
                <td class="px-4 py-2 border">
                    <span class="px-2 py-1 rounded text-sm font-semibold ${
                        pos.hedgeStatus === 'hedged' 
                            ? 'bg-green-100 text-green-800' 
                            : pos.hedgeStatus === 'partially_hedged'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                    }">
                        ${pos.hedgeStatus === 'hedged' ? '✅ 헤지됨' : pos.hedgeStatus === 'partially_hedged' ? '⚠️ 부분헤지' : '❌ 미헤지'}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });

        console.log(`✅ ${positions.length}개의 포지션 렌더링 완료`);
    }

    /**
     * KPI 데이터 렌더링
     */
    renderKPI(kpi) {
        if (!kpi) return;

        // 총 노출액
        const totalExposureEl = document.getElementById('totalExposure');
        if (totalExposureEl) {
            totalExposureEl.textContent = (kpi.totalExposure || 0).toLocaleString('ko-KR');
        }

        // 헤지 비율
        const hedgeRatioEl = document.getElementById('hedgeRatio');
        if (hedgeRatioEl) {
            hedgeRatioEl.textContent = `${(kpi.hedgeRatio * 100).toFixed(1)}%`;
        }

        // 미헤지 금액
        const unhedgedGapEl = document.getElementById('unhedgedGap');
        if (unhedgedGapEl) {
            unhedgedGapEl.textContent = (kpi.unhedgedGap || 0).toLocaleString('ko-KR');
        }

        // 평균 헤지 환율
        const avgHedgeRateEl = document.getElementById('avgHedgeRate');
        if (avgHedgeRateEl) {
            avgHedgeRateEl.textContent = (kpi.avgHedgeRate || 0).toFixed(2);
        }

        console.log('✅ KPI 렌더링 완료');
    }

    /**
     * 환율 정보 렌더링
     */
    renderExchangeRates(rates) {
        const container = document.getElementById('exchangeRatesContainer');
        if (!container) return;

        container.innerHTML = '';

        if (!rates || rates.length === 0) {
            container.innerHTML = '<div class="text-gray-500">환율 정보 없음</div>';
            return;
        }

        rates.forEach(rate => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-3 bg-gray-50 rounded border';
            div.innerHTML = `
                <div class="font-semibold text-gray-800">${rate.currency}</div>
                <div class="font-mono text-lg text-blue-600">${(rate.rate || 0).toFixed(2)}</div>
            `;
            container.appendChild(div);
        });

        console.log(`✅ ${rates.length}개의 환율 렌더링 완료`);
    }

    /**
     * 제안 사항 렌더링
     */
    renderSuggestions(suggestions) {
        const container = document.getElementById('suggestionsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (!suggestions || suggestions.length === 0) {
            container.innerHTML = '<div class="text-gray-500">제안 사항 없음</div>';
            return;
        }

        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = `p-4 rounded-lg border-l-4 ${
                suggestion.priority === 'high' 
                    ? 'bg-red-50 border-red-500' 
                    : suggestion.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'
            }`;
            div.innerHTML = `
                <div class="font-semibold text-gray-800 mb-1">${suggestion.title || '제안'}</div>
                <div class="text-sm text-gray-700">${suggestion.description || ''}</div>
            `;
            container.appendChild(div);
        });

        console.log(`✅ ${suggestions.length}개의 제안 렌더링 완료`);
    }

    /**
     * 데이터 매니저에서 데이터를 가져와 렌더링
     */
    renderFromDataManager() {
        try {
            if (!window.dataManager) {
                console.warn('⚠️ Data Manager를 찾을 수 없습니다');
                return;
            }

            const kpi = window.dataManager.getKPI();
            const positions = window.dataManager.getPositions();
            const suggestions = window.dataManager.getSuggestions();
            const exchangeRates = window.dataManager.getExchangeRates();

            if (kpi) this.renderKPI(kpi);
            if (positions && positions.length > 0) this.renderPositions(positions);
            if (exchangeRates && exchangeRates.length > 0) this.renderExchangeRates(exchangeRates);
            if (suggestions && suggestions.length > 0) this.renderSuggestions(suggestions);

            console.log('✅ Data Manager에서 데이터 렌더링 완료');
        } catch (error) {
            console.error('❌ 렌더링 중 오류:', error);
        }
    }

    /**
     * 성공 메시지 표시
     */
    showSuccessMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-pulse';
        alertDiv.textContent = '✅ ' + message;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 3000);

        console.log('✅ ' + message);
    }

    /**
     * 에러 메시지 표시
     */
    showErrorMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
        alertDiv.textContent = '❌ ' + message;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, 5000);

        console.error('❌ ' + message);
    }

    /**
     * UI 초기화 (모든 입력 필드 비우기)
     */
    clearUI() {
        const tbody = document.querySelector('#positionsTable tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">데이터 없음</td></tr>';
        }

        const containers = [
            'exchangeRatesContainer',
            'suggestionsContainer'
        ];

        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = '';
            }
        });

        const kpiFields = [
            'totalExposure',
            'hedgeRatio',
            'unhedgedGap',
            'avgHedgeRate'
        ];

        kpiFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = '-';
            }
        });

        console.log('🗑️ UI 초기화 완료');
    }
}

// 전역 인스턴스
window.uiManager = new UIManager();
console.log('✅ UI Manager 로드 완료');
