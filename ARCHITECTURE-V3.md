# 🌳 HedgeFreedom v3.0 - 모듈화 아키텍처

## 📦 개요

HedgeFreedom v3.0은 **버스/트리 구조**로 완전히 리팩토링되었습니다.
- **Event Bus**: 중앙 통신 허브
- **모듈화**: 관심사 분리 (Separation of Concerns)
- **클라이언트 익명화**: 민감정보 서버 전송 차단
- **확장 가능**: 새로운 기능 추가 용이

---

## 🏗️ 아키텍처 구조

```
┌─────────────────────────────────────────────┐
│          hedge-manager.html (메인)           │
│         UI 렌더링 + Event 연결               │
└──────────────┬──────────────────────────────┘
               │
       ┌───────▼───────┐
       │  Event Bus    │ ← 중앙 통신 허브
       │ (event-bus.js)│
       └───────┬───────┘
               │
      ┌────────┴────────┐
      │                 │
┌─────▼─────┐    ┌─────▼──────┐
│   Data    │    │    File    │
│  Manager  │    │  Uploader  │
└─────┬─────┘    └─────┬──────┘
      │                │
┌─────▼─────┐    ┌─────▼──────┐
│   API     │    │   Excel    │
│  Client   │    │   Parser   │
└─────┬─────┘    └─────┬──────┘
      │                │
┌─────▼─────┐    ┌─────▼──────┐
│  Folder   │    │    Data    │
│  Manager  │    │ Anonymizer │
└───────────┘    └────────────┘
```

---

## 📂 모듈 구조

### `core/event-bus.js` - 이벤트 버스
**역할**: 중앙 통신 허브, 모듈 간 느슨한 결합
```javascript
window.eventBus.on(EventTypes.DATA_LOADED, (data) => {
    console.log('데이터 로드:', data);
});

window.eventBus.emit(EventTypes.DATA_LOADED, { count: 100 });
```

**주요 이벤트**:
- `DATA_LOADED` - 데이터 로드 완료
- `FILE_UPLOADED` - 파일 업로드 완료
- `CALCULATION_COMPLETED` - 계산 완료
- `DATA_CLEARED` - 데이터 삭제
- `ERROR_OCCURRED` - 오류 발생

---

### `core/data-manager.js` - 데이터 상태 관리
**역할**: 원본/익명화 데이터 분리 관리, localStorage 저장

**주요 메서드**:
```javascript
// 데이터 추가
dataManager.addPositions(original, anonymized);

// 원본 데이터 (화면 표시용)
const positions = dataManager.getOriginalPositions();

// 익명화 데이터 (서버 전송용)
const anonPos = dataManager.getAnonymizedPositions();

// 전체 삭제
dataManager.clearAllData();
```

**데이터 흐름**:
```
원본 데이터 (거래처명 포함)
  ↓ 로컬 저장
  ↓ 화면 표시
  
익명화 데이터 (거래처명 제거)
  ↓ 서버 전송만
```

---

### `core/file-uploader.js` - 파일/폴더 업로드
**역할**: 파일 업로드 처리, Excel 파싱 호출

**주요 메서드**:
```javascript
// 단일 파일
const result = await fileUploader.uploadSingleFile(file);

// 폴더 (여러 파일)
const result = await fileUploader.uploadFolder(files);

// 드래그 앤 드롭
const result = await fileUploader.handleDroppedFiles(dataTransfer);
```

**반환값**:
```javascript
{
    original: [...]      // 원본 포지션
    anonymized: [...]    // 익명화 포지션
    results: [...]       // 파일별 처리 결과
}
```

---

### `core/excel-parser.js` - Excel 파싱
**역할**: Excel 파일 읽기, 컬럼 자동 매핑, 더존 ERP 지원

**주요 메서드**:
```javascript
// Excel 파일 파싱
const { original, anonymized } = await excelParser.readExcelFile(file);
```

**지원 형식**:
- 더존 ERP (외화금액, 결제예정일, 거래처명 등)
- SAP 형식
- 기본 형식 (통화, 금액, 날짜)

**컬럼 매핑**:
```javascript
{
    counterparty: ['거래처', '거래처명', '업체명'],
    currency: ['통화', '외화', '통화코드'],
    amount: ['금액', '외화금액', '거래금액'],
    date: ['날짜', '결제예정일', '거래일'],
    bank: ['은행', '거래은행'],
    type: ['유형', '거래유형', '구분']
}
```

---

