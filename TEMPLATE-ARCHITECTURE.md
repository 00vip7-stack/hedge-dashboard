# 템플릿 기반 아키텍처 가이드

## 🎯 새로운 아키텍처 개요

**HEDGEFREEDOM** (www.hedgefreedom.com)은 이제 **템플릿 기반 시스템**으로 전환되었습니다.
각 고객의 데이터를 *hedgeOn 엔진*에서 처리하고, 결과를 개인화된 대시보드에 표시합니다.

---

## 📐 시스템 구조

```
[고객] → [Excel 업로드] → [서버 처리] → [JSON 응답] → [템플릿 렌더링] → [개인화된 대시보드]
```

### 1. 클라이언트 (프론트엔드)
- **역할**: 템플릿만 제공, 데이터 없음
- **기술**: HTML + Tailwind CSS + Vanilla JavaScript
- **특징**: 
  - 데이터는 서버에서만 가져옴
  - 고객별로 다른 데이터 표시
  - 실시간 업데이트

### 2. 서버 (백엔드)
- **역할**: 데이터 처리 및 계산
- **기술**: Python (현재 mock-server.py)
- **기능**:
  - Excel 파일 업로드 처리
  - 데이터 익명화
  - 헤지 전략 계산
  - API 엔드포인트 제공

### 3. 데이터 흐름
```
고객 A 업로드 → 서버 → 고객 A 대시보드
고객 B 업로드 → 서버 → 고객 B 대시보드
```

---

## 🏗️ 템플릿 구조 (표준)

### 파일 구성

```html
<!-- 이탈알림.html (표준 템플릿) -->

1. HTML 구조 (템플릿)
   - 헤더
   - 요약 카드 (빈 컨테이너)
   - 데이터 목록 (빈 컨테이너)
   - 모달/설정

2. JavaScript (데이터 로직)
   - API 호출
   - 데이터 렌더링
   - 이벤트 처리
   - 자동 새로고침

3. 스타일 (Tailwind CSS)
   - 반응형 디자인
   - 일관된 색상/폰트
```

### 핵심 원칙

#### ✅ DO (해야 할 것)
1. **템플릿만 제공**
   - HTML은 빈 껍데기만
   - 데이터는 JavaScript로 채움

2. **API 중심 설계**
   - 모든 데이터는 API에서
   - `/api/xxx` 형식

3. **고객별 개인화**
   - 서버에서 고객 구분
   - 맞춤형 데이터 반환

#### ❌ DON'T (하지 말 것)
1. **하드코딩 금지**
   - HTML에 데이터 직접 넣기 X
   - 모든 데이터는 동적

2. **클라이언트 계산 금지**
   - 복잡한 계산은 서버에서
   - 클라이언트는 표시만

---

## 📡 API 설계 표준

### 엔드포인트 구조

```
GET  /api/alerts              - 알림 목록 조회
GET  /api/alerts/settings     - 알림 설정 조회
POST /api/alerts/settings     - 알림 설정 저장
POST /api/alerts/{id}/dismiss - 알림 확인

GET  /api/hedge/positions     - 헤지 포지션 조회
POST /api/hedge/calculate     - 헤지 전략 계산
POST /api/upload/excel        - Excel 파일 업로드
```

### 응답 형식 (JSON)

```json
{
  "success": true,
  "data": {
    "alerts": [...],
    "summary": {...}
  },
  "timestamp": "2026-02-03T22:00:00",
  "message": "성공"
}
```

### 에러 처리

```json
{
  "success": false,
  "error": "오류 메시지",
  "code": "ERROR_CODE",
  "timestamp": "2026-02-03T22:00:00"
}
```

---

## 🔄 데이터 플로우 예시

### 이탈알림 페이지

```javascript
// 1. 페이지 로드
document.addEventListener('DOMContentLoaded', () => {
    loadAlerts();  // 서버에서 데이터 가져오기
});

// 2. API 호출
async function loadAlerts() {
    const response = await fetch('/api/alerts');
    const data = await response.json();
    renderAlerts(data.alerts);  // 템플릿에 렌더링
}

// 3. 템플릿 렌더링
function renderAlerts(alerts) {
    const html = alerts.map(alert => createAlertCard(alert)).join('');
    document.getElementById('alertsList').innerHTML = html;
}
```

---

## 📋 구현된 페이지

### ✅ 이탈알림.html (완료)

**기능:**
- 실시간 알림 목록
- 중요도별 필터링
- 알림 설정 관리
- 자동 새로고침 (30초)

**API:**
- `GET /api/alerts` - 알림 조회
- `GET /api/alerts/settings` - 설정 조회
- `POST /api/alerts/settings` - 설정 저장
- `POST /api/alerts/{id}/dismiss` - 알림 확인

