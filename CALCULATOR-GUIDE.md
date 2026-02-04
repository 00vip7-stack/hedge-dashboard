# 🧮 서버 계산기 시스템 가이드

## 개요

HedgeFreedom의 계산 로직을 **서버 측에서만** 실행하여 소스 코드 유출을 방지하는 플러그인 기반 확장 가능한 계산기 시스템입니다.

### 핵심 설계 원칙

1. **IP 보호**: 모든 계산 로직은 서버에만 존재
2. **확장성**: 새 계산기 추가 시 기존 코드 수정 불필요
3. **독립성**: 각 계산기는 독립적인 모듈로 관리
4. **의존성 관리**: 계산 순서 자동 조정 (우선순위 기반)

---

## 📁 폴더 구조

```
/workspaces/hedge-dashboard/
├── calculators/                 # 계산기 모듈 (서버 전용)
│   ├── __init__.py             # 모듈 초기화
│   ├── base_calculator.py      # 추상 베이스 클래스
│   ├── registry.py             # 계산기 레지스트리 (싱글톤)
│   ├── total_exposure.py       # 총 노출액 계산기
│   ├── hedged_amount.py        # 헤지된 금액 계산기
│   ├── hedge_ratio.py          # 헤지 비율 계산기
│   ├── unhedged_gap.py         # 미헤지 금액 계산기
│   ├── avg_hedge_rate.py       # 평균 헤지 환율 계산기
│   └── recommendation.py       # 권장사항 계산기
├── mock_server_app.py          # 메인 서버 (계산기 통합됨)
└── test-calculator.html        # 계산기 테스트 페이지
```

---

## 🔧 핵심 구성 요소

### 1. BaseCalculator (추상 베이스 클래스)

모든 계산기가 상속받아야 하는 부모 클래스입니다.

```python
from calculators.base_calculator import BaseCalculator

class MyCustomCalculator(BaseCalculator):
    name = "myMetric"              # 필수: 계산기 고유 이름
    priority = 100                 # 실행 우선순위 (낮을수록 먼저)
    dependencies = []              # 의존하는 다른 계산기 이름 리스트
    
    def calculate(self, positions, context):
        """계산 로직 구현"""
        # positions: 헤지 포지션 리스트
        # context: 이전 계산 결과 딕셔너리
        return result
```

**주요 메서드:**
- `calculate(positions, context)`: **필수 구현** - 계산 로직
- `validate_input(positions)`: 입력 검증 (오버라이드 가능)
- `format_result(result)`: 결과 포맷팅 (오버라이드 가능)

### 2. CalculatorRegistry (레지스트리)

모든 계산기를 관리하는 싱글톤 클래스입니다.

```python
from calculators.registry import CalculatorRegistry

# 레지스트리 초기화 (서버 시작 시 1회)
registry = CalculatorRegistry()

# 계산기 등록
registry.register(TotalExposureCalculator())
registry.register(HedgeRatioCalculator())

# 모든 계산 실행
results = registry.calculate_all(positions)

# 특정 계산만 실행
total = registry.calculate_one('totalExposure', positions)

# 등록된 계산기 목록
calculators = registry.list_calculators()
```

---

## 📊 기본 제공 계산기 (6개)

### 1. TotalExposureCalculator (총 노출액)
- **name**: `totalExposure`
- **priority**: 10 (최우선 실행)
- **계산식**: `SUM(모든 포지션의 amount)`
- **출력**: float (소수점 2자리)

### 2. HedgedAmountCalculator (헤지된 금액)
- **name**: `hedgedAmount`
- **priority**: 20
- **계산식**: `SUM(direction='hedge'인 포지션의 amount)`
- **출력**: float (소수점 2자리)

### 3. HedgeRatioCalculator (헤지 비율)
- **name**: `hedgeRatio`
- **priority**: 30
- **dependencies**: `['totalExposure', 'hedgedAmount']`
- **계산식**: `(hedgedAmount / totalExposure) * 100`
- **출력**: float (%, 소수점 1자리)

### 4. UnhedgedGapCalculator (미헤지 금액)
- **name**: `unhedgedGap`
- **priority**: 40
- **dependencies**: `['totalExposure', 'hedgedAmount']`
- **계산식**: `totalExposure - hedgedAmount`
- **출력**: float (소수점 2자리)

### 5. AvgHedgeRateCalculator (평균 헤지 환율)
- **name**: `avgHedgeRate`
- **priority**: 50
- **계산식**: `SUM(헤지포지션.amount * rate) / SUM(헤지포지션.amount)`
- **출력**: float (소수점 2자리)

### 6. RecommendationCalculator (권장사항)
- **name**: `recommendation`
- **priority**: 60
- **dependencies**: `['hedgeRatio']`
- **로직**:
  - `hedgeRatio < 70%` → "추가헤지필요"
  - `70% ≤ hedgeRatio ≤ 90%` → "적정"
  - `hedgeRatio > 90%` → "과도헤지"
- **출력**: string

---

## 🚀 API 사용법

