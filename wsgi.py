"""
WSGI 애플리케이션 엔트리포인트
Gunicorn과 함께 사용
"""

from mock_server_app import application

# Gunicorn이 이 변수를 찾음
app = application

if __name__ == '__main__':
    # 개발 모드로 직접 실행 시
    from wsgiref.simple_server import make_server
    
    print("개발 서버 시작...")
    print("프로덕션에서는 Gunicorn을 사용하세요:")
    print("  gunicorn -c gunicorn.conf.py wsgi:app")
    
    httpd = make_server('0.0.0.0', 9000, app)
    httpd.serve_forever()
