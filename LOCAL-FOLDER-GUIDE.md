# 로컬 폴더 기반 데이터 관리 가이드

## 🎯 개요

**HEDGEFREEDOM** (www.hedgefreedom.com)은 **로컬 폴더 기반** 데이터 관리 시스템을 사용합니다.  
*powered by hedgeOn Engine*  
고객의 데이터는 고객의 컴퓨터에 저장되며, 서버는 계산만 수행합니다.

**핵심 원칙:**
- ✅ **데이터 주권** - 고객 데이터는 고객 PC에만 저장
- ✅ **프라이버시** - 서버에 민감 정보 저장 안 함
- ✅ **오프라인 지속성** - 새로고침해도 데이터 유지
- ✅ **자동 백업** - 일별 히스토리 스냅샷

---

## 📂 폴더 구조

```
선택한 폴더/
│
├── data/                    ← 설정 및 현재 데이터
│   ├── settings.json        (목표 헤지 비율, 사용자 설정)
│   ├── positions.json       (현재 거래 포지션)
│   ├── kpi.json             (KPI 지표)
│   ├── suggestions.json     (헤지 제안)
│   └── alerts.json          (알림 데이터)
│
├── uploads/                 ← Excel 파일 업로드
│   ├── 2026-02-03_trade_data.xlsx
│   ├── 2026-02-01_trade_data.xlsx
│   └── ...
│
├── history/                 ← 일별 히스토리
│   ├── 2026-02-03/
│   │   ├── snapshot_2026-02-03T14-30-00.json
│   │   └── snapshot_2026-02-03T18-00-00.json
│   ├── 2026-02-02/
│   └── ...
│
└── cache/                   ← 임시 캐시
    └── exchange_rates.json
```

---

## 🚀 최초 사용 플로우

### 1단계: 폴더 선택 (최초 1회) - ⚠️ 필수 규칙

```
브라우저에서 http://localhost:9000/01 헤지매니저-new.html 열기
↓
"📁 작업 폴더 지정 (필수)" 모달 표시
↓
[📁 HEDGEFREEDOM 폴더 선택하기] 버튼 클릭
↓
문서 폴더에 "HEDGEFREEDOM" 폴더 생성 후 선택 (⚠️ 필수)
↓
하위 폴더 자동 생성 (data, uploads, history, cache)
```

**⚠️ 폴더명 고정 규칙:**
- ✅ **필수**: `HEDGEFREEDOM` (대문자)
- ✅ 또는: `헤지프리덤` (한글)
- ❌ 금지: 다른 이름 사용 시 경고 표시

**폴더 위치 (표준):**
- ✅ Windows: `C:\Users\사용자명\Documents\HEDGEFREEDOM`
- ✅ Mac: `~/Documents/HEDGEFREEDOM`
- ✅ Linux: `~/Documents/HEDGEFREEDOM`
- ⚠️ 클라우드: `~/OneDrive/HEDGEFREEDOM` (동기화 충돌 주의)

---

### 2단계: 초기 설정 (최초 1회)

```
"🎯 초기 설정" 모달 표시
↓
목표 헤지 비율 입력 (예: 75%)
↓
[설정 완료 및 대시보드 시작] 버튼 클릭
↓
data/settings.json 파일 생성
↓
대시보드 로드
```

**목표 헤지 비율 권장값:**
- 보수적: **85%** (리스크 회피 전략)
- 중립: **75%** (균형 전략) ← 기본값
- 공격적: **60%** (비용 절감 전략)

---

## 🔄 데이터 플로우

### 일반적인 작업 흐름

```
1. 로그인
   ↓
2. 로컬 폴더에서 데이터 로드
   - settings.json → 목표 헤지 비율
   - positions.json → 이전 거래
   - kpi.json → 이전 KPI
   ↓
3. 템플릿에 즉시 표시 (빠른 로딩)
   ↓
4. 서버에서 최신 데이터 가져오기 (백그라운드)
   ↓
5. 화면 업데이트 + 로컬 저장 (동시)
```

### Excel 업로드 시

```
1. 사용자가 Excel 파일 업로드
   ↓
2. uploads/2026-02-03_trade_data.xlsx 저장
   ↓
3. 서버로 전송 (계산용)
   POST /api/hedge/calculate
   ↓
4. 서버에서 계산 결과 반환
   ↓
5. 대시보드 업데이트
   ↓
6. 로컬 저장 (동시)
   - data/positions.json 업데이트
   - data/kpi.json 업데이트
   - history/2026-02-03/snapshot.json 생성
```

---

## 💾 데이터 저장 시점

| 이벤트 | 저장 파일 | 저장 위치 |
|--------|----------|----------|
| 최초 설정 | settings.json | data/ |
| Excel 업로드 | 원본 파일 | uploads/ |
| 헤지 계산 | positions.json, kpi.json | data/ |
| 제안 조회 | suggestions.json | data/ |
| 알림 조회 | alerts.json | data/ |
| 일별 스냅샷 | snapshot.json | history/YYYY-MM-DD/ |

