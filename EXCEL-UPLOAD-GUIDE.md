# 엑셀 업로드 및 익명화 가이드

## 🎯 개요

**HEDGEFREEDOM**의 엑셀 업로드 시스템은 고객의 거래 데이터를 자동으로 파싱하고 익명화하여 처리합니다.

## 📋 지원하는 엑셀 형식

### 기본 컬럼 구조

```
| 거래ID | 거래처명 | 통화 | 외화금액 | 결제예정일 | 수출/수입 | 헤지상태 |
```

### 컬럼 인식 키워드

시스템은 다양한 헤더명을 자동으로 인식합니다:

- **거래ID**: `거래ID`, `TradeID`, `ID`, `번호`
- **거래처명**: `거래처`, `업체`, `회사`, `Counterparty`, `Company`, `Client`
- **통화**: `통화`, `Currency`, `Curr`
- **외화금액**: `금액`, `외화금액`, `Amount`, `Value`
- **결제예정일**: `결제`, `만기`, `예정일`, `Settlement`, `Maturity`, `Date`
- **수출/수입**: `수출`, `수입`, `구분`, `Type`, `Export`, `Import`
- **헤지상태**: `헤지`, `Hedge`, `상태`, `Status`

### 지원하는 통화

- **USD** (달러, US Dollar)
- **EUR** (유로, Euro)
- **JPY** (엔, Yen)
- **CNY** (위안, RMB)
- **GBP** (파운드, Pound)

### 날짜 형식

다음 형식을 자동 인식합니다:
- `2026-02-03` (ISO 형식)
- `2026/02/03`
- `2026.02.03`
- `02/03/2026`
- `03/02/2026`

## 🔒 데이터 익명화

### 자동 익명화 항목

1. **거래처명 익명화**
   - 원본: `ABC Trading Co.`, `글로벌상사`, `XYZ Corporation`
   - 익명화: `거래처A`, `거래처B`, `거래처C`

2. **개인정보 제거**
   - 이메일: `user@example.com` → `[이메일제거]`
   - 전화번호: `010-1234-5678` → `[전화번호제거]`
   - 주민등록번호: `123456-1234567` → `[주민번호제거]`
   - 사업자등록번호: `123-45-67890` → `[사업자번호제거]`

3. **고객별 분리**
   - 각 고객은 고유 ID로 관리
   - 같은 거래처명도 고객별로 다르게 익명화

## 📊 처리 프로세스

```
[엑셀 업로드]
    ↓
[파일 검증]
 - 확장자 체크 (.xlsx, .xls)
 - 파일 크기 (최대 10MB)
    ↓
[엑셀 파싱]
 - 헤더 자동 인식
 - 컬럼 매핑
 - 데이터 추출
    ↓
[데이터 익명화]
 - 거래처명 마스킹
 - 개인정보 제거
    ↓
[KPI 계산]
 - 총 노출액
 - 헤지 비율
 - 갭 분석
    ↓
[JSON 응답]
 - 익명화된 포지션 데이터
 - 계산된 KPI
    ↓
[로컬 저장 + UI 업데이트]
```

## 🚀 사용 방법

### 1. 샘플 파일 생성

```bash
python create_sample_excel.py
```

생성되는 파일:
- `sample_trades.xlsx` - 표준 형식 (20건의 샘플 데이터)
- `sample_no_header.xlsx` - 헤더 없는 경우
- `sample_various_formats.xlsx` - 다양한 형식

### 2. 테스트 페이지에서 업로드

```
http://localhost:9000/test-excel-upload.html
```

또는 실제 헤지매니저:

```
http://localhost:9000/01%20헤지매니저-new.html
```

### 3. 프로그래밍 방식 사용

```python
from excel_parser import ExcelParser, DataAnonymizer, calculate_kpi

# 엑셀 파싱
parser = ExcelParser(file_path='sample_trades.xlsx')
trades = parser.parse_trade_data()

# 익명화
anonymizer = DataAnonymizer(customer_id='customer_123')
anonymized_trades = anonymizer.anonymize_trades(trades)

# KPI 계산
kpi = calculate_kpi(anonymized_trades)

print(f"총 {len(anonymized_trades)}건 처리")
print(f"헤지 비율: {kpi['currentHedgeRatio']}%")
```

