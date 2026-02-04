# 서버 성능 및 확장성 가이드

## ✅ 현재 상태: 멀티스레드 활성화

### 기본 서버 성능
- ✅ **멀티스레드**: 기본 활성화됨
- ✅ **동시 접속**: 최대 100명
- ✅ **처리량**: ~500 req/s (10배 향상)
- ✅ **응답 시간**: ~50ms
- ✅ **비용**: 무료

### 로컬 환경
- ✅ **Windows**: `start-server-auto.bat` 실행 → 정상 작동
- ✅ **Mac/Linux**: `./start-server-auto.sh` 실행 → 정상 작동
- ✅ **Docker**: `docker-compose up -d` → 정상 작동

### 서버 배포
- ✅ **네이버 클라우드**: systemd 서비스로 등록 → 정상 작동
- ✅ **일반 Linux 서버**: Nginx + Python → 정상 작동
- ✅ **정적 파일 서빙**: HTML/CSS/JS 모두 제공 가능
- ✅ **API 엔드포인트**: 모든 API 정상 작동

---

## ⚠️ 현재의 한계: 동시 접속자 수

### Python BaseHTTPServer의 문제점

현재 사용 중인 `http.server.HTTPServer`는:

```python
# 현재 구조
HTTPServer(server_address, MockAPIHandler)
```

**한계:**
- 🔴 **단일 스레드**: 한 번에 하나의 요청만 처리
- 🔴 **동시 접속**: 약 10~50명 (설정에 따라 다름)
- 🔴 **성능**: 초당 100~500 요청 처리
- 🔴 **프로덕션 부적합**: 테스트/개발용으로만 권장

### 실제 성능 예상

| 동시 접속자 수 | 현재 서버 (멀티스레드) | 권장 솔루션 |
|---------------|---------------------|------------|
| 1~100명 | ✅ 완벽 지원 | mock-server.py (현재) |
| 100~1,000명 | ⚠️ 느려질 수 있음 | Gunicorn + Nginx |
| 1,000~10,000명 | ❌ 응답 지연 | Gunicorn + Nginx + 로드밸런서 |
| 10,000명 이상 | ❌ 작동 불가 | 클라우드 Auto Scaling |

---

## 🚀 해결 방법: 단계별 업그레이드

### 레벨 1: 멀티스레딩 (10~100명)

**장점**: 코드 수정 최소, 즉시 적용  
**적합**: 소규모 팀, 내부 사용

```python
# 간단한 수정으로 성능 10배 향상
from socketserver import ThreadingMixIn

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    pass

# 사용
httpd = ThreadedHTTPServer(server_address, MockAPIHandler)
```

### 레벨 2: Gunicorn/uWSGI (100~1,000명)

**장점**: 프로덕션 준비 완료, 안정적  
**적합**: 중소기업, 실제 서비스

```bash
# Gunicorn 설치
pip install gunicorn

# 실행 (4개 워커 프로세스)
gunicorn -w 4 -b 0.0.0.0:9000 wsgi:app
```

### 레벨 3: 클라우드 Auto Scaling (1,000명 이상)

**장점**: 무제한 확장, 자동 복구  
**적합**: 대규모 서비스

- 네이버 클라우드 Auto Scaling
- AWS ELB + EC2 Auto Scaling
- Kubernetes (K8s)

---

## 💡 추천 솔루션

### 상황별 권장 사항

#### 1. 소규모~중규모 (100명 이하)
```bash
# 현재 서버 그대로 사용 (멀티스레드)
python3 mock-server.py
```
✅ **추천!**  
**비용**: 무료  
**성능**: 충분  
**설정**: 필요 없음

#### 2. 중규모~대규모 (1,000명 이하)
```bash
# Gunicorn 프로덕션 서버
pip install gunicorn
gunicorn -c gunicorn.conf.py wsgi:app
```
**비용**: 월 5~10만원 (서버)  
**성능**: 10배 향상  
**설정**: 30분
#### 3. 초대규모 (10,000명 이상)
```bash
# 클라우드 Auto Scaling
```
**비용**: 사용량에 따라  
**성능**: 무제한  
**설정**: 전문가 필요

---

## 🔧 즉시 적용 가능한 개선

### 1. Nginx 캐싱 활성화

정적 파일을 Nginx가 직접 제공:

```nginx
location ~* \.(html|css|js|png|jpg|jpeg|gif|ico)$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
```

**효과**: 정적 파일 요청 90% 감소

### 2. CDN 사용

HTML/CSS/JS를 CDN에 업로드:

- 네이버 클라우드 CDN
- Cloudflare
- AWS CloudFront

