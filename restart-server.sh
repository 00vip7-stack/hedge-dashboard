#!/bin/bash
# HedgeFreedom Mock Server 재시작 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "서버 재시작 중..."

# 기존 서버 종료
if [ -f "$SCRIPT_DIR/stop-server.sh" ]; then
    bash "$SCRIPT_DIR/stop-server.sh"
fi

# 잠시 대기
sleep 2

# 서버 시작
if [ -f "$SCRIPT_DIR/start-server.sh" ]; then
    bash "$SCRIPT_DIR/start-server.sh"
else
    echo "시작 스크립트를 찾을 수 없습니다"
    exit 1
fi
