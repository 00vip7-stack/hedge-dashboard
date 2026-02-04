#!/bin/bash
# Mac/Linux용 서버 시작 및 브라우저 자동 실행

cd "$(dirname "$0")"

echo "HedgeFreedom Mock Server 시작 중..."

# 백그라운드로 서버 시작
nohup python3 mock-server.py > server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > server.pid

echo "서버 시작 대기 중..."
sleep 3

echo "브라우저 열기..."

# OS 감지 및 브라우저 실행
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    open "http://localhost:9000/01%20%ED%97%A4%EC%A7%80%EB%A7%A4%EB%8B%88%EC%A0%80.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:9000/01%20%ED%97%A4%EC%A7%80%EB%A7%A4%EB%8B%88%EC%A0%80.html"
    else
        echo "브라우저를 수동으로 열어주세요: http://localhost:9000"
    fi
else
    echo "브라우저를 수동으로 열어주세요: http://localhost:9000"
fi

echo ""
echo "✅ 서버가 시작되었습니다!"
echo "PID: $SERVER_PID"
echo "포트: 9000"
echo "로그: server.log"
echo ""
echo "서버 종료: ./stop-server.sh"
