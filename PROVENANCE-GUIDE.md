# 📊 데이터 프로비넌스 그래프 (Data Provenance Graph)

## 개요
Excel 업로드부터 서버 전송까지 모든 데이터 처리 과정을 추적하여 **감사 추적(Audit Trail)** 및 **규제 준수(Compliance)**를 지원하는 시스템입니다.

---

## 🎯 왜 필요한가?

### 금융 데이터의 특수성
- **감사 대응**: "이 데이터는 어디서 왔고, 어떻게 처리되었나?"
- **규제 준수**: 개인정보 보호법, 금융위원회 규정 준수 증빙
- **오류 추적**: 문제 발생 시 정확한 원인 파악
- **데이터 품질**: 신뢰할 수 있는 데이터인지 검증

### 실제 사례
```
감사관: "이 헤지 비율은 어떻게 계산된 건가요?"
담당자: "프로비넌스 그래프를 확인하시면..."

📊 프로비넌스 그래프:
1. 파일: sample_trades.xlsx (2026-02-04 10:30 업로드)
2. ERP: 더존 (신뢰도 95%)
3. AI 매칭: 5개 컬럼 100% 정확도
4. 추출: 1,234건 → 서버 전송용 4개 필드만
5. 사용자 승인: user_123 (10:32)
6. 서버 계산: 성공 (10:33)
7. 데이터 품질: 92.5%
```

---

## 🏗️ 아키텍처

### 프로비넌스 그래프 구조
```
[원본 파일] 
    ↓ analyzed
[ERP 탐지]
    ↓ mapped
[컬럼 매핑]
    ↓ extracted
[데이터 추출]
    ↓ reviewed
[사용자 승인]
    ↓ transmitted
[서버 전송]
```

### 노드 (Node) 구조
```javascript
{
    id: 'column-mapping',
    type: 'transformation',
    timestamp: '2026-02-04T10:32:15.123Z',
    status: 'success',
    data: {
        mappingResults: {...},
        statistics: {
            totalColumns: 10,
            highConfidence: 8,
            mediumConfidence: 2,
            lowConfidence: 0
        }
    }
}
```

### 엣지 (Edge) 구조
```javascript
{
    from: 'column-mapping',
    to: 'data-extraction',
    relationship: 'extracted',
    timestamp: '2026-02-04T10:32:16.456Z'
}
```

---

## 📋 추적되는 정보

### 1. 파일 메타데이터
```javascript
{
    source: {
        filename: 'sample_trades.xlsx',
        fileSize: 45678,
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        lastModified: '2026-02-04T09:00:00.000Z',
        uploadedAt: '2026-02-04T10:30:00.000Z',
        checksum: 'a1b2c3d4e5f6...'  // SHA-256
    }
}
```

### 2. ERP 시스템 탐지
```javascript
{
    erp: {
        name: '더존',
        confidence: 0.95,
        matchedColumns: ['거래처코드명', '외화종류', '발생금액(외화)']
    }
}
```

### 3. 컬럼 매핑 이력
```javascript
{
    statistics: {
        totalColumns: 10,
        highConfidence: 8,    // > 90%
        mediumConfidence: 2,  // 50-90%
        lowConfidence: 0,     // < 50%
        methods: {
            exact: 5,
            fuzzy: 3,
            semantic: 2,
            fallback: 0
        }
    }
}
```

### 4. 데이터 추출 통계
```javascript
{
    statistics: {
        originalRows: 1234,
        extractedRows: 1234,
        originalColumns: 15,
        extractedColumns: 4,
        dataReduction: '73.3%'  // 데이터 크기 감소율
    }
}
```

### 5. 사용자 승인 이력
```javascript
{
    userId: 'user_123',
    approved: true,
    comment: '사용자가 데이터 추출을 승인함',
    reviewedAt: '2026-02-04T10:32:00.000Z'
}
```

### 6. 서버 전송 결과
```javascript
{
    endpoint: '/api/calculate',
    success: true,
    response: { status: 'success' },
    transmittedAt: '2026-02-04T10:33:00.000Z'
}
```

---

## 📈 데이터 품질 지표

### 4가지 품질 차원

#### 1. **완전성 (Completeness)** - 30% 가중치
필수 데이터 필드가 모두 존재하는가?
```javascript
완전성 = 실제 필드 / 예상 필드
```

#### 2. **정확성 (Accuracy)** - 40% 가중치
AI 컬럼 매칭 신뢰도가 높은가?
```javascript
정확성 = (고신뢰도 × 1.0 + 중신뢰도 × 0.7) / 전체 컬럼
```

#### 3. **일관성 (Consistency)** - 20% 가중치
모든 필수 처리 단계를 거쳤는가?
```javascript
일관성 = 완료된 단계 / 필수 단계
```

#### 4. **적시성 (Timeliness)** - 10% 가중치
데이터 처리 시간이 적절한가?
```javascript
적시성 = {
    5분 이내: 1.0,
    30분 이상: 0.0,
    그 사이: 선형 감소
}
```

