# 📦 모듈 구조 및 마이그레이션 가이드

## 현재 상태
- **hedge-manager.html**: 4075줄 (204KB) - 메인 HTML + 인라인 스크립트
- **총 모듈**: 14개 (4453줄)

## 모듈 분류

### 🔌 핵심 데이터 처리 모듈
| 모듈 | 크기 | 역할 |
|------|------|------|
| `event-bus.js` | 106줄 | 모듈 간 통신 버스 |
| `data-manager.js` | 228줄 | 중앙 데이터 관리 |
| `api-client.js` | 195줄 | 서버 통신 |

### 📊 파일 처리 모듈
| 모듈 | 크기 | 역할 |
|------|------|------|
| `excel-parser.js` | 514줄 | Excel 파일 파싱 |
| `semantic-matcher.js` | 343줄 | AI 컬럼 의미 분석 |
| `data-anonymizer.js` | 191줄 | 데이터 익명화 |
| `file-uploader.js` | 208줄 | 파일 업로드 처리 |
| `folder-manager.js` | 253줄 | 폴더 관리 |

### 📚 프로비넌스 & 감사
| 모듈 | 크기 | 역할 |
|------|------|------|
| `provenance-graph.js` | 538줄 | 프로비넌스 그래프 생성 |
| `provenance-indexer.js` | 632줄 | 프로비넌스 인덱싱 |

### ⚙️ UI & 설정 관리
| 모듈 | 크기 | 역할 |
|------|------|------|
| `ui-manager.js` | 249줄 | UI 렌더링 (신규) |
| `settings-manager.js` | 203줄 | 설정 관리 (신규) |

### 🔧 유틸리티 모듈
| 모듈 | 크기 | 역할 |
|------|------|------|
| `local-storage-handler.js` | 494줄 | 로컬 저장소 관리 |
| `realtime-data-handler.js` | 299줄 | 실시간 데이터 처리 |

## hedge-manager.html 최적화 전략

### Phase 1: 완료 ✅
- [x] UI 렌더링 함수 → `ui-manager.js` 이동
- [x] 설정 관리 함수 → `settings-manager.js` 이동
- [x] 모듈 로드 HTML 추가

### Phase 2: 진행 중 🔄
- [ ] 모달 표시 함수들 → `modal-manager.js` 이동
- [ ] 업로드 핸들러 함수들 → `upload-handler.js` 이동
- [ ] hedge-manager.html에서 함수 제거

### Phase 3: 최종 (계획)
- [ ] hedge-manager.html 자체를 DOM 초기화 + 이벤트 바인딩만 담당하도록 축소
- [ ] 목표: 1500줄 이하로 축소

## 마이그레이션 방법

### 예시: renderPositions 함수 사용

**이전 (hedge-manager.html)**
```javascript
function renderPositions(positions) {
    // ... 구현 ...
}

renderPositions(data);
```

**이후 (ui-manager.js 사용)**
```javascript
window.uiManager.renderPositions(data);
```

### 예시: 설정 저장

**이전 (hedge-manager.html)**
```javascript
async function setTargetHedgeRatio(ratio) {
    // ... 구현 ...
}

await setTargetHedgeRatio(0.75);
```

**이후 (settings-manager.js 사용)**
```javascript
await window.settingsManager.setTargetHedgeRatio(0.75);
```

## 대기 중인 분리 작업

### `modal-manager.js` (예정)
- `showColumnMappingModal()`
- `showAnonymizationApprovalModal()`
- `showProvenanceGraph()`
- `showMandatoryFolderSetupModal()`
- `showInitialSettingsModal()`
- `showFolderSelectionModal()`

크기: ~600줄 예상

### `upload-handler.js` (예정)
- `uploadFolderFiles()`
- `handleFolderSelect()`
- `handleFileSelect()`
- `uploadExcelFile()`
- `handleDrop()`
- `handleDragOver()`
- `handleDragLeave()`

크기: ~800줄 예상

## 파일 크기 절약 효과

### 현재
```
hedge-manager.html: 4075줄 (204KB)
```

### Phase 1 이후 (현재 상태)
```
hedge-manager.html: ~3800줄 (190KB)
ui-manager.js: 249줄 추가
settings-manager.js: 203줄 추가
```

### Phase 2 이후 (예상)
```
hedge-manager.html: ~2200줄 (110KB) 
modal-manager.js: ~600줄
upload-handler.js: ~800줄
```

### Phase 3 이후 (목표)
```
hedge-manager.html: ~1500줄 (75KB) - 45% 감소
전체 모듈: 6500줄 (총 파일 로딩 크기 동일)
```

## 이점

✅ **가독성 향상**: 각 모듈이 단일 책임 가짐
✅ **유지보수성**: 함수 찾기 쉬움
✅ **테스트 용이성**: 각 모듈을 독립적으로 테스트 가능
✅ **재사용성**: 다른 프로젝트에서 모듈 재사용 가능
✅ **캐싱**: 브라우저에서 모듈 캐싱 가능
✅ **병렬 로딩**: 모듈들을 병렬로 로드 가능

## 모듈 로드 순서

```
1. event-bus.js (의존성 없음)
2. data-manager.js (event-bus 필요)
3. ui-manager.js (독립적)
4. settings-manager.js (독립적)
5. 나머지 모듈들 (순서 무관)
```

## 다음 단계

1. **modal-manager.js 생성** (계획된 Phase 2)
2. **upload-handler.js 생성** (계획된 Phase 2)
3. **hedge-manager.html에서 함수 제거** (Phase 2)
4. **통합 테스트** (Phase 3)

---

✨ 모듈화를 통해 더 깔끔하고 관리하기 쉬운 구조로 개선하고 있습니다!