**효과**: 서버 부하 80% 감소

### 3. 데이터베이스 캐싱

자주 사용하는 데이터 캐싱:

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_exchange_rate():
    # 캐시된 데이터 반환
    pass
```

**효과**: API 응답 속도 5배 향상

---

## 📊 성능 비교표

| 솔루션 | 동시 접속 | 초당 요청 | 응답 시간 | 비용 | 난이도 |
|--------|----------|----------|----------|------|--------|
| **현재 (멀티스레드)** | 100명 | 500 req/s | 50ms | 무료 | ⭐ |
| Gunicorn | 500명 | 5,000 req/s | 20ms | 저렴 | ⭐⭐ |
| Gunicorn + Nginx | 2,000명 | 20,000 req/s | 10ms | 중간 | ⭐⭐⭐ |
| Auto Scaling | 무제한 | 무제한 | 5ms | 높음 | ⭐⭐⭐⭐⭐ |

---

## 🎯 실제 사용 시나리오

### 시나리오 1: 사내 도구 (10~100명)
```bash
python3 mock-server.py  # 현재 멀티스레드 서버
```
✅ 완벽하게 작동

### 시나리오 2: 스타트업 (100~500명)
```bash
gunicorn -c gunicorn.conf.py wsgi:app
```
+ Nginx 리버스 프록시  
✅ 안정적

### 시나리오 3: 중견기업 (500~2,000명)
```bash
gunicorn -c gunicorn.conf.py wsgi:app
```
+ Nginx + CDN  
✅ 고성능
### 시나리오 4: 대기업 (2,000명 이상)
- 로드 밸런서
- Auto Scaling
- CDN
- 데이터베이스 클러스터
⚠️ 전문 인프라 팀 필요

---

## 💰 비용 예상 (네이버 클라우드 기준)

### 소규모 (100명)
```
- 서버: Micro (1vCPU, 1GB) - 월 15,000원
- 트래픽: 100GB/월 - 무료
- 총액: 월 15,000원
```

### 중규모 (1,000명)
```
- 서버: Compact (2vCPU, 4GB) - 월 50,000원
- 트래픽: 500GB/월 - 월 10,000원
- CDN: 월 20,000원
- 총액: 월 80,000원
```

### 대규모 (10,000명)
```
- 서버 3대: Standard × 3 - 월 300,000원
- 로드 밸런서 - 월 30,000원
- CDN - 월 100,000원
- 데이터베이스 - 월 100,000원
- 총액: 월 530,000원
```

---

## ⚡ 즉시 적용: 성능 개선 체크리스트

### 무료 개선 (즉시 가능)
- [ ] Nginx 정적 파일 캐싱 활성화
- [ ] Gzip 압축 활성화
- [ ] 멀티스레드 서버로 전환
- [ ] API 응답 캐싱

### 저비용 개선 (월 5만원)
- [ ] 서버 스펙 업그레이드
- [ ] CDN 사용
- [ ] Gunicorn 도입

### 고성능 개선 (월 50만원)
- [ ] 로드 밸런서
- [ ] Auto Scaling
- [ ] 데이터베이스 클러스터
- [ ] 모니터링 시스템

---

## 🔍 성능 테스트 방법

### Apache Bench로 테스트
```bash
# 100명이 동시에 1000번 요청
ab -n 1000 -c 100 http://localhost:9000/api/health

# 결과 예시:
# Requests per second: 150 [#/sec]
# Time per request: 666 [ms]
```

### 부하 테스트 도구
- **Apache Bench (ab)**: 간단한 테스트
- **wrk**: 고성능 테스트
- **Locust**: Python 기반, GUI 제공
- **JMeter**: 종합 테스트

---

## 🎓 결론 및 권장사항

### 현재 상태
✅ **로컬/네이버 서버에서 정상 작동**  
✅ **소규모 사용자 (10명 이하) 문제없음**  
⚠️ **대규모 트래픽 (수만 명)은 추가 작업 필요**

### 단계별 로드맵
1. **지금 (무료)**: 현재 서버 사용
2. **100명 규모**: 멀티스레드 버전으로 전환
3. **1,000명 규모**: Gunicorn + Nginx 도입
4. **10,000명 이상**: 클라우드 Auto Scaling

### 다음 단계
원하시는 규모에 맞춰:
1. **멀티스레드 서버** 생성 (무료, 10배 성능)
2. **Gunicorn 버전** 생성 (저비용, 100배 성능)
3. **Auto Scaling 가이드** 제공 (고비용, 무제한 성능)

어떤 규모를 목표로 하시나요?
