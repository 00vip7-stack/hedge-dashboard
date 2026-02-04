/**
 * 간단한 Guide Modal 대체 시스템
 * 원본 ../도구대기/guide-modal.js 대체
 */

class SimpleGuide {
    constructor() {
        this.currentTip = null;
        this.init();
    }
    
    init() {
        // Tooltip 컨테이너 생성
        const tooltip = document.createElement('div');
        tooltip.id = 'simpleTooltip';
        tooltip.style.cssText = `
            display: none;
            position: fixed;
            background-color: #1a1a1a;
            color: #fff;
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 12px;
            max-width: 300px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            pointer-events: none;
        `;
        document.body.appendChild(tooltip);
        
        // data-guide 속성 찾기
        document.querySelectorAll('[data-guide]').forEach(el => {
            el.style.cursor = 'help';
            el.style.borderBottom = '1px dotted #0099ff';
            
            el.addEventListener('mouseenter', (e) => this.show(e.target));
            el.addEventListener('mouseleave', () => this.hide());
        });
    }
    
    show(element) {
        const guide = element.getAttribute('data-guide');
        const title = element.getAttribute('data-guidetitle') || '';
        
        if (!guide) return;
        
        const tooltip = document.getElementById('simpleTooltip');
        let content = guide;
        if (title) content = `<strong>${title}</strong><br>${guide}`;
        
        tooltip.innerHTML = content;
        tooltip.style.display = 'block';
        
        // 마우스 위치에 표시
        const rect = element.getBoundingClientRect();
        tooltip.style.left = (rect.left) + 'px';
        tooltip.style.top = (rect.bottom + 10) + 'px';
    }
    
    hide() {
        const tooltip = document.getElementById('simpleTooltip');
        if (tooltip) tooltip.style.display = 'none';
    }
}

// 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.guideModal = new SimpleGuide();
        console.log('✅ Simple Guide 시스템 로드됨');
    });
} else {
    window.guideModal = new SimpleGuide();
    console.log('✅ Simple Guide 시스템 로드됨');
}
