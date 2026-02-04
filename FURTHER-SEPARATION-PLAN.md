# 📋 hedge-manager.html 추가 분리 계획

## 현재 상태
- **전체**: 3,307줄
- **구성**:
  - HTML/CSS/레이아웃: ~800줄
  - 모달/패널 8개: ~1,200줄
  - JavaScript 로직: ~1,300줄

## 🎯 분리 전략 (3단계)

### Phase A: 온보딩 분리 (추천 - 즉시 가능)
```
분리 대상: 초기 설정 모달 3개
- workspaceFolderStatus (폴더 설정 상태)
- initialSettingsModal (초기 설정)
- mandatoryFolderSetupModal (필수 폴더 설정)

분리 결과:
- onboarding.html (500줄) - 온보딩 UI + 로직
- hedge-manager.html (2,800줄) ← 500줄 감소
- auto-loader.js (50줄) - 자동 연결 스크립트

방식: iframe 또는 동적 로드
효과: **가장 효과적** (간단하고 빠름)
```

### Phase B: 대시보드 섹션 분리 (선택)
```
분리 대상: 메인 테이블/차트 섹션
- 포지션 테이블 섹션
- KPI 표시 섹션
- 환율 표시 섹션
- 제안 섹션

분리 결과:
- positions-dashboard.html (400줄)
- hedge-manager.html (2,400줄)
```

### Phase C: 모달 통합 라이브러리 (선택)
```
분리 대상: 8개 모달을 통합 파일로
- modals.html (600줄)
- 동적 로드로 필요할 때만 포함

결과:
- hedge-manager.html (1,800줄) ← 대폭 감소
```

## 🚀 권장: Phase A만 진행

### 구현 방식

**1. onboarding.html 생성** (독립적 페이지)
```html
<!-- 온보딩 전용 페이지 -->
- 폴더 설정 마법사
- 초기 설정 가이드
- 필수 폴더 설정
```

**2. auto-loader.js 추가** (자동 연결)
```javascript
// 페이지 로드 시 자동으로 실행
if (firstTimeVisit) {
    loadOnboarding('onboarding.html');
} else {
    loadMainDashboard();
}
```

**3. 통신 방식**
```javascript
// 온보딩 완료 후 메인 페이지로 자동 진행
// 또는 같은 페이지에 iframe으로 embedded
```

## 📊 예상 효과

| 항목 | 현재 | Phase A | Phase A+B | Phase A+B+C |
|------|------|---------|----------|------------|
| hedge-manager.html | 3,307줄 | 2,800줄 | 2,400줄 | 1,800줄 |
| 파일 수 | 16 모듈 | 17 모듈 | 18 모듈 | 19 모듈 |
| 초기 로드 | 170KB | 130KB | 110KB | 80KB |
| 로드 속도 | 150ms | 100ms | 80ms | 50ms |
| 유지보수 | 보통 | 쉬움 | 더 쉬움 | 최적 |

## ✅ Phase A 구현 체크리스트

- [ ] onboarding.html 생성 (온보딩 UI 복사)
- [ ] 온보딩 로직을 onboarding.html로 이동
- [ ] hedge-manager.html에서 온보딩 코드 제거
- [ ] auto-loader.js 생성 (자동 호출)
- [ ] 페이지 로드 테스트
- [ ] 온보딩 플로우 확인
- [ ] 기존 기능 동작 확인

## 🎯 결론

**Phase A 추천**:
- 간단함 (30분 내 완료 가능)
- 효과 있음 (500줄 감소)
- 리스크 낮음 (온보딩은 독립적)
- 향후 확장 용이 (Phase B/C 가능)
