# 📚 프로비넌스 아카이브 가이드

## 개요

프로비넌스 아카이브는 **모든 데이터 처리 이력을 자동으로 기록하고 인덱싱**하여, 감사 대응, 회계 처리, 규제 준수를 완벽하게 지원하는 시스템입니다.

> "여기 오면 모든 문서가 다 있다" - 완전한 데이터 거버넌스

---

## 🎯 핵심 기능

### 1. **자동 아카이빙**
- Excel 업로드 → 처리 → 승인 → 서버 전송 **전 과정 자동 기록**
- 각 단계마다 타임스탬프, 상태, 메타데이터 저장
- 사용자 개입 없이 완전 자동화

### 2. **다차원 인덱싱**
```
✅ 파일명 인덱스
✅ 날짜 인덱스 (업로드 시각)
✅ ERP 시스템 인덱스 (더존, 영림원, SAP 등)
✅ 품질 점수 인덱스
✅ 상태 인덱스 (성공/실패/승인/거부)
✅ 체크섬 인덱스 (중복 방지)
✅ 전문 검색 (Full-text Search)
```

### 3. **감사 대응**
- 단일 JSON 파일로 전체 이력 내보내기
- CSV 형식으로 Excel 호환 리포트 생성
- 감사관에게 제출 가능한 완전한 증빙 자료

### 4. **통계 대시보드**
- 전체 문서 수
- 평균 데이터 품질
- 처리된 총 데이터 양
- 평균 처리 시간
- 데이터베이스 크기

---

## 📊 기록되는 정보

### 파일 메타데이터
```json
{
  "source": {
    "filename": "sample_trades.xlsx",
    "fileSize": 45678,
    "fileType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "lastModified": "2026-02-04T10:30:00.000Z",
    "uploadedAt": "2026-02-04T10:35:12.345Z",
    "checksum": "a1b2c3d4e5f6..." // SHA-256
  }
}
```

### ERP 시스템 탐지
```json
{
  "erp": {
    "name": "더존",
    "confidence": 0.95,
    "matchedColumns": ["거래처코드명", "외화종류", "발생금액(외화)"]
  }
}
```

### 컬럼 매핑 이력
```json
{
  "mappingResults": {
    "거래처코드명": {
      "field": "counterparty",
      "confidence": 1.0,
      "method": "exact"
    },
    "외화종류": {
      "field": "currency",
      "confidence": 1.0,
      "method": "exact"
    }
  },
  "statistics": {
    "totalColumns": 15,
    "highConfidence": 12,
    "mediumConfidence": 2,
    "lowConfidence": 1
  }
}
```

### 데이터 추출 통계
```json
{
  "extractionStats": {
    "originalRows": 1500,
    "extractedRows": 1500,
    "originalColumns": 15,
    "extractedColumns": 6,
    "dataReduction": "60.5%"
  }
}
```

### 사용자 승인
```json
{
  "userId": "customer_1234567890",
  "approved": true,
  "comment": "사용자가 데이터 추출을 승인함",
  "reviewedAt": "2026-02-04T10:36:00.000Z"
}
```

### 서버 전송
```json
{
  "endpoint": "/api/calculate",
  "success": true,
  "response": { "status": "success" },
  "transmittedAt": "2026-02-04T10:36:15.000Z"
}
```

### 데이터 품질 지표
```json
{
  "overall": 0.92,
  "dimensions": {
    "completeness": 1.0,
    "accuracy": 0.95,
    "consistency": 1.0,
    "timeliness": 0.8
  },
  "issues": [],
  "recommendations": []
}
```

---

## 🔍 사용 방법

### 1. 아카이브 열기
```
사이드바 → 감사 & 규제 → 📚 프로비넌스 아카이브
```

### 2. 검색 필터
- **파일명**: 부분 일치 검색
- **ERP 시스템**: 더존/영림원/SAP/한컴/하나로
- **날짜 범위**: 시작일~종료일
- **품질 점수**: 우수/양호/보통/불량
- **상태**: 성공/실패/승인/거부
- **전문 검색**: JSON 전체에서 키워드 검색

### 3. 검색 예시

#### 특정 날짜의 모든 업로드
```
날짜 범위: 2026-02-01 ~ 2026-02-28
```

#### 더존 ERP에서 품질 낮은 업로드
```
ERP: 더존
품질: 보통 (50% 이상)
```

#### 실패한 업로드 찾기
```
상태: failed
```

#### 특정 파일 검색
```
파일명: 매출채권
```

#### 전문 검색 (고급)
```
전문 검색: "외화종류"
→ JSON 내용에 "외화종류"가 포함된 모든 문서
```

---

## 📦 감사 보고서 내보내기

### 1. CSV 내보내기
```
📊 CSV 내보내기 버튼 클릭
→ Excel로 열기 가능한 CSV 파일 다운로드
```

