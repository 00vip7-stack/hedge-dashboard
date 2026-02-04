# 서버 관리 스크립트 사용 가이드

## 개요
HedgeFreedom Mock Server를 쉽게 관리할 수 있는 스크립트 모음입니다.

## 사용 가능한 스크립트

### 1. 서버 시작
```bash
./start-server.sh
```
- Mock Server를 백그라운드로 시작합니다
- 포트: 9000
- 로그 파일: `server.log`에 자동 기록
- PID 파일: `server.pid`에 프로세스 ID 저장

### 2. 서버 종료
```bash
./stop-server.sh
```
- 실행 중인 서버를 정상 종료합니다
- 10초 내 종료되지 않으면 강제 종료

### 3. 서버 재시작
```bash
./restart-server.sh
```
- 서버를 종료하고 다시 시작합니다
- 설정 변경 후 적용할 때 유용

### 4. 서버 상태 확인
```bash
./check-server.sh
```
- 서버 실행 여부 확인
- 헬스체크 수행
- 최근 로그 10줄 출력

## 로그 확인

### 실시간 로그 모니터링
```bash
tail -f server.log
```

### 전체 로그 보기
```bash
cat server.log
```

## 포트 정보
- Mock Server: `http://localhost:9000`
- Health Check: `http://localhost:9000/api/health`

## 주요 API 엔드포인트
- `GET /api/health` - 서버 상태 확인
- `POST /api/calculator/batch` - 배치 계산
- `GET /api/realtime-data` - 실시간 데이터
- `POST /api/realtime-data` - 실시간 데이터 업데이트

## 문제 해결

### 서버가 시작되지 않을 때
1. 포트가 이미 사용 중인지 확인
   ```bash
   lsof -i :9000
   ```

2. Python3가 설치되어 있는지 확인
   ```bash
   python3 --version
   ```

3. 로그 파일 확인
   ```bash
   cat server.log
   ```

### 서버가 응답하지 않을 때
1. 서버 상태 확인
   ```bash
   ./check-server.sh
   ```

2. 서버 재시작
   ```bash
   ./restart-server.sh
   ```

## 자동 시작 설정 (옵션)

개발 컨테이너에서 자동으로 서버를 시작하려면 `.devcontainer/devcontainer.json`에 추가:

```json
{
  "postStartCommand": "cd /workspaces/hedge-dashboard && ./start-server.sh"
}
```

## 참고사항
- 서버는 백그라운드에서 실행되며, 터미널을 닫아도 계속 실행됩니다
- 시스템 재부팅 시 수동으로 다시 시작해야 합니다
- 서버 프로세스 ID는 `server.pid` 파일에 저장됩니다
