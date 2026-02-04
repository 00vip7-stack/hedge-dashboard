# 📂 폴더 상태 모니터링 시스템 (차단부 105)

## 🎯 개요

HedgeFreedom의 **폴더 생성/이동/복사 차단부(105)**는 로컬 폴더 상태를 실시간으로 모니터링하고, 시스템이 규칙에 따라 자동 생성한 폴더만 사용하도록 강제하는 시스템입니다.

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    클라이언트 (브라우저)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📁 LocalStorageHandler                                       │
│  ├─ 🔍 폴더 구조 검증 (_validateFolderStructure)            │
│  │   ├─ 허용된 폴더만 존재하는지 확인                       │
│  │   ├─ 임의 폴더 감지 (unauthorizedFolders)                │
│  │   └─ 필수 폴더 누락 감지 (missingFolders)                │
│  │                                                             │
│  ├─ 📊 폴더 상태 체크 (checkLocalFolderStatus)               │
│  │   ├─ exists: 폴더 핸들 존재                               │
│  │   ├─ accessible: 폴더 접근 가능                           │
│  │   ├─ hasPermission: 읽기/쓰기 권한                        │
│  │   ├─ structureValid: 폴더 구조 무결성                     │
│  │   └─ healthy: 전체 상태 (모든 조건 충족)                  │
│  │                                                             │
│  ├─ 📡 서버 전송 (reportFolderStatusToServer)                │
│  │   └─ POST /api/folder/status                              │
│  │                                                             │
│  └─ ⏱️ 주기적 모니터링 (startFolderMonitoring)               │
│      └─ 기본: 5분 간격                                        │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP POST
                        │ JSON 상태 데이터
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    서버 (Python WSGI)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🔍 FolderStatusMonitor                                       │
│  ├─ 📥 상태 수신 (record_status)                             │
│  │   ├─ 고객별 폴더에 JSON 파일 저장                         │
│  │   ├─ server_data/folder_status/{customerId}/             │
│  │   └─ 메모리 히스토리 유지 (최근 10개)                     │
│  │                                                             │
│  ├─ 🧮 상태 분석 (_analyze_status)                           │
│  │   ├─ 건강 점수 계산 (0~100)                               │
│  │   │   ├─ exists: 25점                                     │
│  │   │   ├─ accessible: 25점                                 │
│  │   │   ├─ hasPermission: 25점                              │
│  │   │   └─ structureValid: 25점                             │
│  │   │                                                         │
│  │   └─ 심각도 판정                                           │
│  │       ├─ normal: 90~100점                                 │
│  │       ├─ warning: 70~89점                                 │
│  │       ├─ error: 50~69점                                   │
│  │       └─ critical: 0~49점                                 │
│  │                                                             │
│  └─ 🚨 이상 감지 (_detect_anomalies)                         │
│      ├─ CONSECUTIVE_FAILURES: 연속 3회 실패                  │
│      ├─ STRUCTURE_VIOLATION: 폴더 구조 위반                  │
│      ├─ FOLDER_DELETED: 폴더 삭제 감지                       │
│      └─ PERMISSION_LOST: 권한 상실                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📋 허용된 폴더 구조

시스템이 **규칙에 따라 자동 생성**한 폴더만 허용:

```
HEDGEFREEDOM/  (또는 헤지프리덤/)
├── data/       ✅ 시스템 생성 - 거래 데이터 및 설정
├── uploads/    ✅ 시스템 생성 - 업로드된 파일
├── history/    ✅ 시스템 생성 - 히스토리 스냅샷
├── cache/      ✅ 시스템 생성 - 캐시 데이터
├── logs/       ✅ 시스템 생성 - 시스템 로그
├── my_folder/  ❌ 사용자 임의 생성 - 차단됨!
└── temp/       ❌ 사용자 임의 생성 - 차단됨!
```

## 🔧 API 엔드포인트

### 1. 폴더 상태 보고 (클라이언트 → 서버)

**요청:**
```http
POST /api/folder/status
Content-Type: application/json

{
  "customerId": "customer_xxx",
  "status": {
    "timestamp": "2026-02-04T11:53:22.826287",
    "pcFingerprint": "abc123",
    "folderName": "HEDGEFREEDOM",
    "exists": true,
    "accessible": true,
    "structureValid": true,
    "hasPermission": true,
    "healthy": true,
    "details": {
      "structure": {
        "valid": true,
        "unauthorizedFolders": [],
        "missingFolders": []
      }
    }
  },
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2026-02-04T11:53:22.826287"
}
```

