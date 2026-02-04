#!/bin/bash
# HedgeFreedom Mock Server 상태 확인 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/server.pid"
LOG_FILE="$SCRIPT_DIR/server.log"

echo "===== HedgeFreedom Mock Server 상태 ====="

if [ ! -f "$PID_FILE" ]; then
    echo "상태: 정지됨"
    echo "서버가 실행 중이지 않습니다"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ps -p $PID > /dev/null 2>&1; then
    echo "상태: 실행 중"
    echo "PID: $PID"
    echo "포트: 9000"
    echo ""
    
    # 서버 헬스체크
    if command -v curl &> /dev/null; then
        echo "헬스체크 중..."
        HEALTH=$(curl -s http://localhost:9000/api/health 2>&1)
        if [ $? -eq 0 ]; then
            echo "✓ 서버 응답 정상"
            echo "$HEALTH"
        else
            echo "✗ 서버가 응답하지 않습니다"
        fi
    fi
    
    echo ""
    echo "최근 로그 (마지막 10줄):"
    if [ -f "$LOG_FILE" ]; then
        tail -n 10 "$LOG_FILE"
    else
        echo "로그 파일 없음"
    fi
else
    echo "상태: 오류"
    echo "PID 파일은 존재하지만 프로세스가 실행 중이지 않습니다 (PID: $PID)"
    echo "정리하려면 ./stop-server.sh를 실행하세요"
    exit 1
fi
