# 🚀 빠른 시작 가이드

## 로컬 환경에서 실행

### 1️⃣ 가장 간단한 방법
```bash
python3 mock-server.py
# http://localhost:9000 접속
```
⚡ **멀티스레드 기본 활성화** - 100명 동시 접속 지원!

### 2️⃣ 스크립트 사용 (백그라운드)

**Linux/Mac:**
```bash
./start-server.sh        # 서버 시작
./start-server-auto.sh   # 서버 시작 + 브라우저 자동 실행
./check-server.sh        # 상태 확인
./stop-server.sh         # 서버 종료
```

**Windows:**
```batch
start.bat          # 서버 시작 (기본)
start-auto.bat     # 서버 + 브라우저 자동 실행 ⭐ 권장
stop.bat           # 서버 종료
```

💡 **3개 파일만 기억하세요!** [WINDOWS-GUIDE.md](WINDOWS-GUIDE.md) 참조

### 3️⃣ 접속
```
메인 페이지: http://localhost:9000
헤지 매니저: http://localhost:9000/01%20헤지매니저.html
```

---

## ☁️ 서버에 배포 (네이버 클라우드 등)

### 한 줄 설치 (Ubuntu/Debian)
```bash
curl -fsSL https://raw.githubusercontent.com/00vip7-stack/hedge-dashboard/main/install.sh | bash
```

### 수동 설치
자세한 내용은 [DEPLOYMENT.md](DEPLOYMENT.md) 참조

#### 요약
```bash
# 1. 프로젝트 다운로드
git clone https://github.com/00vip7-stack/hedge-dashboard.git
cd hedge-dashboard

# 2. systemd 서비스 등록
sudo cp hedge-server.service /etc/systemd/system/
sudo systemctl enable hedge-server
sudo systemctl start hedge-server

# 3. Nginx 설정 (선택)
sudo cp nginx-hedge.conf /etc/nginx/sites-available/hedge-dashboard
sudo ln -s /etc/nginx/sites-available/hedge-dashboard /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

## 🐳 Docker 사용

### Docker Compose (권장)
```bash
docker-compose up -d
```

### 단독 Docker
```bash
docker build -t hedge-dashboard .
docker run -d -p 9000:9000 hedge-dashboard
```

---

## 📝 주요 파일

| 파일 | 설명 |
|------|------|
| [mock-server.py](mock-server.py) | 메인 서버 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 상세 배포 가이드 |
| [LOCAL-SETUP.md](LOCAL-SETUP.md) | 로컬 설정 가이드 |
| [SERVER-GUIDE.md](SERVER-GUIDE.md) | 서버 관리 가이드 |
| [docker-compose.yml](docker-compose.yml) | Docker 구성 |
| [nginx-hedge.conf](nginx-hedge.conf) | Nginx 설정 |

---

## 🛠️ 문제 해결

### 포트가 사용 중이라면
```bash
python3 mock-server.py 8080  # 다른 포트 사용
```

### 서버가 응답하지 않으면
```bash
./restart-server.sh  # 재시작
```

### 더 많은 도움말
- [DEPLOYMENT.md](DEPLOYMENT.md) - 전체 배포 가이드
- [LOCAL-SETUP.md](LOCAL-SETUP.md) - 로컬 환경 상세 가이드

---

## 📞 지원

문제가 있으면 GitHub Issues에 등록해주세요.