**응답 (정상):**
```json
{
  "success": true,
  "message": "폴더 상태가 기록되었습니다.",
  "result": {
    "success": true,
    "recorded_at": "2026-02-04T11:53:22.826287",
    "alerts": [],
    "analysis": {
      "health_score": 100,
      "issues": [],
      "severity": "normal"
    }
  }
}
```

**응답 (문제 감지):**
```json
{
  "success": true,
  "message": "폴더 상태가 기록되었습니다.",
  "result": {
    "success": true,
    "recorded_at": "2026-02-04T11:53:51.465255",
    "alerts": [
      {
        "type": "STRUCTURE_VIOLATION",
        "severity": "error",
        "message": "폴더 구조 무결성 위반 감지",
        "details": {
          "unauthorizedFolders": ["my_custom_folder", "temp"],
          "missingFolders": ["logs"]
        },
        "action": "임의 폴더 제거 또는 폴더 복구 필요"
      }
    ],
    "analysis": {
      "health_score": 75,
      "issues": [
        "폴더 구조 무결성 실패",
        "임의 폴더 감지: my_custom_folder, temp",
        "필수 폴더 누락: logs"
      ],
      "severity": "warning"
    }
  }
}
```

### 2. 고객별 폴더 상태 조회

**요청:**
```http
GET /api/folder/status?customerId=customer_xxx
```

**응답:**
```json
{
  "success": true,
  "data": {
    "customer_id": "test-customer-001",
    "latest_check": "2026-02-04T11:53:22.826287",
    "health_score": 100,
    "severity": "normal",
    "issues": [],
    "total_checks": 5,
    "folder_name": "HEDGEFREEDOM",
    "pc_fingerprint": "abc123"
  }
}
```

### 3. 전체 폴더 상태 요약

**요청:**
```http
GET /api/folder/summary
```

**응답:**
```json
{
  "success": true,
  "data": {
    "total_customers": 2,
    "severity_distribution": {
      "normal": 1,
      "warning": 1,
      "error": 0,
      "critical": 0
    },
    "customers": [
      {
        "customer_id": "test-customer-001",
        "latest_check": "2026-02-04T11:53:22.826287",
        "health_score": 100,
        "severity": "normal",
        "issues": [],
        "total_checks": 5,
        "folder_name": "HEDGEFREEDOM",
        "pc_fingerprint": "abc123"
      },
      {
        "customer_id": "test-customer-002",
        "latest_check": "2026-02-04T11:53:51.465255",
        "health_score": 75,
        "severity": "warning",
        "issues": [
          "폴더 구조 무결성 실패",
          "임의 폴더 감지: my_custom_folder, temp"
        ],
        "total_checks": 1,
        "folder_name": "HEDGEFREEDOM",
        "pc_fingerprint": "xyz789"
      }
    ],
    "generated_at": "2026-02-04T11:53:40.716269"
  }
}
```

## 🚨 알림 유형

| 알림 타입 | 심각도 | 조건 | 조치 |
|-----------|--------|------|------|
| `CONSECUTIVE_FAILURES` | critical | 연속 3회 폴더 상태 실패 | 즉시 확인 필요 |
| `STRUCTURE_VIOLATION` | error | 폴더 구조 무결성 위반 | 임의 폴더 제거 또는 복구 |
| `FOLDER_DELETED` | critical | 로컬 폴더 삭제 감지 | 폴더 재생성 필요 |
| `PERMISSION_LOST` | warning | 폴더 접근 권한 상실 | 브라우저에서 폴더 재선택 |

## 💾 서버 저장 구조

```
server_data/
└── folder_status/
    ├── customer_xxx/
    │   ├── status_20260204_115322.json
    │   ├── status_20260204_115822.json
    │   └── status_20260204_120322.json
    └── customer_yyy/
        ├── status_20260204_115351.json
        └── status_20260204_115851.json
```

각 파일 구조:
```json
{
  "timestamp": "2026-02-04T11:53:22.826287",
  "customer_id": "customer_xxx",
  "status": {
    "exists": true,
    "accessible": true,
    "structureValid": true,
    "hasPermission": true,
    "healthy": true,
    "folderName": "HEDGEFREEDOM",
    "pcFingerprint": "abc123",
    "details": {...}
  },
  "analyzed": {
    "health_score": 100,
    "issues": [],
    "severity": "normal"
  }
}
```

## 📱 클라이언트 사용법

### 1. 수동 폴더 상태 체크

