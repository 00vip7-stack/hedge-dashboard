# 📂 로컬 폴더 기반 워크플로우 (최종 버전)

## 🎯 핵심 원칙

**HedgeFreedom**은 **고객 데이터 주권**을 최우선으로 합니다.

### 데이터 처리 방식
1. ✅ **원본 파일**: 고객 PC의 지정된 폴더에 **영구 보관**
2. ✅ **서버 전송**: 익명화된 데이터만 전송 (거래처, 은행 정보 제외)
3. ✅ **결과 저장**: 계산 결과를 로컬 '결과' 폴더에 자동 저장
4. ✅ **재사용**: 다음 로그인 시 로컬 폴더에서 자동 불러오기

---

## 📁 폴더 구조 (표준)

```
C:\Users\사용자명\Documents\HEDGEFREEDOM\
│
├── 원본/                     ← ERP에서 다운받은 Excel 파일 저장
│   ├── 2026-02-04_거래데이터.xlsx
│   ├── 2026-02-03_거래데이터.xlsx
│   └── ...
│
└── 결과/                     ← 계산 결과 자동 저장
    ├── latest_kpi.json              (최신 KPI - 재로그인 시 자동 로드)
    ├── latest_positions.json        (최신 포지션 - 재로그인 시 자동 로드)
    ├── kpi_2026-02-04T14-30-00.json (히스토리)
    ├── positions_2026-02-04T14-30-00.json
    └── ...
```

---

## 🔄 전체 워크플로우

### 1단계: 최초 설정 (1회만)

```
브라우저에서 hedge-manager.html 열기
  ↓
📁 폴더 설정 모달 표시
  ↓
"원본" 폴더 선택: C:\Users\...\HEDGEFREEDOM\원본
  ↓
"결과" 폴더 선택: C:\Users\...\HEDGEFREEDOM\결과
  ↓
목표 헤지 비율 설정 (예: 75%)
  ↓
✅ 설정 완료 → 브라우저에 폴더 권한 저장
```

### 2단계: 일상 업무 플로우

#### A. ERP에서 데이터 다운로드
```
ERP 시스템 접속
  ↓
거래 데이터 Excel 다운로드
  ↓
파일을 "원본" 폴더에 저장
  (예: C:\...\HEDGEFREEDOM\원본\2026-02-04_거래데이터.xlsx)
```

#### B. HedgeFreedom에서 처리
```
대시보드 접속 (hedge-manager.html)
  ↓
📂 폴더 선택 버튼 클릭
  ↓
"원본" 폴더 선택 → Excel 파일들 자동 인식
  ↓
[확인] 클릭
```

#### C. 자동 처리 과정 (사용자는 승인만)
```
1️⃣ Excel 파일 읽기
   - 통화, 금액, 거래처, 은행, 날짜 등 자동 인식
   
2️⃣ 컬럼 매핑 확인 (단일 파일만)
   - 매핑 결과 확인 모달 표시
   - [확인] 클릭
   
3️⃣ 데이터 익명화
   - 거래처명, 은행명 등 민감정보 제거
   - Before/After 비교 화면 표시
   
4️⃣ 익명화 승인
   ✅ 원본: 로컬 폴더에 유지
   📤 서버: 익명화 데이터만 전송
   💾 결과: '결과' 폴더에 자동 저장
   
   [동의 체크박스] 선택 → [승인 및 전송] 클릭
   
5️⃣ 서버 계산
   - 익명화된 데이터로만 계산
   - 총 노출액, 헤지 비율 등 산출
   
6️⃣ 결과 표시 및 저장
   - 대시보드에 결과 표시
   - '결과' 폴더에 자동 저장:
     * latest_kpi.json
     * latest_positions.json
     * 타임스탬프 히스토리 파일
```

### 3단계: 다음날 재사용

```
다음날 대시보드 열기
  ↓
📂 자동으로 폴더 권한 복구
  ↓
💾 '결과' 폴더에서 latest_*.json 자동 로드
  ↓
✅ 대시보드에 어제 결과 표시
  ↓
필요 시 새 데이터 업로드 반복
```

---

## 🔒 보안 및 프라이버시

### 원본 데이터 (로컬에만 존재)
- ✅ 거래처명
- ✅ 은행명
- ✅ 회사명
- ✅ 계좌번호
- ✅ 모든 민감정보

### 서버 전송 데이터 (익명화됨)
- ✅ 통화 (USD, EUR 등)
- ✅ 금액 (숫자만)
- ✅ 날짜
- ✅ 거래 유형 (수입/수출)
- ❌ 거래처 (제외됨)
- ❌ 은행 (제외됨)

