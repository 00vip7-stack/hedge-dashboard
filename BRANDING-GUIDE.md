# 브랜딩 표준화 가이드

## 🎯 공식 브랜드 정보

### 제품명
- **영문**: HEDGEFREEDOM
- **한글**: 헤지프리덤
- **대소문자**: 항상 대문자 (HEDGEFREEDOM)

### 엔진명
- **영문**: hedgeOn Engine
- **한글**: 헤지온 엔진
- **설명**: Multi-threaded calculation engine for forex hedging

### 도메인
- **공식 도메인**: www.hedgefreedom.com
- **이메일**: @hedgefreedom.com

---

## 📂 폴더 구조 표준

### 로컬 폴더명 (⚠️ 필수 고정)
```
HEDGEFREEDOM/           ← ⚠️ 반드시 이 이름 사용 (변경 금지)
├── data/
├── uploads/
├── history/
└── cache/
```

**폴더명 고정 이유:**
1. 감사 대응: "HEDGEFREEDOM 폴더만 제출" - 한 문장으로 끝
2. 회계 처리: 항상 같은 위치, 히스토리 추적 용이
3. 브랜딩: 표준화된 구조 = 전문성
4. 데이터 무결성: 폴더명 변경 방지

### 표준 경로 (⚠️ 필수)
```bash
# Windows (필수)
C:\Users\사용자명\Documents\HEDGEFREEDOM

# Mac (필수)
~/Documents/HEDGEFREEDOM

# Linux (필수)
~/Documents/HEDGEFREEDOM

# 클라우드 동기화 (선택)
~/OneDrive/HEDGEFREEDOM
~/Dropbox/HEDGEFREEDOM
```

**⚠️ 중요: 다른 폴더명 사용 시 경고 표시**

---

## 💻 코드 표준

### HTML 타이틀
```html
<title>HEDGEFREEDOM - 헤지 매니저</title>
```

### 사이드바 로고
```html
<div class="p-6 text-white border-b border-gray-800">
    <div class="text-xl font-bold">HEDGEFREEDOM</div>
    <div class="text-[10px] text-gray-500 mt-1">powered by hedgeOn</div>
</div>
```

### 이메일 표시
```html
<div id="userEmail">demo@hedgefreedom.com</div>
<div class="text-[10px] text-gray-600">www.hedgefreedom.com</div>
```

### JavaScript 주석
```javascript
// HEDGEFREEDOM - powered by hedgeOn Engine
// www.hedgefreedom.com
```

### Python 서버 헤더
```python
print(f"""
╔══════════════════════════════════════════════════════════╗
║  ⚡ hedgeOn Engine (Multi-threaded API Server)          ║
║     HEDGEFREEDOM | www.hedgefreedom.com                 ║
╚══════════════════════════════════════════════════════════╝
""")
```

---

## 📊 API 응답 표준

### 성공 응답
```json
{
  "success": true,
  "data": {...},
  "timestamp": "2026-02-03T23:00:00",
  "engine": "hedgeOn",
  "version": "1.0.0"
}
```

### 에러 응답
```json
{
  "success": false,
  "error": "오류 메시지",
  "code": "ERROR_CODE",
  "timestamp": "2026-02-03T23:00:00",
  "engine": "hedgeOn"
}
```

---

## 🎨 UI 표준

### 색상 팔레트
```css
/* Primary Colors */
--hedgefreedom-blue: #0056b3;
--hedgefreedom-dark: #001529;

/* Status Colors */
--critical: #dc2626;  /* 긴급 */
--warning: #f59e0b;   /* 경고 */
--info: #3b82f6;      /* 정보 */
--success: #10b981;   /* 성공 */
```

### 폰트
```css
font-family: 'Roboto', sans-serif;
```

### 로고 스타일
```css
.logo {
    font-size: 20px;
    font-weight: 700;
    color: white;
    letter-spacing: 0.5px;
}

.logo-subtitle {
    font-size: 10px;
    color: #9ca3af;
    margin-top: 4px;
}
```

---

## 📄 문서 표준

### Markdown 헤더
```markdown
# 문서 제목

**HEDGEFREEDOM** (www.hedgefreedom.com)  
*powered by hedgeOn Engine*
```

### 푸터
```markdown
---

*HEDGEFREEDOM | www.hedgefreedom.com*  
*Engine: hedgeOn v1.0.0*
```

---

