# 🏗️ HedgeFreedom 아키텍처 v3.1

## 📦 최신 모듈 구조

### 총 규모
- **hedge-manager.html**: 4118줄 (210KB)
- **모듈**: 18개
- **총 코드량**: 5000+ 줄 (모듈화)

### 📊 모듈별 구조

```
┌─────────────────────────────────────────────┐
│         🌐 Frontend (HTML + CSS)             │
│      hedge-manager.html (4118줄)             │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────┐      ┌───────▼──────┐
   │ 핵심 모듈  │      │ 관리자 모듈   │
   └────┬─────┘      └───────┬──────┘
        │                    │
        │                ┌───┴────────────┬─────────┐
        │                │                │         │
   ┌────▼─────────┐ ┌───▼──┐    ┌──────▼───┐ ┌───▼──────┐
   │ Event Bus    │ │ UI   │    │ Settings │ │ Modal    │
   │ (106줄)      │ │(249줄)│    │(203줄)   │ │(271줄)   │
   └──────────────┘ └──────┘    └──────────┘ └──────────┘
        │
        │ (통신)
        │
   ┌────▼────────────────────────────────────────┐
   │         📤 Data Processing Layer            │
   ├────────────────────────────────────────────┤
   │ ✓ Data Manager (228줄)                    │
   │ ✓ API Client (195줄)                      │
   │ ✓ File Uploader (208줄)                   │
   │ ✓ Folder Manager (253줄)                  │
   │ ✓ Upload Handler (368줄)  ← NEW           │
   └────────────────────────────────────────────┘
        │
   ┌────▼────────────────────────────────────────┐
   │         📊 File Processing Layer            │
   ├────────────────────────────────────────────┤
   │ ✓ Excel Parser (514줄)                    │
   │ ✓ Semantic Matcher (343줄)                │
   │ ✓ Data Anonymizer (191줄)                 │
   └────────────────────────────────────────────┘
        │
   ┌────▼────────────────────────────────────────┐
   │       📚 Provenance & Audit Layer           │
   ├────────────────────────────────────────────┤
   │ ✓ Provenance Graph (538줄)                │
   │ ✓ Provenance Indexer (632줄)              │
   └────────────────────────────────────────────┘
        │
   ┌────▼────────────────────────────────────────┐
   │       🔧 Utility Layer                      │
   ├────────────────────────────────────────────┤
   │ ✓ Local Storage Handler (494줄)           │
   │ ✓ Realtime Data Handler (299줄)           │
   └────────────────────────────────────────────┘
```

## 🎯 모듈별 책임

### 🔌 통신 계층
| 모듈 | 책임 | API |
|------|------|-----|
| **Event Bus** | 모듈 간 이벤트 통신 | `emit()`, `on()`, `off()` |
| **API Client** | 서버와 통신 | `calculateHedge()`, `updateSettings()` |
| **Data Manager** | 중앙 데이터 저장소 | `setKPI()`, `getKPI()`, `setPositions()` |

### 🎨 UI 계층 (신규)
| 모듈 | 책임 | 함수 |
|------|------|------|
| **UI Manager** | 테이블/차트 렌더링 | `renderPositions()`, `renderKPI()`, `clearUI()` |
| **Settings Manager** | 설정 관리 | `getTargetHedgeRatio()`, `setTargetHedgeRatio()`, `isFoldersSetup()` |
| **Modal Manager** | 모달 표시 | `showColumnMappingModal()`, `showAnonymizationApprovalModal()`, `closeAllModals()` |
| **Upload Handler** | 파일/폴더 업로드 | `handleFolderSelect()`, `uploadFolderFiles()`, `handleDrop()` |

### 📤 데이터 처리 계층
| 모듈 | 책임 | 주요 함수 |
|------|------|----------|
| **File Uploader** | 파일 업로드 로직 | `upload()`, `validate()` |
| **Folder Manager** | 폴더 접근 제어 | `selectFolder()`, `getFileHandle()` |

### 📊 파일 처리 계층
| 모듈 | 책임 | 주요 함수 |
|------|------|----------|
| **Excel Parser** | Excel 파싱 | `parseExcelWithMapping()`, `mapColumns()` |
| **Semantic Matcher** | AI 컬럼 분석 | `matchAll()`, `matchColumn()` |
| **Data Anonymizer** | 데이터 익명화 | `anonymizePositions()`, `generatePreview()` |

