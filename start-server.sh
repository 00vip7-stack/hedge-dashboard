#!/bin/bash
# HedgeFreedom Mock Server 시작 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/server.log"
PID_FILE="$SCRIPT_DIR/server.pid"

# 이미 실행 중인지 확인
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "서버가 이미 실행 중입니다 (PID: $PID)"
        exit 1
    else
        echo "이전 PID 파일 삭제 중..."
        rm -f "$PID_FILE"
    fi
fi

echo "HedgeFreedom Mock Server 시작 중..."
echo "로그 파일: $LOG_FILE"

# Python 서버를 백그라운드로 실행
cd "$SCRIPT_DIR"
nohup python3 mock-server.py > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

# PID 저장
echo $SERVER_PID > "$PID_FILE"

# 서버가 시작될 때까지 잠시 대기
sleep 2

echo "서버가 시작되었습니다 (PID: $SERVER_PID)"
echo "포트: 9000"
echo "로그 확인: tail -f $LOG_FILE"
echo "서버 종료: ./stop-server.sh"