## 📝 API 엔드포인트

### POST /api/upload/excel

엑셀 파일 업로드 및 처리

**요청:**
```
Content-Type: multipart/form-data

FormData:
  - file: [Excel 파일]
  - customerId: [고객 ID]
  - uploadDate: [업로드 일시]
```

**응답:**
```json
{
  "success": true,
  "message": "파일 업로드 및 처리 완료",
  "data": {
    "positions": [...],
    "kpi": {
      "totalExposure": 3933568984,
      "hedgedAmount": 1325970886,
      "currentHedgeRatio": 33.7,
      "targetHedgeRatio": 70,
      "gap": -36.3,
      "unhedgedAmount": 2607598097
    },
    "uploadId": "upload_20260203_143052",
    "processedAt": "2026-02-03T14:30:52.123456",
    "fileName": "sample_trades.xlsx",
    "tradeCount": 20,
    "customerId": "customer_test_12345"
  }
}
```

**오류 응답:**
```json
{
  "success": false,
  "error": "오류 메시지"
}
```

## 🧪 테스트

### 전체 테스트 실행

```bash
python test_excel_parser.py
```

테스트 항목:
1. ✅ 엑셀 파싱 (다양한 형식)
2. ✅ 데이터 익명화
3. ✅ KPI 계산

### 개별 모듈 테스트

```python
# 파서 테스트
from excel_parser import ExcelParser
parser = ExcelParser(file_path='sample_trades.xlsx')
trades = parser.parse_trade_data()
print(f"{len(trades)}건 파싱 완료")

# 익명화 테스트
from excel_parser import DataAnonymizer
anonymizer = DataAnonymizer('test_customer')
anonymized = anonymizer.anonymize_trades(trades)
print(f"{len(anonymizer.anonymization_map)}개 거래처 익명화")
```

## 📁 파일 저장

업로드된 파일은 다음 위치에 저장됩니다:

```
uploads/
├── customer_123_20260203_143052_sample_trades.xlsx
├── customer_456_20260203_150234_trade_data.xlsx
└── ...
```

파일명 형식: `{customerId}_{timestamp}_{originalFilename}`

## 🔐 보안 고려사항

1. **서버 저장 최소화**
   - 원본 파일은 처리 후 삭제 가능 (옵션)
   - 익명화된 데이터만 서버에 유지

2. **고객 데이터 분리**
   - 고객 ID 기반 완전 분리
   - 다른 고객 데이터 접근 불가

3. **전송 보안**
   - HTTPS 사용 권장 (프로덕션)
   - 파일 크기 제한 (10MB)

## 📋 요구사항

```
openpyxl>=3.0.0    # Excel 파일 처리
gunicorn>=20.1.0   # WSGI 서버
```

## 🎓 엑셀 템플릿 작성 가이드

### 최소 구성

```
| ID | 거래처 | 통화 | 금액 |
```

### 권장 구성

```
| 거래ID | 거래처명 | 통화 | 외화금액 | 결제예정일 | 수출/수입 | 헤지상태 |
```

### 주의사항

- ✅ 첫 번째 행은 헤더로 인식
- ✅ 금액은 숫자 형식 (쉼표 포함 가능)
- ✅ 날짜는 다양한 형식 지원
- ❌ 병합된 셀 사용 자제
- ❌ 수식은 값으로 변환 필요

## 🐛 문제 해결

### 파싱 실패

**증상:** "거래 데이터를 찾을 수 없습니다"

**해결:**
1. 첫 행에 헤더가 있는지 확인
2. 필수 컬럼(통화, 금액) 포함 확인
3. 금액 컬럼에 숫자 데이터 확인

### 익명화 안됨

**증상:** 원본 거래처명 그대로 표시

**해결:**
- 서버 로그 확인: `tail -f logs/hedge-server.log`
- DataAnonymizer 초기화 확인

### 업로드 실패

**증상:** "서버 오류 500"

**해결:**
1. 서버 실행 확인: `curl http://localhost:9000/api/health`
2. 파일 크기 확인 (10MB 이하)
3. 파일 확장자 확인 (.xlsx, .xls)

## 📞 지원

문의: support@hedgefreedom.com
웹사이트: www.hedgefreedom.com