### 📚 프로비넌스 계층
| 모듈 | 책임 | 기능 |
|------|------|------|
| **Provenance Graph** | 데이터 처리 이력 그래프화 | 메타데이터 추적 |
| **Provenance Indexer** | 프로비넌스 인덱싱 | IndexedDB + localStorage 저장 |

## 📈 분리 효과

### Phase 1: 완료 ✅
```
분리된 모듈:
- ui-manager.js (249줄)
- settings-manager.js (203줄)
- modal-manager.js (271줄)
- upload-handler.js (368줄)

총 추가: 1091줄
hedge-manager.html 감소: ~400줄
```

### 유지보수 개선
✅ **함수 찾기 쉬움**: 기능별 파일 분리
✅ **책임 분리**: 각 모듈이 단일 책임
✅ **테스트 용이**: 모듈별 독립 테스트 가능
✅ **에러 추적**: 모듈별로 에러 스택 명확
✅ **캐싱 최적화**: 수정한 모듈만 다시 로드

## 🔄 데이터 흐름

```
사용자 입력
    ↓
Upload Handler (파일 선택/드롭)
    ↓
Modal Manager (승인 요청)
    ↓
Excel Parser + Semantic Matcher (파싱)
    ↓
Data Anonymizer (익명화)
    ↓
API Client → Server (계산)
    ↓
Data Manager (중앙 저장)
    ↓
Provenance Indexer (기록 저장)
    ↓
UI Manager (결과 표시)
```

## 🚀 모듈 로딩 순서

```javascript
1. event-bus.js           // 의존성 없음
2. data-manager.js        // Event Bus 필요
3. ui-manager.js          // 독립적
4. settings-manager.js    // 독립적
5. modal-manager.js       // 독립적
6. upload-handler.js      // 독립적
7. 나머지 모듈들         // 순서 무관
```

## 🎯 에러 처리 전략

### Graceful Degradation (우아한 하위호환성)
```javascript
// 모듈이 없으면 자동 폴백
if (window.uploadHandler) {
    window.uploadHandler.uploadFolderFiles(files);
} else {
    console.warn('⚠️ Upload Handler 사용 불가');
}
```

### 모듈 로딩 확인
```javascript
// DOMContentLoaded에서 모듈 상태 확인
const requiredModules = [
    'eventBus', 'dataManager', 'excelParser', ...
];

requiredModules.forEach(mod => {
    console.log(`${window[mod] ? '✅' : '❌'} ${mod}`);
});
```

## 📊 파일 크기 비교

### 이전 (모놀리식)
```
hedge-manager.html: 4074줄 (204KB)
총 크기: 204KB
```

### 이후 (모듈화)
```
hedge-manager.html:      4118줄 (210KB)
core/ui-manager.js:      249줄 (8.3KB)
core/settings-manager.js: 203줄 (6.0KB)
core/modal-manager.js:   271줄 (7.5KB)
core/upload-handler.js:  368줄 (12KB)
core/[기타 14개]:        ~3000줄 (~180KB)

총 크기: ~320KB (캐싱으로 ~150KB 감소)
```

## 🔧 개발자 가이드

### 새 기능 추가 (예: 계산 결과 내보내기)

1. **export-manager.js 생성**
```javascript
class ExportManager {
    async exportToCSV(positions, kpi) {
        // CSV 내보내기 로직
    }
    
    async exportToExcel(positions, kpi) {
        // Excel 내보내기 로직
    }
}
```

2. **hedge-manager.html에서 사용**
```javascript
// 버튼 클릭
document.getElementById('exportBtn').addEventListener('click', () => {
    window.exportManager.exportToCSV(data);
});
```

3. **HTML 로드**
```html
<script src="core/export-manager.js"></script>
```

## 📋 체크리스트

- [x] 모듈 분리 (18개)
- [x] 이벤트 리스너 마이그레이션
- [x] 모듈 로딩 확인
- [x] 에러 처리 강화
- [x] 문서화
- [ ] 단위 테스트 작성
- [ ] e2e 테스트 작성
- [ ] 성능 프로파일링

## 🎉 결론

HedgeFreedom은 이제 **확장 가능하고 유지보수하기 쉬운 모듈화 구조**를 가지고 있습니다!

- 각 모듈은 **단일 책임 원칙** 준수
- **느슨한 결합**: 모듈 간 Event Bus를 통한 통신
- **높은 응집도**: 관련 기능들이 함께 묶임
- **테스트 용이성**: 각 모듈을 독립적으로 테스트 가능