---

## 🔒 보안 및 프라이버시

### 로컬 저장 (고객 PC)
- ✅ settings.json - 목표 헤지 비율
- ✅ positions.json - 거래 데이터
- ✅ Excel 원본 파일
- ✅ 히스토리 스냅샷

### 서버 전송 (계산 전용)
- ✅ 거래 데이터 (익명화)
- ✅ 목표 비율
- ❌ 회사명, 계좌번호 등 민감정보 제외

### 서버 저장 (하지 않음)
- ❌ 고객 데이터 저장 안 함
- ❌ 계산 결과만 반환
- ✅ 완전한 stateless 서버

---

## 🛠️ 문제 해결

### Q1. 폴더 선택이 취소되었어요
```
페이지 새로고침 → 폴더 선택 모달 다시 표시됨
```

### Q2. 권한 오류가 발생해요
```
브라우저 설정 → 사이트 설정 → 파일 시스템 권한 확인
또는
폴더 재선택: 우측 상단 ⚙️ 설정 → 작업 폴더 변경
```

### Q3. 데이터가 사라졌어요
```
브라우저가 IndexedDB를 삭제했을 가능성
→ 폴더 재선택하면 data/ 폴더의 파일이 그대로 있음
→ 데이터 복구 가능
```

### Q4. 다른 컴퓨터에서 사용하려면?
```
HedgeFreedom 폴더 전체를 복사
→ USB, 클라우드 등으로 이동
→ 새 컴퓨터에서 해당 폴더 선택
```

---

## 📊 API 엔드포인트

### 사용자 설정
```bash
# 설정 조회
GET /api/user/settings

# 설정 저장
POST /api/user/settings
{
  "targetHedgeRatio": 75,
  "companyName": "삼성전자",
  "industry": "제조업"
}
```

### 헤지 데이터
```bash
# 포지션 조회
GET /api/hedge/positions

# KPI 조회
GET /api/hedge/kpi

# 제안 조회
GET /api/hedge/suggestions

# 헤지 계산
POST /api/hedge/calculate
{
  "positions": [...],
  "targetRatio": 75
}
```

---

## 🎓 사용 예시

### JavaScript 코드 예시

```javascript
// 1. 초기화
await localStorageHandler.initialize();

// 2. 설정 저장
await localStorageHandler.saveSettings({
    targetHedgeRatio: 75,
    companyName: '삼성전자'
});

// 3. 설정 로드
const settings = await localStorageHandler.loadSettings();
console.log('목표 헤지 비율:', settings.targetHedgeRatio + '%');

// 4. Excel 파일 저장
const file = event.target.files[0];
const filename = await localStorageHandler.saveUploadedFile(file);

// 5. 전체 데이터 로드
const allData = await localStorageHandler.loadAllData();
console.log('포지션:', allData.positions);
console.log('KPI:', allData.kpi);

// 6. 스냅샷 저장
await localStorageHandler.saveSnapshot({
    positions: currentPositions,
    kpi: currentKPI,
    timestamp: new Date()
});
```

---

## 🔮 향후 로드맵

### Phase 1: 웹 버전 (현재) ✅
- File System Access API
- 최초 1회 폴더 선택
- IndexedDB에 핸들 저장

### Phase 2: Electron 데스크톱 앱 (향후)
- 자동 폴더 생성
- 백그라운드 자동 저장
- 시스템 트레이 알림
- 오프라인 완전 지원

### Phase 3: 클라우드 동기화 (선택)
- OneDrive, Google Drive 연동
- 멀티 디바이스 동기화
- 버전 관리

---

## 💡 Best Practices

1. **정기적인 백업**
   - HEDGEFREEDOM 폴더 전체를 주기적으로 백업
   - 클라우드 동기화 폴더 사용 권장

2. **폴더 위치**
   - 쉽게 접근 가능한 위치 (문서 폴더 권장)
   - 외장 드라이브는 비권장 (연결 안 될 수 있음)

3. **브라우저**
   - Chrome 86+ 또는 Edge 86+ 사용
   - 시크릿 모드 비권장 (IndexedDB 삭제됨)

4. **데이터 정리**
   - history/ 폴더는 3개월마다 정리
   - uploads/ 폴더는 6개월마다 정리

---

## 📞 지원

문제가 발생하면:
1. 브라우저 콘솔 확인 (F12)
2. server.log 파일 확인
3. GitHub Issues에 문의

**기술 스택:**
- Engine: hedgeOn (Python-based calculation engine)
- Frontend: File System Access API, IndexedDB
- Backend: hedgeOn API Server (계산 전용, 저장 안 함)
- Storage: 로컬 파일 시스템
- Domain: www.hedgefreedom.com

**보안 정책:**
- 고객 데이터는 절대 서버에 저장하지 않음
- 계산 결과만 반환
- 완전한 데이터 주권 보장
