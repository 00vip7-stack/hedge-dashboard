# HedgeFreedom Dashboard

중소기업을 위한 AI 기반 환헤지 의사결정 대시보드

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.7+-blue.svg)](https://www.python.org/downloads/)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()

---

## 🚀 빠른 시작

### 로컬 실행 (가장 간단)
```bash
python3 mock-server.py
# http://localhost:9000 접속
```
⚡ **멀티스레드 기본 활성화** - 100명 동시 접속 지원

### 스크립트 사용 (추천 ⭐)
```bash
# Linux/Mac
./start-server-auto.sh   # 서버 + 브라우저 자동 실행

# Windows - 3개 파일만 기억하세요!
start.bat                # 서버 시작 (기본)
start-auto.bat           # 서버 + 브라우저 자동 실행
stop.bat                 # 서버 종료
```

**Windows 문제 해결**: [WINDOWS-GUIDE.md](WINDOWS-GUIDE.md)

자세한 내용: [QUICKSTART.md](QUICKSTART.md)

---

## ☁️ 서버 배포

### 자동 설치 (Ubuntu/Debian)
```bash
curl -fsSL https://raw.githubusercontent.com/00vip7-stack/hedge-dashboard/main/install.sh | sudo bash
```

### Docker
```bash
docker-compose up -d
```

### 수동 설치
[DEPLOYMENT.md](DEPLOYMENT.md) 참조

---

## 📚 문서

| 문서 | 설명 |
|------|------|
| [QUICKSTART.md](QUICKSTART.md) | 빠른 시작 가이드 |
| [WINDOWS-GUIDE.md](WINDOWS-GUIDE.md) | **Windows 사용자 필독** ⭐ |
| [SCALABILITY.md](SCALABILITY.md) | **성능 및 확장성 가이드** ⭐ |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 서버 배포 가이드 (네이버 클라우드 포함) |
| [LOCAL-SETUP.md](LOCAL-SETUP.md) | 로컬 환경 상세 설정 |
| [SERVER-GUIDE.md](SERVER-GUIDE.md) | 서버 관리 명령어 |
| [REALTIME-ARCHITECTURE.md](REALTIME-ARCHITECTURE.md) | 실시간 기능 아키텍처 |

---

## ⚡ 성능 및 확장성

### 현재 서버 성능 (기본 멀티스레드)

✅ **동시 접속**: 최대 100명  
✅ **처리량**: ~500 req/s  
✅ **응답 시간**: ~50ms  
✅ **비용**: 무료

### 더 많은 사용자가 필요하다면?

| 버전 | 동시 접속 | 처리량 | 적합 대상 |
|------|----------|--------|----------|
| **현재 (멀티스레드)** | 100명 | 500 req/s | 소규모~중규모 |
| **Gunicorn** | 1,000명 | 5,000 req/s | 중대규모 서비스 |
| **Auto Scaling** | 무제한 | 무제한 | 대기업 |

### 대규모 확장 방법

```bash
# 1,000명 이상 동시 접속이 필요하다면
pip install gunicorn
gunicorn -c gunicorn.conf.py wsgi:app
```

자세한 내용: [SCALABILITY.md](SCALABILITY.md)

## ✨ 주요 기능

- 🎯 **헤지 매니저**: 포지션 관리 및 최적화
- 📊 **노출 분석**: 통화별 노출 현황 분석
- ⚠️ **위험 보고서**: VaR, 스트레스 테스트
- 💰 **마진 벤치마크**: 시장 대비 마진율 비교
- 📈 **실시간 모니터**: 실시간 환율/마진 추적
- 🔔 **알림 시스템**: 변동성/이탈 알림

---

## 🛠️ 기술 스택

- **Backend**: Python 3 (HTTP Server)
- **Frontend**: HTML5, CSS3, JavaScript
- **Deployment**: Docker, Nginx, systemd
- **Cloud**: 네이버 클라우드 플랫폼 지원

---

## 📦 프로젝트 구조

```
hedge-dashboard/
├── mock-server.py              # API 서버
├── index.html                  # 메인 대시보드
├── 01 헤지매니저.html           # 헤지 관리
├── 02 노출분석 .html            # 노출 분석
├── 03 위험보고서.html           # 위험 보고서
├── core/                       # 코어 모듈
│   └── realtime-data-handler.js
├── start-server.sh             # 시작 스크립트 (Linux/Mac)
├── start-server.bat            # 시작 스크립트 (Windows)
├── docker-compose.yml          # Docker 구성
├── nginx-hedge.conf            # Nginx 설정
└── DEPLOYMENT.md               # 배포 가이드
```

---

## 🎯 사용 시나리오

1. **로컬 개발**: `python3 mock-server.py`
2. **Windows 사용자**: `start-server.bat` 더블클릭
3. **Linux 서버**: systemd 서비스로 등록
4. **네이버 클라우드**: [DEPLOYMENT.md](DEPLOYMENT.md) 참조
5. **Docker**: `docker-compose up -d`

---

## 🔧 환경 설정

### 환경 변수
```bash
export SERVER_HOST=0.0.0.0    # 바인딩 호스트
export SERVER_PORT=9000       # 포트 번호
export ENVIRONMENT=production # 환경 (development/production)
```

### 포트 변경
```bash
python3 mock-server.py 8080   # 8080 포트로 실행
```

---

## 📊 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 서버 상태 확인 |
| POST | `/api/calculator/batch` | 배치 계산 |
| GET | `/api/realtime-data` | 실시간 데이터 조회 |
| POST | `/api/realtime-data` | 실시간 데이터 업데이트 |

---

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

## 📞 지원

문제가 있으면 [Issues](https://github.com/00vip7-stack/hedge-dashboard/issues)에 등록해주세요.

---

## 🙏 감사의 말

HedgeFreedom을 사용해주셔서 감사합니다!