### 전체 품질 점수
```javascript
전체 품질 = 
    완전성 × 0.3 +
    정확성 × 0.4 +
    일관성 × 0.2 +
    적시성 × 0.1
```

### 품질 등급
- **90% 이상**: 🟢 우수
- **70-89%**: 🟡 양호
- **50-69%**: 🟠 보통
- **50% 미만**: 🔴 개선 필요

---

## 🔧 사용법

### 자동 추적 (기본 동작)
```javascript
// Excel 파일 업로드 시 자동으로 프로비넌스 그래프 생성
const parseResult = await excelParser.parseExcelWithMapping(file);

// parseResult.provenance에 그래프가 포함됨
console.log(parseResult.provenance.toJSON());
```

### 수동 조회
```javascript
// 프로비넌스 그래프 JSON 가져오기
const provenanceData = tempUploadData.provenance.toJSON();

// 특정 노드 조회
const mappingNode = tempUploadData.provenance.getNode('column-mapping');

// 데이터 품질 확인
const quality = tempUploadData.provenance.quality;
console.log(`데이터 품질: ${(quality.overall * 100).toFixed(1)}%`);
```

### UI에서 확인
1. Excel 파일 업로드
2. 추출 승인 모달에서 **"📊 데이터 이력 보기"** 클릭
3. 프로비넌스 그래프 모달 표시:
   - 요약 정보
   - 데이터 품질 지표
   - 처리 단계 타임라인
   - 메타데이터

### JSON 다운로드
```javascript
// UI에서 "💾 프로비넌스 JSON 다운로드" 버튼 클릭
// 또는 프로그래밍 방식으로:
function downloadProvenance() {
    const provenance = tempUploadData.provenance.toJSON();
    const blob = new Blob([JSON.stringify(provenance, null, 2)], 
                          { type: 'application/json' });
    // ... 다운로드 로직
}
```

---

## 📊 실제 프로비넌스 예시

### 더존 ERP Excel 파일 처리
```json
{
  "metadata": {
    "source": {
      "filename": "더존_외화거래_2026-02.xlsx",
      "fileSize": 87654,
      "uploadedAt": "2026-02-04T10:30:15.123Z",
      "checksum": "a1b2c3..."
    },
    "erp": {
      "name": "더존",
      "confidence": 0.95,
      "matchedColumns": ["거래처코드명", "외화종류", "발생금액(외화)"]
    },
    "session": {
      "sessionId": "session_1738660215123_abc123",
      "customerId": "customer_1770173165154_8po8qgc"
    }
  },
  "graph": {
    "nodes": [
      {
        "id": "source",
        "type": "file-upload",
        "timestamp": "2026-02-04T10:30:15.123Z",
        "status": "success"
      },
      {
        "id": "erp-detection",
        "type": "analysis",
        "timestamp": "2026-02-04T10:30:16.234Z",
        "status": "success",
        "data": {
          "erpSystem": "더존",
          "confidence": 0.95
        }
      },
      {
        "id": "column-mapping",
        "type": "transformation",
        "timestamp": "2026-02-04T10:30:17.345Z",
        "status": "success",
        "data": {
          "statistics": {
            "totalColumns": 10,
            "highConfidence": 8,
            "methods": { "exact": 5, "fuzzy": 3 }
          }
        }
      },
      {
        "id": "data-extraction",
        "type": "transformation",
        "timestamp": "2026-02-04T10:31:00.456Z",
        "status": "success",
        "data": {
          "statistics": {
            "originalRows": 1234,
            "extractedColumns": 4,
            "dataReduction": "73.3%"
          }
        }
      },
      {
        "id": "user-approval",
        "type": "approval",
        "timestamp": "2026-02-04T10:32:00.567Z",
        "status": "approved",
        "data": {
          "userId": "user_123",
          "approved": true
        }
      },
      {
        "id": "server-transmission",
        "type": "transmission",
        "timestamp": "2026-02-04T10:33:00.678Z",
        "status": "success",
        "data": {
          "endpoint": "/api/calculate",
          "success": true
        }
      }
    ],
    "edges": [
      { "from": "source", "to": "erp-detection", "relationship": "analyzed" },
      { "from": "erp-detection", "to": "column-mapping", "relationship": "mapped" },
      { "from": "column-mapping", "to": "data-extraction", "relationship": "extracted" },
      { "from": "data-extraction", "to": "user-approval", "relationship": "reviewed" },
      { "from": "user-approval", "to": "server-transmission", "relationship": "transmitted" }
    ]
  },
  "quality": {
    "overall": 0.925,
    "dimensions": {
      "completeness": 1.0,
      "accuracy": 0.95,
      "consistency": 1.0,
      "timeliness": 0.8
    },
    "issues": [],
    "recommendations": []
  },
  "summary": {
    "filename": "더존_외화거래_2026-02.xlsx",
    "erpSystem": "더존",
    "status": "success",
    "totalSteps": 6,
    "completedSteps": 6,
    "processingTime": "165.56",
    "dataQuality": 0.925
  }
}
```

---

## 🛡️ 보안 및 프라이버시