### `core/data-anonymizer.js` - 익명화 처리
**역할**: 클라이언트에서 민감정보 제거

**주요 메서드**:
```javascript
// 포지션 익명화
const { original, anonymized } = dataAnonymizer.anonymizePositions(positions);

// 익명화 검증
const isValid = dataAnonymizer.validateAnonymization(data);
```

**제거되는 정보**:
- ❌ 거래처명 (counterparty)
- ❌ 은행명 (bank)
- ❌ 거래 ID (실제 ID)
- ❌ 계좌번호 (accountNumber)

**보존되는 정보**:
- ✅ 통화 (currency)
- ✅ 금액 (amount)
- ✅ 날짜 (date)
- ✅ 유형 (type)

---

### `core/api-client.js` - 서버 통신
**역할**: 익명화된 데이터만 서버 전송

**주요 메서드**:
```javascript
// 익명화 데이터 업로드
await apiClient.uploadAnonymizedPositions(anonymized);

// 헤지 계산 요청
const result = await apiClient.calculateHedge(anonymized, targetRatio);

// 최적화 제안
const suggestions = await apiClient.getOptimizationSuggestions(anonymized);
```

**보안**:
```javascript
// 익명화 검증 후 전송
const isValid = dataAnonymizer.validateAnonymization(data);
if (!isValid) {
    throw new Error('민감정보 포함됨!');
}
```

---

### `core/folder-manager.js` - 로컬 폴더 관리
**역할**: File System Access API, IndexedDB 폴더 핸들 저장

**주요 메서드**:
```javascript
// 폴더 설정
const dirHandle = await folderManager.setupLocalFolder('원본');

// 폴더 핸들 복구
await folderManager.restoreFolderHandles();

// 파일 저장
await folderManager.saveFileToFolder('결과', 'report.json', data);

// 파일 읽기
const content = await folderManager.readFileFromFolder('원본', 'data.xlsx');
```

---

## 🔄 데이터 흐름

### 1️⃣ 파일 업로드 시퀀스

```
사용자 파일 선택
    ↓
fileUploader.uploadSingleFile()
    ↓
excelParser.readExcelFile()
    ↓
dataAnonymizer.anonymizePositions()
    ↓ (원본 + 익명화 분리)
    ├─→ dataManager.addPositions() → localStorage (원본)
    └─→ apiClient.uploadAnonymizedPositions() → 서버 (익명화)
    ↓
eventBus.emit(FILE_UPLOADED)
    ↓
UI 렌더링 (원본 데이터)
```

### 2️⃣ 헤지 계산 시퀀스

```
사용자 "계산" 버튼 클릭
    ↓
dataManager.getAnonymizedPositions()
    ↓
apiClient.calculateHedge(anonymized, targetRatio)
    ↓
서버에서 계산
    ↓
결과 수신
    ↓
dataManager.updateKPI(result)
    ↓
eventBus.emit(CALCULATION_COMPLETED)
    ↓
UI 렌더링
```

### 3️⃣ 데이터 삭제 시퀀스

```
사용자 "전체 삭제" 클릭
    ↓
dataManager.clearAllData()
    ↓ (localStorage 삭제)
    ↓
eventBus.emit(DATA_CLEARED)
    ↓
clearUI() 호출
    ↓
빈 화면 표시
```

---

## 🔐 보안 아키텍처

### 클라이언트 익명화 원칙

```
┌─────────────────────────────────────────┐
│          클라이언트 (브라우저)            │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  원본 데이터 (민감정보 포함)    │    │
│  │  - 거래처명: "삼성전자"         │    │
│  │  - 은행: "KB국민은행"           │    │
│  │  - 금액: $100,000              │    │
│  └────────────────────────────────┘    │
│               ↓                          │
│      dataAnonymizer.anonymizePositions() │
│               ↓                          │
│  ┌────────────────────────────────┐    │
│  │  익명화 데이터 (민감정보 제거)  │    │
│  │  - 거래처명: (삭제)            │    │
│  │  - 은행: (삭제)                │    │
│  │  - 금액: $100,000              │    │
│  └────────────────────────────────┘    │
│               ↓                          │
└───────────────┼─────────────────────────┘
                │
       apiClient.uploadAnonymizedPositions()
                │
                ↓
┌─────────────────────────────────────────┐
│              서버                        │
│                                          │
│  수신: 익명화된 데이터만                 │
│  - 통화, 금액, 날짜만 저장               │
│  - 거래처명, 은행명 없음 ✅              │
└─────────────────────────────────────────┘
```