### POST /api/hedge/calculate

서버에서 KPI를 계산합니다.

**요청:**
```json
{
  "positions": [
    {
      "currency": "USD",
      "amount": 100000,
      "direction": "hedge",
      "rate": 1350.50
    },
    {
      "currency": "USD",
      "amount": 80000,
      "direction": "exposure",
      "rate": 1352.00
    }
  ],
  "customerId": "C001",
  "saveResults": true
}
```

**응답:**
```json
{
  "success": true,
  "timestamp": "2026-02-04T10:30:00",
  "kpi": {
    "totalExposure": 180000.0,
    "hedgedAmount": 100000.0,
    "hedgeRatio": 55.6,
    "unhedgedGap": 80000.0,
    "avgHedgeRate": 1350.50,
    "recommendation": "추가헤지필요"
  },
  "calculatorInfo": {
    "version": "1.0",
    "calculators": ["totalExposure", "hedgedAmount", ...],
    "totalCalculators": 6
  }
}
```

**JavaScript 예제:**
```javascript
const response = await fetch('/api/hedge/calculate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        positions: myPositions,
        customerId: 'C001',
        saveResults: false
    })
});

const result = await response.json();
if (result.success) {
    console.log('총 노출액:', result.kpi.totalExposure);
    console.log('헤지 비율:', result.kpi.hedgeRatio + '%');
    console.log('권장:', result.kpi.recommendation);
}
```

**cURL 예제:**
```bash
curl -X POST http://localhost:9000/api/hedge/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "positions": [
      {"currency": "USD", "amount": 100000, "direction": "hedge", "rate": 1350}
    ],
    "customerId": "TEST"
  }'
```

---

## ➕ 새 계산기 추가 방법

### 1단계: 계산기 파일 생성

`calculators/` 폴더에 새 파일을 만듭니다.

**예: `calculators/risk_score.py`**
```python
"""
위험 점수 계산기
"""
from typing import Dict, List, Any
from .base_calculator import BaseCalculator

class RiskScoreCalculator(BaseCalculator):
    """
    위험 점수 계산
    미헤지 금액과 만기일 기반으로 0-100 점수 산출
    """
    
    name = "riskScore"
    priority = 70  # recommendation 이후 실행
    dependencies = ["unhedgedGap", "hedgeRatio"]
    
    def calculate(self, positions: List[Dict[str, Any]], context: Dict[str, Any]) -> float:
        """
        위험 점수 = (미헤지비율 * 0.7) + (만기임박도 * 0.3) * 100
        """
        unhedged_gap = context.get('unhedgedGap', 0)
        total_exposure = context.get('totalExposure', 1)
        
        # 미헤지 비율
        unhedged_ratio = unhedged_gap / total_exposure if total_exposure > 0 else 0
        
        # 만기 임박도 (7일 이내 포지션 비율)
        urgent_count = sum(1 for p in positions if p.get('daysUntil', 999) <= 7)
        urgency_ratio = urgent_count / len(positions) if positions else 0
        
        # 위험 점수 (0-100)
        risk_score = (unhedged_ratio * 0.7 + urgency_ratio * 0.3) * 100
        
        return risk_score
    
    def format_result(self, result: float) -> float:
        """소수점 1자리로 포맷"""
        return round(result, 1)
```

### 2단계: 서버에 등록

`mock_server_app.py`에서 import 및 등록:

```python
# 계산기 모듈 import
from calculators.registry import CalculatorRegistry
from calculators.total_exposure import TotalExposureCalculator
# ... 기존 계산기들 ...
from calculators.risk_score import RiskScoreCalculator  # 추가

# 계산기 레지스트리 초기화
calculator_registry = CalculatorRegistry()
calculator_registry.register(TotalExposureCalculator())
# ... 기존 등록들 ...
calculator_registry.register(RiskScoreCalculator())  # 추가
```

### 3단계: 서버 재시작

```bash
pkill -f gunicorn
python -m gunicorn -w 2 -b 0.0.0.0:9000 wsgi:application
```

**끝!** 새 계산기가 자동으로 API에 포함됩니다.

---

## 🧪 테스트

### 웹 브라우저 테스트

1. 서버 시작:
   ```bash
   python -m gunicorn -w 2 -b 0.0.0.0:9000 wsgi:application
   ```

2. 브라우저에서 접속:
   ```
   http://localhost:9000/test-calculator.html
   ```

3. "계산 테스트 실행" 버튼 클릭

### cURL 테스트

```bash
curl -X POST http://localhost:9000/api/hedge/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "positions": [
      {"currency": "USD", "amount": 100000, "direction": "hedge", "rate": 1350.50},
      {"currency": "USD", "amount": 50000, "direction": "hedge", "rate": 1348.20},
      {"currency": "USD", "amount": 80000, "direction": "exposure", "rate": 1352.00}
    ],
    "customerId": "TEST001"
  }' | python -m json.tool
```

---

## 🔒 보안 및 IP 보호

### ✅ 서버 측 계산의 장점

