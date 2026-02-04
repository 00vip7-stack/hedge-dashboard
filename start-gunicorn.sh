#!/bin/bash
# Gunicorn 서버 시작 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 HedgeFreedom Gunicorn 서버 시작 중..."

# 로그 디렉토리 생성
mkdir -p logs

# Gunicorn 설치 확인
if ! command -v gunicorn &> /dev/null; then
    echo "❌ Gunicorn이 설치되지 않았습니다."
    echo "설치 방법: pip install gunicorn"
    exit 1
fi

# Gunicorn 실행
gunicorn -c gunicorn.conf.py wsgi:app

echo "👋 서버가 종료되었습니다."