**템플릿 구조:**
1. 요약 카드 (긴급/경고/정보)
2. 필터 및 검색
3. 알림 목록 (동적 렌더링)
4. 설정 모달

---

## 🚀 다음 단계: 다른 페이지 템플릿화

### 우선순위

1. **01 헤지매니저.html** (다음)
   - API: `/api/hedge/positions`
   - 기능: 포지션 관리, 헤지 비율

2. **02 노출분석.html**
   - API: `/api/exposure/analysis`
   - 기능: 통화별 노출, 리스크

3. **03 위험보고서.html**
   - API: `/api/risk/report`
   - 기능: VaR, 스트레스 테스트

### 각 페이지 변환 체크리스트

- [ ] HTML에서 하드코딩된 데이터 제거
- [ ] API 엔드포인트 설계
- [ ] 서버 핸들러 구현
- [ ] JavaScript 렌더링 로직 작성
- [ ] 에러 처리 추가
- [ ] 로딩 상태 UI
- [ ] 자동 새로고침

---

## 💾 데이터베이스 고려사항

### 현재 (Mock)
```python
# 서버에서 임시 데이터 생성
alerts = generate_mock_alerts()
```

### 향후 (실제)
```python
# 데이터베이스에서 조회
alerts = db.query("SELECT * FROM alerts WHERE customer_id = ?", [customer_id])
```

### 필요한 테이블

```sql
-- 고객 정보
CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    created_at TIMESTAMP
);

-- 알림 데이터
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    severity TEXT,
    title TEXT,
    message TEXT,
    created_at TIMESTAMP,
    is_read BOOLEAN
);

-- 헤지 포지션
CREATE TABLE hedge_positions (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    currency TEXT,
    amount REAL,
    rate REAL,
    maturity_date DATE
);
```

---

## 🔐 보안 고려사항

### 1. 인증/인가
```javascript
// API 호출 시 토큰 포함
fetch('/api/alerts', {
    headers: {
        'Authorization': 'Bearer ' + getToken()
    }
});
```

### 2. 데이터 익명화
```python
# 서버에서 민감 정보 제거
def anonymize_data(data):
    data['company_name'] = 'Company ***'
    data['account_number'] = '****' + data['account_number'][-4:]
    return data
```

### 3. CORS 설정
```python
# 특정 도메인만 허용
self.send_header('Access-Control-Allow-Origin', 'https://hedgefreedom.com')
```

---

## 📊 성능 최적화

### 1. 캐싱
```javascript
// 로컬 스토리지 활용
const cachedData = localStorage.getItem('alerts');
if (cachedData && isFresh(cachedData)) {
    renderAlerts(JSON.parse(cachedData));
} else {
    loadAlerts();
}
```

### 2. 페이지네이션
```javascript
// API: /api/alerts?page=1&limit=20
const alerts = await fetch('/api/alerts?page=1&limit=20');
```

### 3. 지연 로딩
```javascript
// 스크롤 시 추가 로드
window.addEventListener('scroll', () => {
    if (isBottom()) loadMore();
});
```

---

## 🧪 테스트

### API 테스트
```bash
# 알림 조회
curl http://localhost:9000/api/alerts

# 설정 저장
curl -X POST http://localhost:9000/api/alerts/settings \
  -H "Content-Type: application/json" \
  -d '{"usdUpperLimit": 1400}'
```

### 브라우저 테스트
```
1. 이탈알림.html 열기
2. 개발자 도구 → Network 탭
3. API 호출 확인
4. 데이터 렌더링 확인
```

---

## 📝 개발 가이드

### 새 페이지 만들기

1. **HTML 템플릿 작성**
```html
<!-- skeleton만 -->
<div id="dataContainer">
    <!-- JavaScript가 채울 영역 -->
</div>
```

2. **API 엔드포인트 추가**
```python
# mock-server.py
def handle_my_api(self):
    data = generate_data()
    self.send_json_response(data)
```

3. **JavaScript 렌더링**
```javascript
async function loadData() {
    const response = await fetch('/api/mydata');
    const data = await response.json();
    render(data);
}
```

---

## 🎓 학습 자료

### 참고 파일
- `이탈알림.html` - 표준 템플릿 예시
- `mock-server.py` - API 서버 구현
- `TEMPLATE-ARCHITECTURE.md` - 이 문서

### 다음 읽을 것
- API 설계 가이드
- JavaScript 렌더링 패턴
- 보안 best practices

---

## 💡 핵심 요약

1. **템플릿만 HTML에**
   - 데이터는 JavaScript로

2. **모든 것을 API로**
   - 서버 중심 설계

3. **고객별 개인화**
   - 서버에서 구분

4. **일관된 패턴**
   - 모든 페이지 동일 구조

**이탈알림.html이 표준 템플릿입니다. 다른 페이지도 이 패턴을 따르세요!**

---

*powered by hedgeOn Engine | www.hedgefreedom.com*
