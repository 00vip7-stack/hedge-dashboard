#!/bin/bash
# HedgeFreedom Mock Server 종료 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/server.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "서버가 실행 중이지 않습니다 (PID 파일 없음)"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ps -p $PID > /dev/null 2>&1; then
    echo "서버 종료 중... (PID: $PID)"
    kill $PID
    
    # 프로세스가 종료될 때까지 대기
    for i in {1..10}; do
        if ! ps -p $PID > /dev/null 2>&1; then
            echo "서버가 정상적으로 종료되었습니다"
            rm -f "$PID_FILE"
            exit 0
        fi
        sleep 1
    done
    
    # 강제 종료
    echo "강제 종료 중..."
    kill -9 $PID
    rm -f "$PID_FILE"
    echo "서버가 강제 종료되었습니다"
else
    echo "서버가 실행 중이지 않습니다 (PID: $PID)"
    rm -f "$PID_FILE"
fi
