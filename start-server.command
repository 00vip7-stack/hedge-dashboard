#!/bin/bash
# Mac용 서버 시작 스크립트
# 더블클릭으로 실행 가능

cd "$(dirname "$0")"

echo "==================================="
echo "HedgeFreedom Mock Server"
echo "==================================="
echo ""
echo "서버 시작 중..."
echo "포트: 9000"
echo "접속: http://localhost:9000"
echo ""
echo "서버를 종료하려면 Ctrl+C를 누르세요."
echo "==================================="
echo ""

python3 mock-server.py
