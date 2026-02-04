# 서버 배포 가이드

## 목차
1. [로컬 환경 설정](#로컬-환경-설정)
2. [네이버 클라우드 배포](#네이버-클라우드-배포)
3. [일반 Linux 서버 배포](#일반-linux-서버-배포)
4. [Docker 배포](#docker-배포)
5. [문제 해결](#문제-해결)

---

## 로컬 환경 설정

### Python 설치 확인
```bash
python3 --version  # 3.7 이상 필요
```

### 서버 실행
```bash
# 기본 실행 (포트 9000)
python3 mock-server.py

# 다른 포트로 실행
python3 mock-server.py 8080

# 특정 호스트로 실행
python3 mock-server.py 8080 127.0.0.1
```

### 환경 변수 사용
```bash
export SERVER_PORT=8080
export SERVER_HOST=0.0.0.0
export ENVIRONMENT=production
python3 mock-server.py
```

---

## 네이버 클라우드 배포

### 1. 서버 생성 (네이버 클라우드 플랫폼)

1. **네이버 클라우드 콘솔** 접속
2. **Server** 메뉴에서 새 서버 생성
   - OS: Ubuntu 20.04 LTS 이상
   - 스펙: Micro (1vCPU, 1GB) 이상
3. **공인 IP** 할당
4. **ACG (Access Control Group)** 설정
   - 80 (HTTP) 포트 오픈
   - 443 (HTTPS) 포트 오픈
   - 22 (SSH) 포트 오픈

### 2. SSH 접속
```bash
ssh root@[공인IP]
```

### 3. 서버 환경 설정
```bash
# 시스템 업데이트
apt update && apt upgrade -y

# Python 설치
apt install -y python3 python3-pip

# Nginx 설치
apt install -y nginx

# Git 설치 (선택)
apt install -y git
```

### 4. 프로젝트 배포
```bash
# 프로젝트 디렉토리 생성
mkdir -p /var/www/hedge-dashboard
cd /var/www/hedge-dashboard

# GitHub에서 클론
git clone https://github.com/00vip7-stack/hedge-dashboard.git .

# 또는 파일 직접 업로드 (로컬에서)
# scp -r /path/to/hedge-dashboard/* root@[공인IP]:/var/www/hedge-dashboard/
```

### 5. 서비스 등록
```bash
# systemd 서비스 파일 복사
cp hedge-server.service /etc/systemd/system/

# 서비스 파일 수정 (필요시)
nano /etc/systemd/system/hedge-server.service

# 로그 디렉토리 생성
mkdir -p /var/log/hedge-server
chown www-data:www-data /var/log/hedge-server

# 서비스 활성화
systemctl daemon-reload
systemctl enable hedge-server
systemctl start hedge-server

# 상태 확인
systemctl status hedge-server
```

### 6. Nginx 설정
```bash
# 설정 파일 복사
cp nginx-hedge.conf /etc/nginx/sites-available/hedge-dashboard

# 도메인 수정
nano /etc/nginx/sites-available/hedge-dashboard
# server_name을 실제 도메인으로 변경

# 심볼릭 링크 생성
ln -s /etc/nginx/sites-available/hedge-dashboard /etc/nginx/sites-enabled/

# 기본 사이트 비활성화 (선택)
rm /etc/nginx/sites-enabled/default

# 설정 테스트
nginx -t

# Nginx 재시작
systemctl restart nginx
```

### 7. 방화벽 설정 (UFW 사용 시)
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### 8. 접속 확인
```bash
# 로컬에서 테스트
curl http://[공인IP]/api/health

# 브라우저에서
http://[공인IP]
```

---

## 일반 Linux 서버 배포

### Ubuntu/Debian
```bash
# 1. 시스템 준비
sudo apt update
sudo apt install -y python3 nginx git

# 2. 프로젝트 설치
sudo mkdir -p /var/www/hedge-dashboard
sudo git clone https://github.com/00vip7-stack/hedge-dashboard.git /var/www/hedge-dashboard

# 3. 서비스 설정
sudo cp /var/www/hedge-dashboard/hedge-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable hedge-server
sudo systemctl start hedge-server

# 4. Nginx 설정
sudo cp /var/www/hedge-dashboard/nginx-hedge.conf /etc/nginx/sites-available/hedge-dashboard
sudo ln -s /etc/nginx/sites-available/hedge-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### CentOS/RHEL
```bash
# 1. 시스템 준비
sudo yum install -y python3 nginx git

# 2. SELinux 설정 (필요시)
sudo setenforce 0
sudo sed -i 's/SELINUX=enforcing/SELINUX=permissive/g' /etc/selinux/config

# 3. 프로젝트 설치 (Ubuntu와 동일)
# ...

# 4. 방화벽 설정
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## Docker 배포

### Dockerfile
프로젝트에 `Dockerfile` 생성:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY mock-server.py .
COPY *.html ./
COPY core/ ./core/

EXPOSE 9000

CMD ["python3", "mock-server.py"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  hedge-api:
    build: .
    ports:
      - "9000:9000"
    environment:
      - SERVER_HOST=0.0.0.0
      - SERVER_PORT=9000
      - ENVIRONMENT=production
    restart: always
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx-hedge.conf:/etc/nginx/conf.d/default.conf
      - .:/usr/share/nginx/html
    depends_on:
      - hedge-api
    restart: always
```

### 실행
```bash
# 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

---

## HTTPS 설정 (Let's Encrypt)

### 1. Certbot 설치
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. SSL 인증서 발급
```bash
sudo certbot --nginx -d your-domain.com
```

### 3. 자동 갱신 설정
```bash
sudo certbot renew --dry-run
```

---

## 서비스 관리 명령어

### systemd 서비스
```bash
# 시작
sudo systemctl start hedge-server

# 중지
sudo systemctl stop hedge-server

# 재시작
sudo systemctl restart hedge-server

# 상태 확인
sudo systemctl status hedge-server

# 로그 확인
sudo journalctl -u hedge-server -f

# 부팅 시 자동 시작
sudo systemctl enable hedge-server

# 자동 시작 해제
sudo systemctl disable hedge-server
```

### Nginx
```bash
# 시작
sudo systemctl start nginx

# 중지
sudo systemctl stop nginx

# 재시작
sudo systemctl restart nginx

# 설정 리로드
sudo systemctl reload nginx

# 설정 테스트
sudo nginx -t
```

---

## 문제 해결

### 포트가 이미 사용 중
```bash
# 포트 사용 확인
sudo lsof -i :9000
sudo netstat -tulpn | grep 9000

# 프로세스 종료
sudo kill -9 [PID]

# 다른 포트 사용
python3 mock-server.py 8080
```

### 서비스가 시작되지 않음
```bash
# 로그 확인
sudo journalctl -u hedge-server -n 50
sudo cat /var/log/hedge-server/error.log

# 권한 확인
ls -la /var/www/hedge-dashboard/

# 수동 실행 테스트
cd /var/www/hedge-dashboard
python3 mock-server.py
```

### Nginx 502 Bad Gateway
```bash
# 백엔드 서버 상태 확인
curl http://localhost:9000/api/health

# Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log

# SELinux 문제 (CentOS)
sudo setsebool -P httpd_can_network_connect 1
```

### CORS 에러
Nginx 설정에서 CORS 헤더 확인:
```nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
add_header Access-Control-Allow-Headers 'Content-Type';
```

### 파일 업로드 (SCP)
```bash
# 로컬에서 서버로
scp -r /path/to/hedge-dashboard/* user@server:/var/www/hedge-dashboard/

# 서버에서 로컬로
scp -r user@server:/var/www/hedge-dashboard/* /path/to/local/
```

---

## 성능 최적화

### Nginx 캐싱
```nginx
# 정적 파일 캐싱
location ~* \.(js|css|png|jpg|jpeg|gif|ico|html)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Gzip 압축
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

---

## 모니터링

### 서버 로그 실시간 확인
```bash
# 서비스 로그
sudo journalctl -u hedge-server -f

# Nginx 액세스 로그
sudo tail -f /var/log/nginx/hedge-dashboard-access.log

# Nginx 에러 로그
sudo tail -f /var/log/nginx/hedge-dashboard-error.log
```

### 시스템 리소스 모니터링
```bash
# CPU/메모리 사용량
htop

# 디스크 사용량
df -h

# 네트워크 연결
netstat -tulpn
```

---

## 백업

### 자동 백업 스크립트
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/hedge-dashboard"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/hedge-$DATE.tar.gz /var/www/hedge-dashboard

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "hedge-*.tar.gz" -mtime +7 -delete
```

### 크론 설정 (매일 새벽 3시)
```bash
0 3 * * * /root/backup.sh
```

---

## 참고 자료

- 네이버 클라우드: https://www.ncloud.com/
- Nginx 문서: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/
- systemd 문서: https://www.freedesktop.org/software/systemd/man/
