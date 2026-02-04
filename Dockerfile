FROM python:3.9-slim

LABEL maintainer="HedgeFreedom Team"
LABEL description="HedgeFreedom Mock API Server"

# 작업 디렉토리 설정
WORKDIR /app

# 파일 복사
COPY mock-server.py .
COPY *.html ./
COPY core/ ./core/
COPY requirements.txt .

# 타임존 설정 (옵션)
ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 환경 변수
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=9000
ENV ENVIRONMENT=production

# 포트 노출
EXPOSE 9000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:9000/api/health')"

# 서버 실행
CMD ["python3", "mock-server.py"]