### 결과 데이터 (로컬 저장)
- ✅ KPI 지표 (총 노출액, 헤지 비율 등)
- ✅ 포지션 데이터 (계산 결과)
- ✅ 헤지 제안
- ✅ 모든 히스토리

---

## 📊 파일 형식 예시

### 원본 Excel (ERP에서 다운로드)
```
거래처     | 통화 | 금액      | 결제일     | 은행
----------------------------------------
ABC Corp  | USD  | 100,000   | 2026-03-15 | 우리은행
XYZ Ltd   | EUR  | 50,000    | 2026-03-20 | 신한은행
```

### 익명화 후 (서버 전송)
```json
{
  "id": "anon_0_USD",
  "currency": "USD",
  "amount": 100000,
  "date": "2026-03-15",
  "type": "수입",
  "_anonymized": true
  // 거래처, 은행 정보 없음
}
```

### 결과 저장 (latest_kpi.json)
```json
{
  "totalExposure": 5250000000,
  "hedgedAmount": 3937500000,
  "hedgeRatio": 75,
  "unhedgedGap": 1312500000,
  "avgHedgeRate": 1345.5,
  "timestamp": "2026-02-04T14:30:00Z"
}
```

---

## 🛠️ 기술 구현

### 폴더 선택 (File System Access API)
```javascript
// 브라우저 표준 API 사용
const dirHandle = await window.showDirectoryPicker({
  mode: 'readwrite',
  startIn: 'documents'
});

// IndexedDB에 권한 저장 (재로그인 시 자동 복구)
await window.folderManager.saveFolderHandle('원본', dirHandle);
```

### 파일 읽기
```javascript
// 원본 폴더에서 Excel 파일 읽기
const files = await window.folderManager.readFilesFromFolder('원본');

// Excel 파싱 및 익명화
const { original, anonymized } = await window.excelParser.readExcelFile(file);
```

### 결과 저장
```javascript
// 계산 완료 후 자동 저장
await window.folderManager.saveFileToFolder(
  '결과', 
  'latest_kpi.json', 
  JSON.stringify(kpiData, null, 2)
);
```

### 자동 불러오기 (재로그인)
```javascript
// 페이지 로드 시 자동 실행
async function loadDataFromLocalFolder() {
  const kpiData = await window.folderManager.readFileFromFolder('결과', 'latest_kpi.json');
  const positions = await window.folderManager.readFileFromFolder('결과', 'latest_positions.json');
  
  // UI에 표시
  renderKPI(JSON.parse(kpiData));
  renderPositions(JSON.parse(positions));
}
```

---

## ✅ 장점

1. **데이터 주권**: 고객 데이터는 고객 PC에만 존재
2. **프라이버시**: 민감정보는 절대 서버로 전송 안 됨
3. **지속성**: 브라우저 새로고침해도 데이터 유지
4. **자동화**: 폴더 설정 후 모든 과정 자동
5. **히스토리**: 타임스탬프별로 모든 결과 보관
6. **오프라인**: 결과 확인은 인터넷 없이 가능

---

## ⚠️ 주의사항

### 폴더 권한
- Chrome/Edge 브라우저만 지원 (File System Access API)
- 폴더 선택 후 브라우저가 권한 기억 (IndexedDB)
- 브라우저 데이터 삭제 시 재설정 필요

### 폴더 위치
- ✅ 로컬 드라이브 (C:, D: 등) - 권장
- ⚠️ 네트워크 드라이브 - 느릴 수 있음
- ⚠️ 클라우드 (OneDrive, Google Drive) - 동기화 충돌 주의

### 백업
- 원본 폴더는 정기적으로 백업 권장
- 결과 폴더도 히스토리 관리 필요

---

## 🔧 문제 해결

### Q: 폴더를 찾을 수 없다는 오류
**A:** 폴더 권한 재설정 필요
- "폴더 설정" 버튼 클릭
- 폴더 다시 선택

### Q: 재로그인 시 데이터가 안 불러와짐
**A:** `latest_*.json` 파일 확인
- '결과' 폴더에 파일이 있는지 확인
- 없으면 데이터 재업로드 필요

### Q: 원본 파일이 삭제되었나요?
**A:** 절대 삭제되지 않습니다!
- 원본 파일은 항상 '원본' 폴더에 유지
- 서버로는 익명화된 복사본만 전송
- 취소해도 원본은 그대로

---

**마지막 업데이트:** 2026-02-04  
**버전:** v3.0 (폴더 기반 + 익명화)