### GDPR/개인정보보호법 준수

✅ **클라이언트 처리**:
- 민감정보는 브라우저에만 저장
- localStorage에 원본 데이터 (로컬에만 존재)

✅ **서버 전송**:
- 통화, 금액, 날짜만 전송
- 거래처명, 은행명 전송 안 함

✅ **데이터 검증**:
```javascript
// 전송 전 검증
const isValid = dataAnonymizer.validateAnonymization(data);
if (!isValid) {
    throw new Error('민감정보 포함됨! 전송 중단');
}
```

---

## 🚀 확장 가이드

### 새로운 모듈 추가

1. **모듈 파일 생성** (`core/my-module.js`)
```javascript
class MyModule {
    constructor() {
        console.log('MyModule 초기화');
    }
    
    doSomething() {
        // 작업 수행
        window.eventBus.emit('MY_EVENT', { data: 'result' });
    }
}

window.myModule = new MyModule();
```

2. **hedge-manager.html에 추가**
```html
<script src="core/my-module.js"></script>
```

3. **이벤트 리스너 등록**
```javascript
window.eventBus.on('MY_EVENT', (data) => {
    console.log('이벤트 수신:', data);
});
```

---

## 📊 성능 최적화

### 모듈 로딩 순서
```html
<!-- 1. 라이브러리 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

<!-- 2. Event Bus (최우선) -->
<script src="core/event-bus.js"></script>

<!-- 3. 핵심 모듈 -->
<script src="core/data-anonymizer.js"></script>
<script src="core/excel-parser.js"></script>
<script src="core/api-client.js"></script>

<!-- 4. 기능 모듈 -->
<script src="core/folder-manager.js"></script>
<script src="core/data-manager.js"></script>
<script src="core/file-uploader.js"></script>
```

### 메모리 관리
- 원본 데이터: `dataManager` 상태에만 보관
- 익명화 데이터: 서버 전송 후 자동 정리
- 이벤트 리스너: `eventBus.off()` 로 정리 가능

---

## 🧪 테스트

### 모듈 로드 확인
```javascript
// 브라우저 콘솔에서
console.log(window.eventBus);      // EventBus 확인
console.log(window.dataManager);   // DataManager 확인
console.log(window.fileUploader);  // FileUploader 확인
```

### 익명화 검증
```javascript
const positions = [
    { counterparty: '삼성전자', currency: 'USD', amount: 100000 }
];

const { original, anonymized } = window.dataAnonymizer.anonymizePositions(positions);

console.log(original[0].counterparty);    // '삼성전자'
console.log(anonymized[0].counterparty);  // undefined (삭제됨)
```

---

## 📝 마이그레이션 가이드 (v2 → v3)

### 변경 사항

| v2 (모놀리식) | v3 (모듈화) |
|--------------|------------|
| `uploadFolderFiles()` 내부 구현 | `fileUploader.uploadFolder()` |
| `readExcelFile()` 직접 호출 | `excelParser.readExcelFile()` |
| `localStorage` 직접 접근 | `dataManager.addPositions()` |
| `fetch()` 직접 호출 | `apiClient.uploadAnonymizedPositions()` |
| 전역 변수 (`globalPositions`) | `dataManager.getOriginalPositions()` |

### Before (v2)
```javascript
// v2 방식
const positions = JSON.parse(localStorage.getItem('positions'));
const response = await fetch('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ positions })
});
```

### After (v3)
```javascript
// v3 방식
const positions = window.dataManager.getAnonymizedPositions();
const result = await window.apiClient.uploadAnonymizedPositions(positions);
```

---

## 🎯 베스트 프랙티스

1. **Event Bus 사용**
   - 모듈 간 직접 호출 최소화
   - 이벤트로 통신

2. **데이터 분리**
   - 원본: 화면 표시 + 로컬 저장
   - 익명화: 서버 전송만

3. **에러 핸들링**
   ```javascript
   window.eventBus.on(EventTypes.ERROR_OCCURRED, (error) => {
       console.error('오류:', error);
       showErrorMessage(error.message);
   });
   ```

4. **모듈 의존성 관리**
   - Event Bus 먼저 로드
   - 순환 참조 방지

---

## 📚 참고 자료

- Event Bus Pattern: https://en.wikipedia.org/wiki/Event-driven_architecture
- File System Access API: https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
- GDPR 가이드: https://gdpr.eu/

---

**작성일**: 2026-02-04  
**버전**: 3.0  
**작성자**: HedgeFreedom Team