### 포함되는 정보
- ✅ 파일명, 크기, 업로드 시각
- ✅ ERP 시스템 유형
- ✅ 컬럼 매핑 통계
- ✅ 데이터 처리 단계
- ✅ 데이터 품질 지표

### 포함되지 않는 정보
- ❌ 실제 거래처명
- ❌ 실제 금액
- ❌ 개인정보 (이메일, 전화번호 등)
- ❌ 계좌번호, 은행명

프로비넌스 그래프는 **메타데이터만** 저장하며, 민감한 실제 데이터는 포함하지 않습니다.

---

## 📁 저장 위치

### 로컬 저장 (권장)
```
HEDGEFREEDOM/
├── 업로드/
│   └── 더존_외화거래_2026-02.xlsx
├── 결과/
│   └── calculated_kpi_2026-02-04_10-33-00.json
└── 프로비넌스/  (새로 생성)
    └── provenance_더존_외화거래_2026-02_2026-02-04T10-33-00.json
```

### 서버 저장 (선택)
```python
# 서버 측에서 프로비넌스 저장
@app.route('/api/save_provenance', methods=['POST'])
def save_provenance():
    provenance = request.json
    
    # 고객별 프로비넌스 저장
    save_path = f"server_data/{customer_id}/provenance/{timestamp}.json"
    with open(save_path, 'w') as f:
        json.dump(provenance, f, indent=2)
    
    return {"success": True}
```

---

## 🔮 향후 확장

### 1. 블록체인 통합
```javascript
// 프로비넌스 그래프를 블록체인에 기록 (변조 방지)
const hash = await blockchain.recordProvenance(provenance);
provenance.metadata.blockchainHash = hash;
```

### 2. 감사 로그 연동
```javascript
// 감사 시스템과 연동
auditLog.record({
    type: 'data_processing',
    provenance: provenance.toJSON(),
    user: currentUser
});
```

### 3. 자동 규제 보고
```javascript
// 금융위원회 규제 보고서 자동 생성
const report = generateComplianceReport(provenance);
report.submit('financial-supervisory-service');
```

### 4. AI 기반 이상 탐지
```javascript
// 프로비넌스 패턴 분석으로 이상 거래 탐지
const anomalies = aiDetector.analyzeProvenance(provenance);
if (anomalies.length > 0) {
    alert('⚠️ 비정상적인 데이터 처리 패턴 발견');
}
```

---

## 🎯 체크리스트

업로드 전:
- [ ] 파일 형식 확인 (.xlsx)
- [ ] ERP 시스템 확인

업로드 후:
- [ ] 프로비넌스 그래프 생성 확인
- [ ] ERP 자동 탐지 결과 확인
- [ ] 컬럼 매핑 신뢰도 확인 (> 70%)
- [ ] 데이터 품질 점수 확인 (> 80%)

승인 전:
- [ ] "📊 데이터 이력 보기" 클릭
- [ ] 처리 단계 검토
- [ ] 품질 이슈 확인
- [ ] 필요 시 프로비넌스 JSON 다운로드

---

## 🆘 문제 해결

### 프로비넌스 그래프가 생성되지 않음
```javascript
// provenance-graph.js가 로드되었는지 확인
console.log(window.ProvenanceGraph);  // function 출력되어야 함

// parseExcelWithMapping 결과 확인
const result = await excelParser.parseExcelWithMapping(file);
console.log(result.provenance);  // ProvenanceGraph 객체 출력되어야 함
```

### 데이터 품질이 낮게 나옴
1. **정확성 낮음** → AI 컬럼 매칭 신뢰도 문제
   - 해결: 수동으로 컬럼 매핑 확인
2. **완전성 낮음** → 필수 필드 누락
   - 해결: Excel 파일에 필수 컬럼 추가
3. **적시성 낮음** → 처리 시간 지연
   - 해결: 브라우저 성능 확인, 파일 크기 축소

### JSON 다운로드 실패
```javascript
// 브라우저 콘솔에서 수동 다운로드
const provenance = tempUploadData.provenance.toJSON();
console.log(JSON.stringify(provenance, null, 2));
// 복사해서 수동으로 저장
```

---

## 📚 참고 자료

- **W3C PROV**: https://www.w3.org/TR/prov-overview/
- **ISO 22739 (Document Management)**: 문서 프로비넌스 표준
- **GDPR Article 30**: 데이터 처리 활동 기록 의무
- **금융위원회 전자금융감독규정**: 전자금융거래 기록 보관 의무

---

## 💡 Best Practices

1. **모든 업로드에 프로비넌스 기록**
   - 향후 감사 대응 필수

2. **품질 점수 80% 이상 유지**
   - 낮으면 원인 파악 후 재업로드

3. **프로비넌스 JSON 주기적 백업**
   - 로컬 폴더 + 클라우드 이중 백업

4. **이상 패턴 즉시 보고**
   - ERP 탐지 실패, 매핑 신뢰도 50% 미만 등

5. **프로비넌스 그래프 정기 검토**
   - 월 1회 전체 프로비넌스 분석
