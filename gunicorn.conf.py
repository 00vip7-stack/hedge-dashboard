# Gunicorn 설정 파일
# 중규모~대규모 트래픽용 (100~1,000명 동시 접속)

import multiprocessing
import os

# 바인딩 주소
bind = "0.0.0.0:9000"

# 워커 프로세스 수 (CPU 코어 * 2 + 1 권장)
workers = multiprocessing.cpu_count() * 2 + 1

# 워커 클래스 (기본: sync, 비동기: gevent, eventlet)
worker_class = "sync"

# 워커당 스레드 수 (멀티스레딩 사용 시)
threads = 2

# 최대 동시 요청 수
worker_connections = 1000

# 타임아웃 (초)
timeout = 30

# Keep-alive (초)
keepalive = 2

# 최대 요청 수 (메모리 누수 방지)
max_requests = 1000
max_requests_jitter = 50

# 로그 설정
accesslog = "logs/gunicorn-access.log"
errorlog = "logs/gunicorn-error.log"
loglevel = "info"

# 프로세스 이름
proc_name = "hedge-freedom-api"

# PID 파일
pidfile = "gunicorn.pid"

# 데몬 모드 (백그라운드 실행)
daemon = False

# 환경 변수
raw_env = [
    "ENVIRONMENT=production",
    "SERVER_HOST=0.0.0.0",
    "SERVER_PORT=9000"
]

# 서버 훅
def on_starting(server):
    """서버 시작 시"""
    print("🚀 Gunicorn 서버 시작 중...")

def on_reload(server):
    """서버 리로드 시"""
    print("🔄 Gunicorn 서버 리로드 중...")

def worker_int(worker):
    """워커 중단 시"""
    print(f"⚠️  워커 {worker.pid} 중단됨")

def worker_abort(worker):
    """워커 강제 종료 시"""
    print(f"❌ 워커 {worker.pid} 강제 종료됨")