1. **소스 코드 보호**: 계산 로직이 클라이언트에 노출되지 않음
2. **데이터 무결성**: 클라이언트가 계산 결과를 조작할 수 없음
3. **중앙 관리**: 모든 계산 로직이 서버에서 통합 관리됨
4. **업데이트 용이**: 서버만 업데이트하면 모든 클라이언트에 적용

### ❌ 클라이언트 측 계산의 문제

- JavaScript 코드는 브라우저에서 누구나 볼 수 있음
- DevTools로 쉽게 소스 코드 확인 가능
- 계산 로직 복제 및 유출 위험
- 경쟁사가 알고리즘 분석 가능

---

## 📈 확장 시나리오

### 시나리오 1: VaR (Value at Risk) 추가

```python
class VaRCalculator(BaseCalculator):
    name = "valueAtRisk"
    priority = 80
    dependencies = ["totalExposure", "avgHedgeRate"]
    
    def calculate(self, positions, context):
        # VaR 계산 로직 (몬테카를로 시뮬레이션 등)
        return var_95
```

### 시나리오 2: 최적 헤지 금액 추천

```python
class OptimalHedgeCalculator(BaseCalculator):
    name = "optimalHedgeAmount"
    priority = 90
    dependencies = ["totalExposure", "hedgeRatio"]
    
    def calculate(self, positions, context):
        total = context['totalExposure']
        current_ratio = context['hedgeRatio']
        target_ratio = 75.0  # 목표 비율
        
        optimal = (target_ratio / 100 - current_ratio / 100) * total
        return max(0, optimal)
```

### 시나리오 3: 조건부 계산

```python
class ConditionalCalculator(BaseCalculator):
    name = "specialMetric"
    priority = 100
    
    def validate_input(self, positions):
        # 특정 조건에서만 실행
        return any(p.get('currency') == 'EUR' for p in positions)
    
    def calculate(self, positions, context):
        # EUR 포지션에 대한 특수 계산
        return special_result
```

---

## 🛠️ 고급 사용법

### 계산기 동적 활성화/비활성화

```python
# 계산기 제거
calculator_registry.unregister('recommendation')

# 다시 추가
calculator_registry.register(RecommendationCalculator())
```

### 특정 계산만 실행

```python
# 헤지 비율만 계산
hedge_ratio = calculator_registry.calculate_one(
    'hedgeRatio',
    positions,
    context={'totalExposure': 1000000, 'hedgedAmount': 700000}
)
```

### 커스텀 컨텍스트 전달

```python
results = calculator_registry.calculate_all(
    positions,
    context={
        'customerId': 'C001',
        'targetRatio': 80,  # 커스텀 목표 비율
        'currency': 'USD',
        'marketData': {...}
    }
)
```

---

## 📝 모범 사례

1. **계산기 이름은 camelCase 사용** (`totalExposure`, `hedgeRatio`)
2. **우선순위는 10 단위로 설정** (향후 중간 삽입 용이)
3. **의존성 명시적 선언** (순환 의존성 방지)
4. **에러 처리 철저히** (계산 실패 시 null 반환)
5. **단위 테스트 작성** (각 계산기별)
6. **문서화 철저히** (docstring 포함)

---

## 🐛 트러블슈팅

### 문제: 계산기가 등록되지 않음

**원인**: import 오류 또는 name 속성 누락

**해결**:
```python
# mock_server_app.py 확인
from calculators.my_calculator import MyCalculator
calculator_registry.register(MyCalculator())

# 계산기 클래스에 name 속성 있는지 확인
class MyCalculator(BaseCalculator):
    name = "myMetric"  # 필수!
```

### 문제: 계산 순서가 잘못됨

**원인**: priority 설정 오류

**해결**:
```python
# 의존하는 계산기보다 낮은 우선순위 설정
class DependentCalculator(BaseCalculator):
    priority = 100  # totalExposure(10) 이후 실행
    dependencies = ["totalExposure"]
```

### 문제: None 결과가 반환됨

**원인**: validate_input 실패 또는 계산 오류

**해결**:
1. 서버 로그 확인
2. validate_input 조건 완화
3. try-except로 에러 처리

---

## 📦 배포 체크리스트

- [ ] 모든 계산기 테스트 완료
- [ ] 서버 로그 확인 (레지스트리 초기화 메시지)
- [ ] API 응답 시간 측정 (1초 이내 권장)
- [ ] 에러 처리 추가 (빈 포지션, null 값 등)
- [ ] 보안 검증 (클라이언트에 계산 로직 노출 없음)
- [ ] 문서 업데이트

---

## 📞 지원

문제 발생 시:
1. 서버 로그 확인 (`gunicorn` 출력)
2. `/api/hedge/calculate` 응답 확인
3. 계산기 등록 여부 확인 (`calculatorInfo.calculators`)

**시스템 정보:**
- Python 3.x
- Gunicorn WSGI 서버
- 플러그인 기반 아키텍처
- 싱글톤 레지스트리 패턴
