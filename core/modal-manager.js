/**
 * Modal Manager - 모든 모달 표시 및 관리
 * hedge-manager.html에서 분리된 모듈
 */

class ModalManager {
    constructor() {
        console.log('🪟 Modal Manager 초기화');
        this.currentModal = null;
    }

    /**
     * 컬럼 매핑 확인 모달 표시
     */
    showColumnMappingModal(mappingResult) {
        const modal = document.getElementById('columnMappingModal');
        if (!modal) {
            console.warn('⚠️ 컬럼 매핑 모달을 찾을 수 없습니다');
            return;
        }

        const mappingTableBody = document.getElementById('columnMappingTableBody');
        if (!mappingTableBody) return;

        mappingTableBody.innerHTML = '';

        for (const [headerName, fieldName] of Object.entries(mappingResult)) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4 py-2 border font-mono">${headerName}</td>
                <td class="px-4 py-2 border">→</td>
                <td class="px-4 py-2 border font-mono">${fieldName}</td>
            `;
            mappingTableBody.appendChild(row);
        }

        modal.classList.add('active');
        this.currentModal = 'columnMapping';
        console.log('✅ 컬럼 매핑 모달 표시');
    }

    /**
     * 익명화 승인 모달 표시
     */
    showAnonymizationApprovalModal(anonymizationPreview) {
        const modal = document.getElementById('anonymizationApprovalModal');
        if (!modal) {
            console.warn('⚠️ 익명화 승인 모달을 찾을 수 없습니다');
            return;
        }

        // 원본 데이터 표시
        const beforeSample = document.getElementById('beforeSampleTable');
        if (beforeSample && anonymizationPreview.beforeSample) {
            beforeSample.innerHTML = `
                <div class="bg-blue-50 p-3 rounded max-h-60 overflow-auto">
                    <table class="w-full text-xs">
                        <tbody>
                            ${JSON.stringify(anonymizationPreview.beforeSample[0] || {}, null, 2)
                                .split('\n')
                                .map((line, i) => `<tr key=${i}><td class="font-mono text-gray-700">${line}</td></tr>`)
                                .join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // 익명화된 데이터 표시
        const afterSample = document.getElementById('afterSampleTable');
        if (afterSample && anonymizationPreview.afterSample) {
            afterSample.innerHTML = `
                <div class="bg-green-50 p-3 rounded max-h-60 overflow-auto">
                    <table class="w-full text-xs">
                        <tbody>
                            ${JSON.stringify(anonymizationPreview.afterSample[0] || {}, null, 2)
                                .split('\n')
                                .map((line, i) => `<tr key=${i}><td class="font-mono text-gray-700">${line}</td></tr>`)
                                .join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // 제거될 필드 목록
        const removedDiv = document.getElementById('removedFieldsList');
        if (removedDiv && anonymizationPreview.removedFields) {
            let fieldsHtml = '<div class="flex flex-wrap gap-2">';
            anonymizationPreview.removedFields.forEach(field => {
                fieldsHtml += `<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">❌ ${field}</span>`;
            });
            fieldsHtml += '</div>';
            removedDiv.innerHTML = fieldsHtml;
        }

        // 체크박스 초기화
        const checkbox = document.getElementById('anonymizationConsent');
        if (checkbox) {
            checkbox.checked = false;
            this.updateAnonymizationApprovalButton();
        }

        modal.classList.add('active');
        this.currentModal = 'anonymizationApproval';
        console.log('✅ 익명화 승인 모달 표시');
    }

    /**
     * 익명화 승인 버튼 상태 업데이트
     */
    updateAnonymizationApprovalButton() {
        const checkbox = document.getElementById('anonymizationConsent');
        const button = document.getElementById('approveAnonymizationBtn');

        if (checkbox && button) {
            button.disabled = !checkbox.checked;
            button.className = checkbox.checked
                ? 'px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700'
                : 'px-6 py-3 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed';
        }
    }

    /**
     * 프로비넌스 그래프 표시
     */
    showProvenanceGraph() {
        if (!window.provenanceIndexer) {
            console.warn('⚠️ 프로비넌스 인덱서를 사용할 수 없습니다');
            return;
        }

        const modal = document.getElementById('provenanceGraphModal');
        if (!modal) {
            console.warn('⚠️ 프로비넌스 그래프 모달을 찾을 수 없습니다');
            return;
        }

        modal.classList.add('active');
        this.currentModal = 'provenanceGraph';
        console.log('✅ 프로비넌스 그래프 모달 표시');
    }

    /**
     * 필수 폴더 설정 모달 표시
     */
    showMandatoryFolderSetupModal() {
        const modal = document.getElementById('mandatoryFolderSetupModal');
        if (!modal) {
            console.warn('⚠️ 필수 폴더 설정 모달을 찾을 수 없습니다');
            return;
        }

        modal.classList.add('active');
        this.currentModal = 'mandatoryFolderSetup';
        console.log('✅ 필수 폴더 설정 모달 표시');
    }

    /**
     * 초기 설정 모달 표시
     */
    showInitialSettingsModal() {
        const modal = document.getElementById('initialSettingsModal');
        if (!modal) {
            console.warn('⚠️ 초기 설정 모달을 찾을 수 없습니다');
            return;
        }

        modal.classList.add('active');
        this.currentModal = 'initialSettings';
        console.log('✅ 초기 설정 모달 표시');
    }

    /**
     * 폴더 선택 모달 표시
     */
    showFolderSelectionModal() {
        const modal = document.getElementById('folderSelectionModal');
        if (!modal) {
            console.warn('⚠️ 폴더 선택 모달을 찾을 수 없습니다');
            return;
        }

        modal.classList.add('active');
        this.currentModal = 'folderSelection';
        console.log('✅ 폴더 선택 모달 표시');
    }

    /**
     * 모든 모달 닫기
     */
    closeAllModals() {
        const modals = document.querySelectorAll('[id$="Modal"]');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });

        this.currentModal = null;
        console.log('✅ 모든 모달 닫음');
    }

    /**
     * 특정 모달 닫기
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            this.currentModal = null;
            console.log(`✅ 모달 닫음: ${modalId}`);
        }
    }

    /**
     * 현재 열려있는 모달 조회
     */
    getCurrentModal() {
        return this.currentModal;
    }
}

// 전역 인스턴스
window.modalManager = new ModalManager();
console.log('✅ Modal Manager 로드 완료');