**CSV 포함 항목:**
- ID
- 업로드 날짜
- 파일명
- ERP 시스템
- 상태
- 품질 점수
- 처리 시간
- 데이터 행수
- 체크섬

### 2. 감사 보고서 (JSON)
```
📦 감사 보고서 버튼 클릭
→ 완전한 감사 보고서 JSON 다운로드
```

**감사 보고서 구조:**
```json
{
  "generatedAt": "2026-02-04T...",
  "generatedBy": "HedgeFreedom Provenance Indexer",
  "purpose": "감사 대응 및 규제 준수",
  "recordCount": 150,
  "period": {
    "from": "2026-01-01T...",
    "to": "2026-02-04T..."
  },
  "summary": {
    "total": 150,
    "avgQuality": 0.89,
    "byERP": { "더존": 80, "영림원": 50, "SAP": 20 }
  },
  "records": [ /* 전체 프로비넌스 */ ]
}
```

---

## 📈 통계 대시보드

### 표시 항목

1. **총 문서**: 아카이브된 전체 문서 수
2. **평균 품질**: 모든 업로드의 평균 데이터 품질 점수
3. **처리 데이터**: 처리된 총 행(row) 수
4. **평균 처리시간**: 업로드부터 완료까지 평균 시간 (초)
5. **DB 크기**: IndexedDB 사용 용량 (MB)

### ERP별 분포 차트
- 각 ERP 시스템별 문서 수
- 비율 및 건수 표시

### 품질 분포 차트
- 우수 (90% 이상)
- 양호 (70-90%)
- 보통 (50-70%)
- 불량 (50% 미만)

---

## 🔐 보안 및 개인정보

### 저장 위치
- **IndexedDB**: 브라우저 로컬 스토리지
- **서버 전송 안 함**: 프로비넌스는 로컬에만 저장
- **사용자 완전 통제**: 브라우저 데이터만 삭제하면 모두 삭제

### 민감정보 제외
프로비넌스에는 **민감정보가 포함되지 않습니다**:
- ❌ 거래처명 (counterparty)
- ❌ 은행명 (bank)
- ❌ 계좌번호 (accountNumber)
- ❌ 담당자 이름/이메일/전화번호

프로비넌스는 **메타데이터만** 저장:
- ✅ 파일명
- ✅ 업로드 시각
- ✅ ERP 시스템
- ✅ 컬럼 매핑 결과
- ✅ 데이터 품질 점수
- ✅ 처리 단계 이력

---

## 🛠️ 고급 기능

### 1. 중복 검사
```javascript
const duplicates = await provenanceIndexer.findDuplicates(checksum);
if (duplicates.length > 0) {
  alert('동일한 파일이 이미 업로드되었습니다.');
}
```

### 2. 최근 문서 조회
```javascript
const recent = await provenanceIndexer.getRecent(10);
// 최근 10개 문서
```

### 3. 날짜 범위 조회
```javascript
const records = await provenanceIndexer.getByDateRange(
  '2026-02-01',
  '2026-02-28'
);
```

### 4. 품질 필터링
```javascript
const lowQuality = await provenanceIndexer.getByQuality(0, 0.5);
// 품질 50% 미만인 문서
```

### 5. 데이터베이스 크기 확인
```javascript
const size = await provenanceIndexer.getDatabaseSize();
console.log(`총 ${size.records}건, ${size.sizeInMB}MB`);
```

---

## 📋 실제 사용 시나리오

### 시나리오 1: 회계감사 대응
```
감사관: "2026년 1월의 모든 외화 거래 데이터 처리 이력을 제출하세요."

대응:
1. 프로비넌스 아카이브 열기
2. 날짜 범위: 2026-01-01 ~ 2026-01-31
3. 📦 감사 보고서 다운로드
4. 감사관에게 제출
```

### 시나리오 2: 데이터 품질 모니터링
```
매주 월요일:
1. 프로비넌스 아카이브 열기
2. 지난주 날짜 범위 설정
3. 품질 분포 차트 확인
4. 품질 낮은 업로드 검토
```

### 시나리오 3: ERP 전환 검증
```
더존 → SAP 전환 시:
1. ERP 필터: 더존
2. 전체 문서 확인
3. 평균 품질 점수 기록
4. ERP 필터: SAP로 변경
5. 새 시스템 품질 비교
```

### 시나리오 4: 규제 준수 증빙
```
금융당국: "데이터 처리 과정이 규정을 준수하는지 증명하세요."

대응:
1. 프로비넌스 아카이브 열기
2. 전체 기간 검색
3. 📊 CSV 내보내기
4. 모든 단계 (ERP탐지 → 매핑 → 추출 → 승인 → 전송) 증빙
```

### 시나리오 5: 중복 업로드 방지
```
같은 파일 재업로드 시:
1. 체크섬 자동 계산
2. 아카이브에서 중복 검사
3. 경고 메시지 표시
4. 기존 문서 링크 제공
```

