# 🏠 로컬 PC에서 Hedge Dashboard 실행 가이드

## 📥 1단계: 프로젝트 다운로드

### 방법 A: Git Clone (권장)
```bash
git clone https://github.com/00vip7-stack/hedge-dashboard.git
cd hedge-dashboard
```

### 방법 B: ZIP 다운로드
1. https://github.com/00vip7-stack/hedge-dashboard
2. Code → Download ZIP
3. 압축 해제

---

## 🚀 2단계: 로컬에서 실행

### ✅ Windows (간단한 방법)

#### A. HTML 파일만 보기
1. `hedge-manager.html` 파일을 **Chrome** 브라우저로 열기
2. 제한적 기능만 작동 (서버 계산 기능 제외)

#### B. 전체 기능 사용 (Python 서버)

**1) Python 설치 확인**
```cmd
python --version
```
Python이 없으면 https://www.python.org/downloads/ 에서 설치

**2) 의존성 설치**
```cmd
pip install flask flask-cors openpyxl pandas
```

**3) 서버 시작**
```cmd
# 방법 1: 배치 파일 사용
start.bat

# 방법 2: Python 직접 실행
python mock_server_app.py
```

**4) 브라우저 열기**
- Chrome 브라우저에서 http://localhost:5000 접속
- 또는 `index.html` 파일을 브라우저에서 열기

---

### 🍎 Mac/Linux

**1) Python 확인**
```bash
python3 --version
```

**2) 의존성 설치**
```bash
pip3 install flask flask-cors openpyxl pandas
```

**3) 서버 시작**
```bash
chmod +x start-server.sh
./start-server.sh
```

**4) 브라우저 열기**
```bash
open http://localhost:5000
```

---

## 📂 주요 파일 설명

| 파일 | 용도 |
|------|------|
| `hedge-manager.html` | 메인 대시보드 |
| `index.html` | 로그인/인덱스 페이지 |
| `02 노출분석 .html` | 노출 분석 대시보드 |
| `03 위험보고서.html` | 위험 보고서 |
| `mock_server_app.py` | Python Flask 서버 (계산 엔진) |
| `core/` | 핵심 JavaScript 라이브러리 |
| `calculators/` | Python 계산기 모듈 |

---

## ⚙️ 서버 설정 (선택사항)

### 서버 포트 변경
`mock_server_app.py` 파일 하단 수정:
```python
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)  # 5000을 원하는 포트로 변경
```

### 서버 URL 변경
브라우저 콘솔에서:
```javascript
localStorage.setItem('CALCULATOR_SERVER', 'http://localhost:포트번호');
```

---

## 🔧 문제 해결

### ❌ "CORS 오류" 발생 시
- Chrome에서 보안 플래그로 실행:
```bash
# Windows
chrome.exe --disable-web-security --user-data-dir="C:\temp\chrome_dev"

# Mac
open -na "Google Chrome" --args --disable-web-security --user-data-dir="/tmp/chrome_dev"
```

### ❌ "Module not found" 오류
```bash
pip install -r requirements.txt
```

### ❌ "Port already in use"
```bash
# 다른 포트 사용
python mock_server_app.py --port 5001
```

---

## 📊 샘플 데이터로 테스트

프로젝트에 포함된 샘플 Excel 파일:
- `sample_trades.xlsx` - 기본 거래 데이터
- `sample_basic_format.xlsx` - 간단한 형식
- `sample_complex_format.xlsx` - 복잡한 형식
- `sample_dojeon_format.xlsx` - 도전포맷

**업로드 방법:**
1. hedge-manager.html 열기
2. "📄 파일 업로드" 버튼 클릭
3. 샘플 Excel 파일 선택
4. "⚡ 헤지 계산 실행" 버튼 클릭

---

## 🔒 로컬 폴더 저장 기능

### 자동 저장 설정
1. hedge-manager.html 열기
2. 상단의 "로컬 폴더 설정" 버튼 클릭
3. PC의 문서 폴더에 "HEDGEFREEDOM" 폴더 생성 후 선택
4. 이후 업로드된 모든 파일이 자동으로 저장됨

### 저장 위치
```
내 문서/
└── HEDGEFREEDOM/
    ├── data/           # 포지션 데이터
    ├── uploads/        # 업로드된 Excel 파일
    ├── history/        # 날짜별 히스토리
    └── logs/           # 시스템 로그
```

---

## 💡 추가 팁

### 네트워크 없이 사용
- HTML 파일들은 인터넷 없이 작동
- 단, CDN 라이브러리는 로컬 복사본으로 교체 권장

### 성능 최적화
- Chrome 브라우저 권장
- 대용량 데이터(1만 건 이상)는 서버 계산 사용

### 보안
- 개인정보는 로컬에서만 처리
- 서버로 전송되는 데이터는 자동 익명화

---

## 📞 지원

문제 발생 시:
1. 브라우저 콘솔(F12) 확인
2. `logs/` 폴더의 에러 로그 확인
3. GitHub Issues에 문의

---

**제작:** HedgeFreedom Team  
**버전:** 3.1  
**최종 업데이트:** 2026-02-04
