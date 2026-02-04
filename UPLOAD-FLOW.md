# 📂 엑셀 파일 업로드 플로우 (익명화 & 컬럼 매핑)

## 🎯 목적
고객이 엑셀 파일을 업로드하면 **서버 전송 전에** 클라이언트에서 자동으로:
1. 컬럼 자동 매핑 (AI 패턴 인식)
2. 민감정보 익명화
3. 사용자 승인 후 서버 전송

## 📋 전체 프로세스

### 1️⃣ 파일 선택
- **단일 파일**: `📄 파일 선택` 버튼
- **폴더**: `📂 폴더 선택` 버튼 (권장)

### 2️⃣ 엑셀 파일 읽기 및 컬럼 매핑
```javascript
// core/excel-parser.js
window.excelParser.parseExcelWithMapping(file)
```

**자동 인식 컬럼:**
- `통화` (currency) - 필수 ✅
- `금액` (amount) - 필수 ✅
- `거래처` (counterparty) - 민감정보 ⚠️
- `은행` (bank) - 민감정보 ⚠️
- `날짜` (date)
- `유형` (type)

**지원 형식:**
- 더존 ERP
- SAP
- 일반 Excel

### 3️⃣ 컬럼 매핑 확인 (단일 파일만)
**모달 표시:** `columnMappingModal`
- Excel 컬럼명
- 매핑된 필드
- 민감정보 여부 표시

**사용자 액션:**
- ✅ **승인**: 다음 단계로 진행
- ❌ **취소**: 업로드 중단

### 4️⃣ 데이터 익명화
```javascript
// core/data-anonymizer.js
window.dataAnonymizer.anonymizePositions(positions)
```

**제거되는 필드:**
- `counterparty` (거래처)
- `bank` (은행)
- `companyName` (회사명)
- `accountNumber` (계좌번호)

**생성되는 데이터:**
- `original[]`: 원본 데이터 (로컬에만 저장)
- `anonymized[]`: 익명화 데이터 (서버 전송용)

### 5️⃣ 익명화 승인
**모달 표시:** `anonymizationApprovalModal`

**Before & After 비교:**
- 원본 데이터 샘플 (최대 3건)
- 익명화 후 데이터 샘플
- 제거될 필드 목록

**동의 체크박스:**
```
☑️ 민감정보 제거에 동의하며, 익명화된 데이터만 서버로 전송됩니다.
   원본 데이터는 로컬에만 저장됩니다.
```

**사용자 액션:**
- ✅ **승인 및 전송**: 서버로 데이터 전송
- ❌ **취소**: 업로드 중단, 원본 삭제

### 6️⃣ 서버 전송 및 계산
```javascript
// core/data-manager.js
window.dataManager.addPositions(original, anonymized)

// core/api-client.js
window.apiClient.calculateHedge(anonymized, targetHedgeRatio)
```

**전송 데이터:**
- ✅ 익명화된 포지션 데이터
- ✅ 목표 헤지 비율
- ❌ 원본 데이터 (전송 안 됨)

### 7️⃣ 결과 표시
- KPI 업데이트 (총 노출액, 헤지 비율 등)
- 포지션 테이블 렌더링
- 성공 메시지 표시

## 🔒 보안 처리

| 항목 | 로컬 저장 | 서버 전송 |
|------|----------|----------|
| 원본 데이터 (민감정보 포함) | ✅ | ❌ |
| 익명화 데이터 | ✅ | ✅ |
| 거래처명 | ✅ | ❌ |
| 은행명 | ✅ | ❌ |
| 통화, 금액, 날짜 | ✅ | ✅ |

## 📁 폴더 업로드 플로우

```
사용자 → 폴더 선택
  ↓
각 Excel 파일 파싱 (자동 컬럼 매핑)
  ↓
모든 데이터 병합
  ↓
전체 데이터 익명화
  ↓
익명화 프리뷰 생성 (Before/After)
  ↓
익명화 승인 모달 표시
  ↓
사용자 승인 ✅
  ↓
Data Manager 저장 (로컬)
  ↓
API Client 서버 전송 (익명화 데이터만)
  ↓
서버 계산 결과 수신
  ↓
UI 업데이트 완료 🎉
```

## 🧪 테스트 방법

### 단일 파일 테스트
1. `📄 파일 선택` 클릭
2. Excel 파일 선택 (통화, 금액 컬럼 필수)
3. 컬럼 매핑 확인 모달 → **확인** 클릭
4. 익명화 승인 모달 확인:
   - Before/After 데이터 비교
   - 제거될 필드 확인
5. 동의 체크박스 선택
6. **승인 및 전송** 클릭
7. 성공 메시지 확인

### 폴더 업로드 테스트
1. `📂 폴더 선택` 클릭
2. Excel 파일이 있는 폴더 선택
3. 확인 메시지에서 **확인** 클릭
4. 파일 파싱 진행 상황 확인
5. 익명화 승인 모달 확인
6. 동의 체크박스 선택
7. **승인 및 전송** 클릭
8. 성공 메시지 확인

## 📊 로그 확인

브라우저 콘솔에서 다음 로그 확인:

```javascript
// Excel 파싱
📊 Excel 파일 읽기 시작: example.xlsx
📋 헤더: ['거래처', '통화', '금액', '날짜']
🗺️ 컬럼 매핑: { counterparty: 0, currency: 1, amount: 2, date: 3 }
✅ 5건 파싱 완료

// 익명화
🔒 5건의 데이터 익명화 시작
✅ 익명화 완료: 5건
📋 익명화 샘플: { id: 'anon_0_USD', currency: 'USD', ... }

// 승인 로그
📝 승인 로그: { timestamp: '...', action: 'anonymization_approved', recordCount: 5 }

// 서버 전송
📤 서버로 전송: POST /api/upload/positions
✅ 서버 응답: { success: true, kpi: {...} }
```

## 🐛 트러블슈팅

### 문제: 컬럼 자동 인식 실패
**원인:** Excel 헤더에 인식 가능한 키워드 없음  
**해결:** `core/excel-parser.js`의 `mappingRules` 수정

### 문제: 익명화 후 데이터 없음
**원인:** 필수 컬럼(통화, 금액) 누락  
**해결:** Excel 파일에 `통화`, `금액` 컬럼 추가

### 문제: 서버 전송 실패
**원인:** 서버 미실행 또는 포트 오류  
**해결:** `bash start-server.sh`로 서버 시작 확인 (포트 9000)

## 📚 관련 파일

| 파일 | 역할 |
|------|------|
| `hedge-manager.html` | 메인 UI 및 플로우 제어 |
| `core/excel-parser.js` | Excel 파일 읽기 및 컬럼 매핑 |
| `core/data-anonymizer.js` | 데이터 익명화 처리 |
| `core/data-manager.js` | 로컬 데이터 관리 |
| `core/api-client.js` | 서버 API 통신 |
| `core/folder-manager.js` | 폴더 선택 관리 |

## ✅ 완료 체크리스트

- [x] Excel 파일 자동 컬럼 매핑
- [x] 데이터 익명화 모듈
- [x] 컬럼 매핑 확인 모달
- [x] 익명화 승인 모달 (Before/After)
- [x] 단일 파일 업로드 플로우
- [x] 폴더 업로드 플로우
- [x] 원본 데이터 로컬 저장
- [x] 익명화 데이터만 서버 전송
- [x] 사용자 동의 체크박스
- [x] 진행 상황 Progress UI
- [x] 상세 로깅 및 디버깅

---

**마지막 업데이트:** 2026-02-04  
**작성자:** AI Assistant  
**버전:** v3.0 (모듈화 + 익명화 통합)