---

## 🎓 모범 사례

### 1. 정기적인 아카이브 점검
- **주간**: 지난주 업로드 품질 검토
- **월간**: 월별 통계 확인 및 리포트 생성
- **분기**: 감사 보고서 백업

### 2. 품질 관리
- 품질 80% 미만 → 재처리 검토
- 품질 50% 미만 → 즉시 재업로드
- 패턴 분석: 특정 ERP에서 반복적으로 품질 낮으면 매핑 개선

### 3. 스토리지 관리
- DB 크기 100MB 이상 → 오래된 문서 정리
- CSV 백업 후 IndexedDB 일부 삭제
- 중요 문서는 JSON 다운로드하여 별도 보관

### 4. 감사 대비
- 월말마다 감사 보고서 생성
- 외부 스토리지(Google Drive, OneDrive 등)에 백업
- 중요 거래는 프로비넌스 상세 내역 인쇄 보관

---

## 🐛 문제 해결

### Q: 아카이브가 비어있습니다
**A:** 
- 아직 Excel을 업로드하지 않았을 수 있습니다
- 업로드는 했지만 승인을 완료하지 않았을 수 있습니다
- 프로비넌스는 **승인 후 서버 전송 시점**에 저장됩니다

### Q: 검색 결과가 없습니다
**A:**
- 필터 조건이 너무 엄격할 수 있습니다
- 날짜 범위를 넓히거나 필터를 해제하세요
- "전문 검색"은 대소문자를 구분하지 않습니다

### Q: DB 크기가 너무 큽니다
**A:**
```javascript
// 콘솔에서 실행
await window.provenanceIndexer.deleteAll();
// 주의: 모든 프로비넌스가 삭제됩니다!
```

### Q: 감사 보고서가 너무 큽니다
**A:**
- 날짜 범위를 좁혀서 부분 내보내기
- CSV 형식 사용 (더 작음)
- 검색 필터로 필요한 문서만 선택

---

## 📚 API 레퍼런스

### ProvenanceIndexer 클래스

#### `initialize()`
```javascript
await provenanceIndexer.initialize();
// IndexedDB 초기화
```

#### `save(provenance)`
```javascript
const id = await provenanceIndexer.save(provenance);
// 프로비넌스 저장, ID 반환
```

#### `getById(id)`
```javascript
const record = await provenanceIndexer.getById(123);
// ID로 조회
```

#### `getAll(options)`
```javascript
const records = await provenanceIndexer.getAll({
  limit: 100,
  offset: 0,
  sortBy: 'timestamp',
  sortOrder: 'desc'
});
```

#### `search(filters)`
```javascript
const results = await provenanceIndexer.search({
  filename: '매출',
  erpSystem: '더존',
  dateFrom: '2026-01-01',
  dateTo: '2026-01-31',
  minQuality: 0.8,
  status: 'success'
});
```

#### `getStatistics()`
```javascript
const stats = await provenanceIndexer.getStatistics();
// {
//   total: 150,
//   avgQuality: 0.89,
//   byERP: {...},
//   byStatus: {...},
//   qualityDistribution: {...}
// }
```

#### `exportForAudit(ids)`
```javascript
const blob = await provenanceIndexer.exportForAudit();
// 감사 보고서 Blob
```

#### `exportToCSV()`
```javascript
const blob = await provenanceIndexer.exportToCSV();
// CSV Blob
```

---

## 🌟 장점

1. **완전 자동화**: 사용자 개입 없이 모든 이력 자동 기록
2. **규제 준수**: 금융당국 요구사항 즉시 대응 가능
3. **감사 대응**: 클릭 한 번으로 완전한 증빙 자료 생성
4. **데이터 거버넌스**: 누가, 언제, 무엇을, 어떻게 처리했는지 완벽 추적
5. **품질 관리**: 데이터 품질 추이 모니터링
6. **중복 방지**: 체크섬 기반 중복 검사
7. **빠른 검색**: 다차원 인덱싱으로 즉시 검색
8. **로컬 저장**: 민감정보 외부 유출 없음

---

## 🔮 향후 확장

1. **자동 백업**: 클라우드 스토리지 연동
2. **알림 기능**: 품질 낮은 업로드 자동 알림
3. **ML 분석**: 품질 패턴 학습 및 예측
4. **블록체인**: 변경 불가능한 감사 로그
5. **멀티 테넌트**: 여러 고객사 분리 관리
6. **데이터 거버넌스 대시보드**: 실시간 모니터링
7. **자동 리포트**: 주간/월간 품질 리포트 이메일 발송

---

## 💡 결론

프로비넌스 아카이브는 **"여기 오면 모든 문서가 다 있다"**는 확신을 제공합니다.

감사, 규제, 회계, 품질 관리 등 **모든 상황에 완벽하게 대응**할 수 있는 완전한 데이터 거버넌스 시스템입니다.
