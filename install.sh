#!/bin/bash
# HedgeFreedom 자동 설치 스크립트 (Ubuntu/Debian)

set -e

echo "=========================================="
echo "HedgeFreedom 자동 설치 시작"
echo "=========================================="

# 1. 시스템 업데이트
echo "📦 시스템 업데이트 중..."
apt update -qq

# 2. Python 설치 확인
echo "🐍 Python 확인 중..."
if ! command -v python3 &> /dev/null; then
    echo "Python3 설치 중..."
    apt install -y python3
fi
python3 --version

# 3. Nginx 설치 (선택)
read -p "Nginx를 설치하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📡 Nginx 설치 중..."
    apt install -y nginx
fi

# 4. Git 설치 확인
if ! command -v git &> /dev/null; then
    echo "Git 설치 중..."
    apt install -y git
fi

# 5. 프로젝트 클론
INSTALL_DIR="/var/www/hedge-dashboard"
echo "📥 프로젝트 다운로드 중..."
if [ -d "$INSTALL_DIR" ]; then
    echo "기존 디렉토리 발견. 백업 중..."
    mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
fi

git clone https://github.com/00vip7-stack/hedge-dashboard.git "$INSTALL_DIR"
cd "$INSTALL_DIR"

# 6. 스크립트 실행 권한
echo "🔧 권한 설정 중..."
chmod +x start-server.sh stop-server.sh restart-server.sh check-server.sh

# 7. systemd 서비스 등록
read -p "systemd 서비스로 등록하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⚙️ systemd 서비스 등록 중..."
    
    # 로그 디렉토리 생성
    mkdir -p /var/log/hedge-server
    chown www-data:www-data /var/log/hedge-server
    
    # 서비스 파일 복사
    cp hedge-server.service /etc/systemd/system/
    
    # 서비스 활성화
    systemctl daemon-reload
    systemctl enable hedge-server
    systemctl start hedge-server
    
    echo "✅ 서비스가 등록되었습니다"
    systemctl status hedge-server --no-pager
fi

# 8. Nginx 설정
if command -v nginx &> /dev/null; then
    read -p "Nginx를 설정하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌐 Nginx 설정 중..."
        
        # 도메인 입력
        read -p "도메인을 입력하세요 (예: example.com, 또는 _ for default): " DOMAIN
        
        # 설정 파일 수정
        sed "s/your-domain.com/$DOMAIN/g" nginx-hedge.conf > /etc/nginx/sites-available/hedge-dashboard
        
        # 심볼릭 링크
        ln -sf /etc/nginx/sites-available/hedge-dashboard /etc/nginx/sites-enabled/
        
        # 설정 테스트
        if nginx -t; then
            systemctl restart nginx
            echo "✅ Nginx가 설정되었습니다"
        else
            echo "❌ Nginx 설정 오류"
        fi
    fi
fi

# 9. 방화벽 설정
if command -v ufw &> /dev/null; then
    read -p "방화벽(UFW)을 설정하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔥 방화벽 설정 중..."
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 22/tcp
        echo "✅ 방화벽이 설정되었습니다"
    fi
fi

# 10. 완료
echo ""
echo "=========================================="
echo "✅ 설치 완료!"
echo "=========================================="
echo ""
echo "접속 주소: http://$(hostname -I | awk '{print $1}'):9000"
echo ""
echo "명령어:"
echo "  - 상태 확인: systemctl status hedge-server"
echo "  - 로그 확인: journalctl -u hedge-server -f"
echo "  - 서버 재시작: systemctl restart hedge-server"
echo ""
echo "문서:"
echo "  - 배포 가이드: cat $INSTALL_DIR/DEPLOYMENT.md"
echo "  - 빠른 시작: cat $INSTALL_DIR/QUICKSTART.md"
echo ""