## 🔧 설정 파일 표준

### settings.json
```json
{
  "product": "HEDGEFREEDOM",
  "engine": "hedgeOn",
  "domain": "hedgefreedom.com",
  "version": "1.0.0",
  "targetHedgeRatio": 75,
  "companyName": "데모 회사"
}
```

### package.json (향후 Electron)
```json
{
  "name": "hedgefreedom",
  "productName": "HEDGEFREEDOM",
  "description": "Forex Hedging Platform powered by hedgeOn Engine",
  "homepage": "https://www.hedgefreedom.com",
  "author": {
    "name": "HEDGEFREEDOM Team",
    "email": "support@hedgefreedom.com"
  }
}
```

---

## 📧 커뮤니케이션 표준

### 이메일 서명
```
--
HEDGEFREEDOM Team
powered by hedgeOn Engine
www.hedgefreedom.com
support@hedgefreedom.com
```

### 사용자 환영 메시지
```
🎉 HEDGEFREEDOM에 오신 것을 환영합니다!

외환 헤지 전략을 자동화하는 가장 스마트한 방법
powered by hedgeOn Engine

시작하기: www.hedgefreedom.com/start
```

---

## 🌐 다국어 표준

### 한국어
- 제품명: **헤지프리덤**
- 엔진명: **헤지온 엔진**
- 슬로건: "스마트한 환헤지 솔루션"

### 영어
- Product: **HEDGEFREEDOM**
- Engine: **hedgeOn Engine**
- Tagline: "Smart Forex Hedging Solution"

---

## 🚀 배포 체크리스트

배포 전 확인사항:

- [ ] HTML 타이틀에 "HEDGEFREEDOM" 포함
- [ ] 사이드바에 "powered by hedgeOn" 표시
- [ ] 이메일 주소가 @hedgefreedom.com
- [ ] 도메인 링크가 www.hedgefreedom.com
- [ ] 폴더명이 HEDGEFREEDOM (대문자)
- [ ] 서버 시작 시 hedgeOn Engine 로고 표시
- [ ] 콘솔 로그에 브랜드 정보 포함
- [ ] API 응답에 engine 필드 포함

---

## 📋 파일별 적용 현황

### ✅ 완료된 파일
- [x] core/local-storage-handler.js
  - DB 이름: HEDGEFREEDOM_DB
  
- [x] 01 헤지매니저-new.html
  - 타이틀: HEDGEFREEDOM - 헤지 매니저
  - 로고: HEDGEFREEDOM / powered by hedgeOn
  - 이메일: demo@hedgefreedom.com
  - 도메인: www.hedgefreedom.com
  
- [x] 이탈알림.html
  - 타이틀: HEDGEFREEDOM - 이탈 알림
  - 콘솔 로그: hedgeOn Engine 정보
  
- [x] mock-server.py
  - 서버 헤더: hedgeOn Engine
  - 브랜드: HEDGEFREEDOM | www.hedgefreedom.com
  
- [x] LOCAL-FOLDER-GUIDE.md
  - 전체 브랜딩 업데이트
  - 폴더명: HEDGEFREEDOM
  - 엔진: hedgeOn
  
- [x] TEMPLATE-ARCHITECTURE.md
  - 아키텍처 문서 브랜딩

### 🔜 향후 적용 필요
- [ ] 02 노출분석.html
- [ ] 03 위험보고서.html
- [ ] 기타 HTML 파일들
- [ ] README.md

---

## 💡 브랜딩 철학

### 핵심 가치
1. **전문성** (Professional)
   - HEDGEFREEDOM = 대문자로 강한 인상
   - hedgeOn = 소문자로 기술적 느낌

2. **신뢰성** (Trustworthy)
   - .com 도메인 사용
   - 일관된 브랜딩

3. **혁신성** (Innovative)
   - "Engine" = 강력한 계산 엔진 이미지
   - Multi-threaded = 고성능 강조

### 메시지 톤앤매너
- ✅ 전문적이지만 친근하게
- ✅ 기술적이지만 이해하기 쉽게
- ✅ 강력하지만 안전하게

---

## 📞 브랜딩 관련 문의

브랜딩 표준에 대한 질문이나 제안:
- Email: branding@hedgefreedom.com
- Docs: www.hedgefreedom.com/brand

---

*HEDGEFREEDOM | powered by hedgeOn Engine*  
*www.hedgefreedom.com*
