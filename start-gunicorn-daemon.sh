#!/bin/bash
# Gunicorn 서버 백그라운드 시작

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 HedgeFreedom Gunicorn 서버 백그라운드로 시작 중..."

# 로그 디렉토리 생성
mkdir -p logs

# Gunicorn 설치 확인
if ! command -v gunicorn &> /dev/null; then
    echo "❌ Gunicorn이 설치되지 않았습니다."
    echo "설치 방법: pip install gunicorn"
    exit 1
fi

# 기존 프로세스 확인
if [ -f "gunicorn.pid" ]; then
    PID=$(cat gunicorn.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "⚠️  서버가 이미 실행 중입니다 (PID: $PID)"
        exit 1
    fi
fi

# 백그라운드로 실행
gunicorn -c gunicorn.conf.py wsgi:app --daemon

sleep 2

if [ -f "gunicorn.pid" ]; then
    PID=$(cat gunicorn.pid)
    echo "✅ 서버가 시작되었습니다 (PID: $PID)"
    echo "   포트: 9000"
    echo "   로그: tail -f logs/gunicorn-access.log"
    echo "   종료: kill $PID"
else
    echo "❌ 서버 시작 실패"
    echo "   로그 확인: cat logs/gunicorn-error.log"
fi