```javascript
// 폴더 상태 확인
const status = await localStorageHandler.checkLocalFolderStatus();
console.log('폴더 상태:', status);

// 서버로 전송
const customerId = 'customer_xxx';
const result = await localStorageHandler.reportFolderStatusToServer(customerId);
console.log('전송 결과:', result);
```

### 2. 자동 모니터링 시작

```javascript
// 5분 간격으로 자동 모니터링
const customerId = 'customer_xxx';
localStorageHandler.startFolderMonitoring(customerId, 5);

// 모니터링 중지
localStorageHandler.stopFolderMonitoring();
```

### 3. hedge-manager.html 자동 통합

페이지 로드 시 자동으로 모니터링 시작:

```javascript
window.addEventListener('DOMContentLoaded', () => {
    localStorageHandler.initialize().then(() => {
        const customerId = localStorage.getItem('customer_id') || 'anonymous';
        localStorageHandler.startFolderMonitoring(customerId, 5);
    });
});
```

## 🛡️ 보안 및 보호

### 자동 생성 파일

1. **⚠️중요데이터_삭제금지.txt**
   - 사용자에게 폴더 삭제 경고
   - 시스템 정보 포함
   - PC 고유 ID 기록

2. **.hedgefreedom-lock**
   - 시스템 잠금 표시
   - JSON 메타데이터
   - 숨김 파일 스타일

## 📊 건강 점수 계산

| 항목 | 점수 | 설명 |
|------|------|------|
| `exists` | 25점 | 폴더 핸들이 존재함 |
| `accessible` | 25점 | 폴더에 접근 가능함 |
| `hasPermission` | 25점 | 읽기/쓰기 권한 있음 |
| `structureValid` | 25점 | 폴더 구조 무결성 통과 |
| **합계** | **100점** | 최대 건강 점수 |

### 심각도 판정

- **normal** (90~100점): 정상 상태
- **warning** (70~89점): 경고 - 주의 필요
- **error** (50~69점): 오류 - 조치 필요
- **critical** (0~49점): 심각 - 즉시 조치 필요

## 🧪 테스트

### 정상 상태 테스트

```bash
curl -X POST http://localhost:9000/api/folder/status \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "test-001",
    "status": {
      "exists": true,
      "accessible": true,
      "structureValid": true,
      "hasPermission": true,
      "healthy": true
    }
  }'
```

### 폴더 구조 위반 테스트

```bash
curl -X POST http://localhost:9000/api/folder/status \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "test-002",
    "status": {
      "exists": true,
      "accessible": true,
      "structureValid": false,
      "hasPermission": true,
      "healthy": false,
      "details": {
        "structure": {
          "unauthorizedFolders": ["my_folder", "temp"],
          "missingFolders": ["logs"]
        }
      }
    }
  }'
```

## 📝 로그

### 클라이언트 로그 (브라우저 콘솔)

```
✅ 로컬 폴더 초기화 완료
🔄 폴더 상태 모니터링 시작 (5분 간격)
✅ 로컬 폴더 상태: 정상
📤 폴더 상태를 서버로 전송 중...
✅ 폴더 상태 전송 완료
```

### 서버 로그

```
📊 폴더 상태 수신: test-customer-001 | 건강도: 100/100 | 심각도: normal
📊 폴더 상태 수신: test-customer-002 | 건강도: 75/100 | 심각도: warning
🚨 알림 발생: 1개
   - STRUCTURE_VIOLATION: 폴더 구조 무결성 위반 감지
```

## 🎯 핵심 기능 요약

### 차단부 105 구현 사항

✅ **폴더 생성 차단**: 사용자가 임의로 폴더 생성 불가 (클라이언트 검증)  
✅ **폴더 이동 감지**: 폴더 경로 변경 시 감지 및 알림  
✅ **폴더 구조 강제**: 시스템 규칙 폴더만 허용  
✅ **경로 추적**: 모든 폴더 상태 히스토리 기록  
✅ **실시간 모니터링**: 주기적 상태 체크 (기본 5분)  
✅ **이상 감지**: 구조 위반, 삭제, 권한 상실 등 자동 감지  
✅ **서버 중앙화**: 모든 상태 정보 서버에 집중 관리  

## 🚀 다음 단계

1. **대시보드 UI 추가**: 관리자용 폴더 상태 모니터링 대시보드
2. **이메일 알림**: 심각한 이상 발생 시 이메일 자동 전송
3. **자동 복구**: 폴더 구조 위반 시 자동 복구 시도
4. **통계 분석**: 폴더 상태 트렌드 분석 및 리포트

---

**최종 업데이트**: 2026-02-04  
**버전**: 1.0.0  
**작성자**: HedgeFreedom Development Team
