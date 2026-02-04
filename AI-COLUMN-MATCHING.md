# 🧠 AI 기반 컬럼 매칭 시스템

## 개요
다양한 ERP 시스템(더존, 영림원, SAP, 한컴, 하나로 등)에서 Excel을 다운로드할 때 컬럼명이 각기 다른 문제를 해결하기 위한 의미론적 컬럼 매칭 시스템입니다.

---

## 🎯 핵심 기능

### 1. **3단계 하이브리드 매칭**
```
1단계: 정확한 키워드 매칭 ⚡ (빠름, 90% 이상 신뢰도)
2단계: Fuzzy 매칭 🔍 (중간, 70% 이상 신뢰도)  
3단계: 의미론적 유사도 🧠 (느림, 정확)
```

### 2. **ERP별 변형 지원**
각 ERP 시스템의 고유한 컬럼명을 사전 학습:
- **더존**: `외화종류`, `발생금액(외화)`, `결제예정일`
- **영림원**: `거래금액`, `외화잔액`, `만기일`
- **SAP**: `Currency`, `Amount`, `Due Date`
- **한컴**: `통화구분`, `금액(외화)`, `예정일`
- **하나로**: `외화명`, `외화수량`, `정산예정일`

### 3. **자동 학습 캐시**
한 번 매칭된 컬럼명은 캐시에 저장되어 즉시 재사용됩니다.

---

## 📊 매칭 로직

### 정확한 매칭 (Exact Match)
```javascript
"통화" === "통화" → 100% 신뢰도
"외화종류".includes("통화") → 95% 신뢰도
```

### Fuzzy 매칭 (Levenshtein Distance)
```javascript
"통화코드" vs "통화" → 편집 거리 계산
유사도 = 1 - (거리 / 최대길이)
```

### 의미론적 매칭 (Semantic Similarity)
```javascript
헤더: "외환거래금액"
설명: "거래 금액이나 외화 수량을 나타내는 숫자"
→ Jaccard 유사도 + TF-IDF 계산
```

---

## 🔧 사용법

### 자동 매칭 (기본)
```javascript
const parser = new ExcelParser();
const result = await parser.parseExcelWithMapping(file);
// 자동으로 AI 매칭 수행
```

### 수동 매칭 (선택)
```javascript
const matcher = window.semanticMatcher;
const match = await matcher.matchColumn("외화거래금액");
console.log(match);
// { field: "amount", score: 0.85, method: "semantic-local" }
```

### 일괄 매칭
```javascript
const headers = ["거래처명", "통화", "외화금액", "결제일"];
const results = await matcher.matchAll(headers);
console.log(results);
// {
//   "거래처명": { field: "counterparty", confidence: 1.0 },
//   "통화": { field: "currency", confidence: 1.0 },
//   "외화금액": { field: "amount", confidence: 0.95 },
//   "결제일": { field: "date", confidence: 0.9 }
// }
```

---

## 📋 지원되는 필드

| 필드 | 설명 | 인식 가능한 컬럼명 예시 |
|------|------|------------------------|
| `counterparty` | 거래처 | 거래처명, 업체명, 고객사, 상대처, Customer |
| `currency` | 통화 | 통화, 외화, 통화코드, Currency, CCY |
| `amount` | 금액 | 금액, 외화금액, 거래금액, Amount |
| `date` | 날짜 | 날짜, 거래일, 결제예정일, Date |
| `bank` | 은행 | 은행, 거래은행, Bank |
| `type` | 거래유형 | 유형, 구분, 수출/수입, Type |

---

## 🎨 신뢰도 기준

- **100%**: 정확히 일치
- **95%**: 부분 문자열 포함
- **70-90%**: Fuzzy 매칭
- **50-70%**: 의미론적 유사도
- **<50%**: 매칭 실패 (수동 매핑 필요)

---

## 🚀 성능 최적화

