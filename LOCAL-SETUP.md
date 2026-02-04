# 로컬 환경 실행 가이드

## 방법 1: 터미널에서 직접 서버 시작

### 간단한 실행 (포그라운드)
```bash
python3 mock-server.py
```
- Ctrl+C로 종료 가능
- 터미널 창을 닫으면 서버도 종료됨

### 백그라운드 실행
```bash
# 백그라운드로 실행
python3 mock-server.py &

# 또는 nohup으로 실행 (로그 저장)
nohup python3 mock-server.py > server.log 2>&1 &

# 실행 중인 프로세스 확인
ps aux | grep mock-server.py

# 프로세스 종료
pkill -f mock-server.py
```

### 특정 포트로 실행
```bash
python3 mock-server.py 8080  # 8080 포트로 실행
```

---

## 방법 2: 로컬 컴퓨터에 다운로드해서 실행

### 1단계: 필수 파일 다운로드

다음 파일들을 다운로드하세요:

#### 필수 파일
- `mock-server.py` - 서버 메인 파일
- `index.html` - 메인 대시보드
- `01 헤지매니저.html` - 헤지 매니저 페이지
- `02 노출분석 .html` - 노출 분석 페이지
- `03 위험보고서.html` - 위험 보고서 페이지
- `core/realtime-data-handler.js` - 실시간 데이터 핸들러

#### 선택 파일 (추가 기능)
- 다른 HTML 파일들
- `start-server.sh`, `stop-server.sh` 등 (리눅스/맥 전용)

### 2단계: Python 설치 확인

```bash
# Python 버전 확인 (3.7 이상 필요)
python3 --version

# 또는 Windows에서
python --version
```

Python이 없다면 설치:
- **Windows**: https://www.python.org/downloads/
- **Mac**: `brew install python3`
- **Linux**: `sudo apt install python3`

### 3단계: 폴더 구조 생성

```
hedge-dashboard/
├── mock-server.py
├── index.html
├── 01 헤지매니저.html
├── 02 노출분석 .html
├── 03 위험보고서.html
├── core/
│   └── realtime-data-handler.js
└── (기타 HTML 파일들)
```

### 4단계: 서버 실행

#### Windows
```cmd
# 명령 프롬프트(CMD)에서
cd C:\Users\YourName\hedge-dashboard
python mock-server.py

# 또는 PowerShell에서
cd C:\Users\YourName\hedge-dashboard
python mock-server.py
```

#### Mac / Linux
```bash
cd ~/hedge-dashboard
python3 mock-server.py
```

### 5단계: 브라우저에서 접속

```
http://localhost:9000
```

---

## 방법 3: 배치 파일로 실행 (Windows)

### Windows용 시작 배치 파일 만들기

**start-server.bat** 파일 생성:
```batch
@echo off
echo HedgeFreedom Mock Server 시작 중...
echo 포트: 9000
echo.
echo 서버를 종료하려면 이 창을 닫거나 Ctrl+C를 누르세요.
echo.

python mock-server.py

pause
```

**start-server-background.bat** (백그라운드 실행):
```batch
@echo off
echo HedgeFreedom Mock Server 백그라운드로 시작...
start /B python mock-server.py > server.log 2>&1
echo 서버가 시작되었습니다 (포트: 9000)
echo 로그: server.log
pause
```

**stop-server.bat** (서버 종료):
```batch
@echo off
echo 서버 종료 중...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq mock-server*"
echo 서버가 종료되었습니다.
pause
```

**더블클릭으로 실행하면 됩니다!**

---

## 방법 4: Mac용 실행 앱 만들기

**start-server.command** 파일 생성:
```bash
#!/bin/bash
cd "$(dirname "$0")"
echo "HedgeFreedom Mock Server 시작 중..."
echo "포트: 9000"
echo ""
python3 mock-server.py
```

실행 권한 부여:
```bash
chmod +x start-server.command
```

더블클릭으로 실행!

---

## Git에서 전체 프로젝트 다운로드

### ZIP 파일로 다운로드
GitHub에서:
1. Code 버튼 클릭
2. Download ZIP 선택
3. 압축 해제 후 실행

### Git Clone
```bash
git clone https://github.com/00vip7-stack/hedge-dashboard.git
cd hedge-dashboard
python3 mock-server.py
```

---

## 포트 변경 방법

기본 포트(9000)가 사용 중이라면:

```bash
# 8080 포트로 실행
python3 mock-server.py 8080

# 3000 포트로 실행
python3 mock-server.py 3000
```

HTML 파일에서 API 주소도 변경해야 합니다:
```javascript
// realtime-data-handler.js에서
const API_BASE = 'http://localhost:8080'; // 포트 변경
```

---

## 문제 해결

### "python을 찾을 수 없습니다"
- Python 설치: https://www.python.org/downloads/
- PATH 환경변수에 Python 추가

### "포트가 이미 사용 중입니다"
```bash
# 포트 사용 확인 (Windows)
netstat -ano | findstr :9000

# 포트 사용 확인 (Mac/Linux)
lsof -i :9000

# 다른 포트로 실행
python3 mock-server.py 8080
```

### "CORS 에러"
- 파일을 직접 열지 말고 서버를 통해 접속하세요
- `file://` 대신 `http://localhost:9000` 사용

### 서버가 응답하지 않음
```bash
# 서버 재시작
pkill -f mock-server.py
python3 mock-server.py
```

---

## 추천 실행 방법

| 환경 | 추천 방법 |
|------|----------|
| **개발 중** | 터미널에서 직접 `python3 mock-server.py` |
| **Windows 사용자** | `start-server.bat` 더블클릭 |
| **Mac 사용자** | `start-server.command` 더블클릭 |
| **Linux/서버** | 배시 스크립트 `./start-server.sh` |
| **장기 실행** | nohup 또는 시스템 서비스 등록 |

---

## 브라우저 자동 실행 (옵션)

서버 시작 후 자동으로 브라우저 열기:

**Windows (start-server-auto.bat)**:
```batch
@echo off
start /B python mock-server.py
timeout /t 2
start http://localhost:9000
```

**Mac/Linux**:
```bash
python3 mock-server.py &
sleep 2
open http://localhost:9000  # Mac
# xdg-open http://localhost:9000  # Linux
```