### 캐싱 전략
```javascript
// 첫 번째 매칭: 100ms
const match1 = await matcher.matchColumn("외화금액");

// 두 번째 매칭 (캐시): <1ms  
const match2 = await matcher.matchColumn("외화금액");
```

### 폴백 메커니즘
```
AI 매칭 실패 → 키워드 기반 매칭 → 오류 메시지
```

---

## 🔮 향후 확장 (선택 사항)

### 1. OpenAI Embeddings API 연동
```javascript
semanticMatcher.apiEndpoint = 'https://api.openai.com/v1/embeddings';
// 더 정확한 의미론적 매칭 가능
```

### 2. TensorFlow.js Universal Sentence Encoder
```javascript
// 브라우저에서 실행되는 딥러닝 모델
const model = await use.load();
const embeddings = await model.embed(["통화", "외화금액"]);
```

### 3. 사용자 학습 데이터
```javascript
// 사용자가 수정한 매핑을 학습
matcher.learn({
    "우리회사특수컬럼": "amount"
});
```

---

## 📝 예제: 다양한 ERP 처리

### 더존 ERP
```
Excel 헤더:
[거래처코드명, 외화종류, 발생금액(외화), 결제예정일, 수출입구분]

매칭 결과:
✅ counterparty ← "거래처코드명" (100%)
✅ currency ← "외화종류" (100%)
✅ amount ← "발생금액(외화)" (95%)
✅ date ← "결제예정일" (100%)
✅ type ← "수출입구분" (100%)
```

### 영림원 ERP
```
Excel 헤더:
[업체명, 통화, 거래금액, 만기일, 거래구분]

매칭 결과:
✅ counterparty ← "업체명" (100%)
✅ currency ← "통화" (100%)
✅ amount ← "거래금액" (100%)
✅ date ← "만기일" (95%)
✅ type ← "거래구분" (100%)
```

### SAP ERP
```
Excel 헤더:
[Customer, Currency, Amt in FC, Due Date, Transaction Type]

매칭 결과:
✅ counterparty ← "Customer" (100%)
✅ currency ← "Currency" (100%)
✅ amount ← "Amt in FC" (90%)
✅ date ← "Due Date" (100%)
✅ type ← "Transaction Type" (100%)
```

---

## 🐛 디버깅

### 매칭 과정 확인
```javascript
// 콘솔에서 매칭 과정 확인
const match = await semanticMatcher.matchColumn("외화거래금액");

// 출력 예시:
// 🧠 AI 기반 일괄 매칭 시작...
// ✅ "외화거래금액" → amount (신뢰도: 85.0%, 방법: fuzzy)
```

### 실패 시 수동 매핑
매칭에 실패하면 사용자에게 수동으로 선택하도록 UI를 표시할 수 있습니다.

---

## 🎯 실제 사용 예시

```javascript
// Excel 파일 업로드
const file = document.getElementById('fileInput').files[0];

// 자동 파싱 (AI 매칭 포함)
const parser = new ExcelParser();
const result = await parser.parseExcelWithMapping(file);

// 결과 확인
console.log('데이터:', result.data);
console.log('매핑:', result.mapping);

// 매핑 결과:
// {
//   "거래처코드명": "counterparty",
//   "외화종류": "currency",
//   "발생금액(외화)": "amount",
//   "결제예정일": "date"
// }
```

---

## 🌟 장점

1. **자동화**: 대부분의 ERP 형식을 자동 인식
2. **유연성**: 키워드 추가로 새로운 형식 지원 가능
3. **성능**: 캐싱으로 빠른 반복 처리
4. **확장성**: API 연동으로 더 정확한 매칭 가능
5. **투명성**: 매칭 과정과 신뢰도를 명확히 표시

---

## 📚 참고 자료

- Levenshtein Distance: https://en.wikipedia.org/wiki/Levenshtein_distance
- Jaccard Similarity: https://en.wikipedia.org/wiki/Jaccard_index
- TF-IDF: https://en.wikipedia.org/wiki/Tf%E2%80%93idf
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
- TensorFlow.js USE: https://www.tensorflow.org/js/models
