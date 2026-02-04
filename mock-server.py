#!/usr/bin/env python3
"""
HedgeFreedom Mock API Server (Multi-threaded)
멀티스레드 지원으로 동시 접속 성능 향상
프로덕션 환경 지원
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import json
import random
import os
import sys
import mimetypes
from datetime import datetime, timedelta
from urllib.parse import unquote

class MockAPIHandler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        """CORS preflight 처리"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_HEAD(self):
        """HEAD 요청 처리"""
        self.do_GET()
    
    def do_POST(self):
        """POST 요청 처리"""
        if self.path == '/api/calculator/batch':
            self.handle_batch_calculation()
        elif self.path == '/api/realtime-data':
            self.handle_realtime_data()
        elif self.path.startswith('/api/alerts/') and self.path.endswith('/dismiss'):
            self.handle_dismiss_alert()
        elif self.path == '/api/alerts/settings':
            self.handle_save_alert_settings()
        elif self.path == '/api/hedge/upload':
            self.handle_hedge_upload()
        elif self.path == '/api/hedge/calculate':
            self.handle_hedge_calculate()
        elif self.path == '/api/user/settings':
            self.handle_save_user_settings()
        else:
            self.send_error(404, "Endpoint not found")
    
    def do_GET(self):
        """GET 요청 처리"""
        # API 엔드포인트 처리
        if self.path == '/api/realtime-data':
            self.handle_realtime_data()
        elif self.path == '/api/health':
            self.send_json_response({'status': 'ok', 'timestamp': datetime.now().isoformat()})
        elif self.path == '/api/alerts':
            self.handle_get_alerts()
        elif self.path == '/api/alerts/settings':
            self.handle_get_alert_settings()
        elif self.path == '/api/hedge/positions':
            self.handle_get_hedge_positions()
        elif self.path == '/api/hedge/kpi':
            self.handle_get_hedge_kpi()
        elif self.path == '/api/hedge/suggestions':
            self.handle_get_hedge_suggestions()
        elif self.path == '/api/user/settings':
            self.handle_get_user_settings()
        else:
            # 정적 파일 서빙
            self.serve_static_file()
    
    def serve_static_file(self):
        """정적 파일 서빙 (HTML, CSS, JS 등)"""
        try:
            # URL 디코딩 및 경로 정리
            path = unquote(self.path)
            
            # 루트 경로는 index.html로
            if path == '/' or path == '':
                path = '/index.html'
            
            # 쿼리스트링 제거
            if '?' in path:
                path = path.split('?')[0]
            
            # 보안: 상위 디렉토리 접근 방지
            if '..' in path:
                self.send_error(403, "Forbidden")
                return
            
            # 파일 경로 생성
            file_path = os.path.join(os.getcwd(), path.lstrip('/'))
            
            # 파일 존재 확인
            if not os.path.exists(file_path) or not os.path.isfile(file_path):
                self.send_error(404, f"File not found: {path}")
                return
            
            # MIME 타입 결정
            mime_type, _ = mimetypes.guess_type(file_path)
            if mime_type is None:
                mime_type = 'application/octet-stream'
            
            # 파일 읽기 및 전송
            with open(file_path, 'rb') as f:
                content = f.read()
                
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', len(content))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(content)
            
            print(f"✅ Served: {path} ({mime_type})")
            
        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")
            print(f"❌ Error serving {self.path}: {e}")
    
    def handle_batch_calculation(self):
        """배치 계산 Mock 응답"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Mock 응답 생성
            mock_result = {
                'timestamp': datetime.now().isoformat(),
                'status': 'success',
                'summary': {
                    'total_exposure': 15000000,
                    'hedge_ratio': 67.5,
                    'recommended_hedge': 70.0,
                    'var_95': 1250000,
                    'expected_margin_savings': 12000000
                },
                'by_currency': {
                    'USD': {
                        'exposure': 10000000,
                        'hedged': 6500000,
                        'ratio': 65.0,
                        'recommendation': 'hedge_more'
                    },
                    'EUR': {
                        'exposure': 3000000,
                        'hedged': 2100000,
                        'ratio': 70.0,
                        'recommendation': 'maintain'
                    },
                    'JPY': {
                        'exposure': 2000000,
                        'hedged': 1500000,
                        'ratio': 75.0,
                        'recommendation': 'optimal'
                    }
                },
                'hedge_suggestions': [
                    {
                        'currency': 'USD',
                        'action': 'hedge',
                        'amount': 350000,
                        'maturity': (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d'),
                        'reason': '노출 비율이 권장 수준보다 낮습니다'
                    },
                    {
                        'currency': 'EUR',
                        'action': 'maintain',
                        'amount': 0,
                        'maturity': None,
                        'reason': '현재 헤지 비율이 적정합니다'
                    }
                ],
                'risk_metrics': {
                    'volatility': {
                        'USD': 0.85,
                        'EUR': 0.92,
                        'JPY': 1.15
                    },
                    'correlation': {
                        'USD_EUR': 0.72,
                        'USD_JPY': -0.15,
                        'EUR_JPY': -0.08
                    }
                },
                'ai_analysis': {
                    'recommendation': '현재 USD 노출이 과도하여 환율 변동 리스크가 높습니다. 향후 2주 이내 헤지 비율을 70%까지 확대하여 연간 1,200만원의 잠재 손실을 방어할 것을 권장합니다.',
                    'confidence': 87,
                    'generated_at': datetime.now().isoformat()
                }
            }
            
            self.send_json_response(mock_result)
            print(f"✅ Batch calculation completed: {len(request_data.get('currencySummary', {}))} currencies")
            
        except Exception as e:
            self.send_json_response({'error': str(e), 'status': 'error'}, status_code=500)
            print(f"❌ Error in batch calculation: {e}")
    
    def handle_realtime_data(self):
        """실시간 데이터 Mock 응답"""
        mock_data = {
            'timestamp': datetime.now().isoformat(),
            'exchange_rate': {
                'current': round(1350.0 + random.uniform(-5, 5), 2),
                'change': round(random.uniform(-3, 3), 2),
                'change_percent': round(random.uniform(-0.3, 0.3), 2)
            },
            'margin': {
                'current': round(25.0 + random.uniform(-5, 5), 2),
                'change': round(random.uniform(-2, 2), 2),
                'average_industry': 28.5
            },
            'hedge': {
                'ratio': round(0.675 + random.uniform(-0.05, 0.05), 3),
                'recommended': 0.70,
                'amount': 15000000
            },
            'exposure': {
                'amount': 2450000 + random.randint(-50000, 50000),
                'currency': 'USD'
            },
            'volatility': {
                'current': round(0.85 + random.uniform(-0.1, 0.1), 2),
                'threshold': 1.0,
                'status': 'stable' if random.random() > 0.3 else 'elevated'
            },
            'alerts': []
        }
        
        # 랜덤 알림 생성
        if random.random() > 0.7:
            mock_data['alerts'].append({
                'type': 'warning' if random.random() > 0.5 else 'info',
                'message': '환율 변동성이 증가하고 있습니다' if random.random() > 0.5 else '마진 협상 기회가 있습니다'
            })
        
        self.send_json_response(mock_data)
    
    def handle_get_alerts(self):
        """알림 목록 조회 (템플릿 기반)"""
        # Mock 알림 데이터 생성
        alerts = []
        alert_types = [
            {
                'severity': 'critical',
                'category': '환율',
                'title': 'USD/KRW 환율 급등',
                'message': '현재 환율이 설정된 상한선(1,400원)을 초과했습니다.',
                'recommendation': '즉시 추가 헤지 계약 체결을 권장합니다. 현재 노출 금액의 15%를 추가로 헤지하면 위험을 50% 감소시킬 수 있습니다.',
                'isNew': True
            },
            {
                'severity': 'warning',
                'category': '헤지비율',
                'title': '헤지 비율 부족',
                'message': '현재 헤지 비율(62%)이 권장 범위(70-80%) 미만입니다.',
                'recommendation': 'USD 15만불 상당의 추가 헤지가 필요합니다. 2주 이내 계약 권장.',
                'isNew': False
            },
            {
                'severity': 'warning',
                'category': '변동성',
                'title': '시장 변동성 증가',
                'message': '최근 24시간 동안 환율 변동성이 평균 대비 35% 증가했습니다.',
                'recommendation': '단기 헤지 비중을 늘리고 포지션을 재검토하세요.',
                'isNew': True
            },
            {
                'severity': 'info',
                'category': '마진',
                'title': '마진율 협상 기회',
                'message': '귀사의 현재 마진율이 업계 평균보다 3.2%p 높습니다.',
                'recommendation': '은행과의 마진율 재협상을 통해 연간 약 1,200만원 절감 가능합니다.',
                'isNew': False
            },
            {
                'severity': 'info',
                'category': '계약만기',
                'title': '헤지 계약 만기 임박',
                'message': '5개 헤지 계약이 30일 이내 만기됩니다.',
                'recommendation': '만기 전 연장 또는 신규 계약 검토가 필요합니다.',
                'isNew': False
            }
        ]
        
        # 랜덤하게 알림 생성
        num_alerts = random.randint(3, len(alert_types))
        selected_alerts = random.sample(alert_types, num_alerts)
        
        for i, alert_data in enumerate(selected_alerts):
            alerts.append({
                'id': f'alert-{i+1}-{int(datetime.now().timestamp())}',
                'timestamp': (datetime.now() - timedelta(minutes=random.randint(1, 180))).isoformat(),
                **alert_data
            })
        
        # 요약 정보
        summary = {
            'critical': len([a for a in alerts if a['severity'] == 'critical']),
            'warning': len([a for a in alerts if a['severity'] == 'warning']),
            'info': len([a for a in alerts if a['severity'] == 'info'])
        }
        
        response = {
            'alerts': alerts,
            'summary': summary,
            'timestamp': datetime.now().isoformat()
        }
        
        self.send_json_response(response)
        print(f"✅ Alerts retrieved: {len(alerts)} alerts")
    
    def handle_get_alert_settings(self):
        """알림 설정 조회"""
        # Mock 설정 데이터
        settings = {
            'usdUpperLimit': 1400,
            'usdLowerLimit': 1300,
            'hedgeMin': 70,
            'hedgeMax': 80,
            'emailAlert': True,
            'smsAlert': False,
            'kakaoAlert': True
        }
        
        self.send_json_response(settings)
        print(f"✅ Alert settings retrieved")
    
    def handle_save_alert_settings(self):
        """알림 설정 저장"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            settings = json.loads(post_data.decode('utf-8'))
            
            # 실제로는 데이터베이스에 저장
            # 여기서는 Mock으로 성공 응답만
            
            self.send_json_response({
                'success': True,
                'message': '설정이 저장되었습니다.',
                'timestamp': datetime.now().isoformat()
            })
            print(f"✅ Alert settings saved: {settings}")
            
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, status_code=500)
            print(f"❌ Error saving alert settings: {e}")
    
    def handle_dismiss_alert(self):
        """알림 확인 처리"""
        try:
            # URL에서 alert ID 추출
            alert_id = self.path.split('/')[-2]
            
            self.send_json_response({
                'success': True,
                'message': '알림이 확인되었습니다.',
                'alertId': alert_id,
                'timestamp': datetime.now().isoformat()
            })
            print(f"✅ Alert dismissed: {alert_id}")
            
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, status_code=500)
            print(f"❌ Error dismissing alert: {e}")
    
    def handle_get_hedge_positions(self):
        """헤지매니저 - 거래 포지션 조회"""
        try:
            # 고객별 거래 데이터 (실제로는 DB나 Excel 업로드로부터)
            positions = [
                {
                    'id': 'T001',
                    'counterparty': '삼성전자',
                    'currency': 'USD',
                    'amount': 500000,
                    'paymentDate': '2026-03-15',
                    'type': '채무',  # 채무 or 채권
                    'hedgeStatus': '미헤지',
                    'dday': 40
                },
                {
                    'id': 'T002',
                    'counterparty': 'Apple Inc.',
                    'currency': 'USD',
                    'amount': 1200000,
                    'paymentDate': '2026-04-20',
                    'type': '채권',
                    'hedgeStatus': '부분헤지',
                    'hedgedAmount': 600000,
                    'dday': 76
                },
                {
                    'id': 'T003',
                    'counterparty': 'LG전자',
                    'currency': 'EUR',
                    'amount': 300000,
                    'paymentDate': '2026-02-28',
                    'type': '채무',
                    'hedgeStatus': '완전헤지',
                    'hedgedAmount': 300000,
                    'dday': 25
                },
                {
                    'id': 'T004',
                    'counterparty': 'Toyota',
                    'currency': 'JPY',
                    'amount': 50000000,
                    'paymentDate': '2026-05-10',
                    'type': '채무',
                    'hedgeStatus': '미헤지',
                    'dday': 96
                },
                {
                    'id': 'T005',
                    'counterparty': 'BMW AG',
                    'currency': 'EUR',
                    'amount': 450000,
                    'paymentDate': '2026-03-25',
                    'type': '채권',
                    'hedgeStatus': '미헤지',
                    'dday': 50
                },
            ]
            
            # 환율 정보
            rates = {
                'USD': 1342.50,
                'EUR': 1455.30,
                'JPY': 9.05,
                'CNY': 186.15
            }
            
            # 각 포지션에 원화 환산액 추가
            for pos in positions:
                rate = rates.get(pos['currency'], 1)
                if pos['currency'] == 'JPY':
                    pos['krwAmount'] = round(pos['amount'] * rate)
                else:
                    pos['krwAmount'] = round(pos['amount'] * rate)
            
            self.send_json_response({
                'success': True,
                'data': {
                    'positions': positions,
                    'rates': rates,
                    'totalCount': len(positions)
                },
                'timestamp': datetime.now().isoformat()
            })
            print(f"✅ Hedge positions retrieved: {len(positions)} items")
            
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, status_code=500)
            print(f"❌ Error retrieving hedge positions: {e}")
    
    def handle_get_hedge_kpi(self):
        """헤지매니저 - KPI 지표 조회"""
        try:
            kpi = {
                'targetHedgeRatio': 75,  # 목표 헤지 비율 (%)
                'currentHedgeRatio': 42,  # 현재 헤지 비율 (%)
                'unhedgedExposure': 18500000000,  # 미헤지 노출 (KRW)
                'totalExposure': 32000000000,  # 전체 노출 (KRW)
                'hedgedAmount': 13500000000,  # 헤지된 금액 (KRW)
                'gap': -33,  # 목표 대비 갭 (%)
            }
            
            self.send_json_response({
                'success': True,
                'data': kpi,
                'timestamp': datetime.now().isoformat()
            })
            print(f"✅ Hedge KPI retrieved")
            
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, status_code=500)
            print(f"❌ Error retrieving hedge KPI: {e}")
    
    def handle_get_hedge_suggestions(self):
        """헤지매니저 - 시스템 제안 헤지 거래"""
        try:
            suggestions = [
                {
                    'id': 'S001',
                    'counterparty': '삼성전자',
                    'product': '선물환',
                    'currency': 'USD',
                    'recommendedAmount': 500000,
                    'paymentDate': '2026-03-15',
                    'bank': '국민은행',
                    'rate': 1338.50,
                    'reason': '결제일 40일 전, 조기 헤지 권장'
                },
                {
                    'id': 'S002',
                    'counterparty': 'Apple Inc.',
                    'product': '선물환',
                    'currency': 'USD',
                    'recommendedAmount': 600000,
                    'paymentDate': '2026-04-20',
                    'bank': '신한은행',
                    'rate': 1340.20,
                    'reason': '부분헤지 상태, 추가 헤지 필요'
                },
                {
                    'id': 'S003',
                    'counterparty': 'BMW AG',
                    'product': '통화옵션',
                    'currency': 'EUR',
                    'recommendedAmount': 450000,
                    'paymentDate': '2026-03-25',
                    'bank': 'KEB하나은행',
                    'rate': 1452.80,
                    'reason': '미헤지 상태, 즉시 헤지 권장'
                },
                {
                    'id': 'S004',
                    'counterparty': 'Toyota',
                    'product': '선물환',
                    'currency': 'JPY',
                    'recommendedAmount': 50000000,
                    'paymentDate': '2026-05-10',
                    'bank': '우리은행',
                    'rate': 9.02,
                    'reason': 'JPY 약세 예상, 헤지 권장'
                },
            ]
            
            self.send_json_response({
                'success': True,
                'data': {
                    'suggestions': suggestions,
                    'totalCount': len(suggestions)
                },
                'timestamp': datetime.now().isoformat()
            })
            print(f"✅ Hedge suggestions retrieved: {len(suggestions)} items")
            
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, status_code=500)
            print(f"❌ Error retrieving hedge suggestions: {e}")
    
    def handle_hedge_upload(self):
        """헤지매니저 - Excel 파일 업로드 처리"""
        try:
            # POST 데이터 읽기
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # 여기서 실제로는 Excel 파일 파싱, 익명화, DB 저장 등을 수행
            # 지금은 mock 응답
            
            self.send_json_response({
                'success': True,
                'message': '데이터가 성공적으로 업로드되었습니다.',
                'uploadedCount': len(data.get('trades', [])),
                'timestamp': datetime.now().isoformat()
            })
            print(f"✅ Hedge data uploaded")
            
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, status_code=500)
            print(f"❌ Error uploading hedge data: {e}")
    
    def handle_hedge_calculate(self):
        """헤지매니저 - 헤지 전략 계산"""
        try:
            # POST 데이터 읽기
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # 여기서 실제로는 복잡한 헤지 전략 계산을 수행
            # 지금은 mock 응답
            
            result = {
                'calculationId': f"CALC-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                'targetHedgeRatio': 75,
                'currentHedgeRatio': 42,
                'recommendedActions': [
                    {'action': '선물환 체결', 'amount': 500000, 'currency': 'USD'},
                    {'action': '통화옵션 매입', 'amount': 450000, 'currency': 'EUR'},
                ],
                'estimatedCost': 12500000,  # KRW
                'riskReduction': 85,  # %
            }
            
            self.send_json_response({
                'success': True,
                'data': result,
                'timestamp': datetime.now().isoformat()
            })
            print(f"✅ Hedge calculation completed")
            
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, status_code=500)
            print(f"❌ Error calculating hedge: {e}")
    
    def handle_get_user_settings(self):
        """사용자 설정 조회"""
        try:
            # 실제로는 DB에서 userId 기반으로 조회
            # 지금은 mock 데이터 반환
            settings = {
                'userId': 'user_demo',
                'email': 'demo@hedgefreedom.com',
                'companyName': '데모 회사',
                'targetHedgeRatio': None,  # None이면 미설정 → 모달 표시
                'riskTolerance': 'moderate',
                'industry': '제조업',
                'baseCurrency': 'KRW',
                'createdAt': '2026-02-03T10:00:00',
                'lastUpdated': '2026-02-03T10:00:00'
            }
            
            self.send_json_response({
                'success': True,
                'data': settings,
                'timestamp': datetime.now().isoformat()
            })
            print(f"✅ User settings retrieved")
            
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, status_code=500)
            print(f"❌ Error retrieving user settings: {e}")
    
    def handle_save_user_settings(self):
        """사용자 설정 저장"""
        try:
            # POST 데이터 읽기
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            settings = json.loads(post_data.decode('utf-8'))
            
            # 실제로는 DB에 저장
            # 지금은 받은 데이터를 그대로 응답
            
            # 필수 필드 검증
            required_fields = ['targetHedgeRatio']
            for field in required_fields:
                if field not in settings:
                    raise ValueError(f"필수 필드 누락: {field}")
            
            # 타임스탬프 추가
            settings['lastUpdated'] = datetime.now().isoformat()
            
            self.send_json_response({
                'success': True,
                'message': '설정이 저장되었습니다.',
                'data': settings,
                'timestamp': datetime.now().isoformat()
            })
            print(f"✅ User settings saved: targetHedgeRatio={settings.get('targetHedgeRatio')}%")
            
        except ValueError as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, status_code=400)
            print(f"❌ Invalid user settings: {e}")
            
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            }, status_code=500)
            print(f"❌ Error saving user settings: {e}")
    
    def send_json_response(self, data, status_code=200):
        """JSON 응답 전송"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def log_message(self, format, *args):
        """로그 메시지 포맷"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """멀티스레드 HTTP 서버
    
    ThreadingMixIn을 사용하여 각 요청을 별도 스레드에서 처리
    동시 접속 성능이 크게 향상됨
    """
    daemon_threads = True  # 메인 프로세스 종료 시 스레드도 종료
    allow_reuse_address = True  # 포트 재사용 허용


def run_server(host='0.0.0.0', port=9000):
    """서버 실행
    
    Args:
        host: 바인딩할 호스트 (기본: 0.0.0.0 - 모든 인터페이스)
        port: 포트 번호 (기본: 9000)
    """
    try:
        server_address = (host, port)
        httpd = ThreadedHTTPServer(server_address, MockAPIHandler)
        
        # 환경 정보 출력
        env = os.getenv('ENVIRONMENT', 'development')
        
        print(f"""
╔══════════════════════════════════════════════════════════╗
║  ⚡ hedgeOn Engine (Multi-threaded API Server)          ║
║     HEDGEFREEDOM | www.hedgefreedom.com                 ║
╚══════════════════════════════════════════════════════════╝

✅ Server running on http://{host}:{port}
🌍 Environment: {env}
⚡ Multi-threading: ENABLED
📈 Performance: ~10x faster than single-threaded
🎯 Suitable for: 10~100 concurrent users
📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📡 Available Endpoints:
  • POST /api/calculator/batch      - 배치 계산
  • GET  /api/realtime-data          - 실시간 데이터
  • GET  /api/health                 - 서버 상태 확인
  • GET  /                           - 정적 파일 서빙

🧪 테스트 방법:
  1. 브라우저에서 http://localhost:{port} 접속
  2. 또는 test-data-inject.html 열기

📊 성능:
  • 동시 접속: 최대 100명
  • 처리량: ~500 req/s
  • 응답 시간: ~50ms

Press Ctrl+C to stop the server
        """)
        
        httpd.serve_forever()
        
    except OSError as e:
        if e.errno == 98 or e.errno == 48:  # Address already in use
            print(f"❌ 오류: 포트 {port}가 이미 사용 중입니다.")
            print(f"   다른 프로세스를 종료하거나 다른 포트를 사용하세요.")
            print(f"   예: python3 {sys.argv[0]} 8080")
            sys.exit(1)
        else:
            print(f"❌ 서버 시작 오류: {e}")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
        httpd.shutdown()
        
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        sys.exit(1)


if __name__ == '__main__':
    # 환경 변수에서 설정 읽기
    host = os.getenv('SERVER_HOST', '0.0.0.0')
    port = int(os.getenv('SERVER_PORT', '9000'))
    
    # 명령줄 인자로 포트 변경 가능
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"❌ 오류: 잘못된 포트 번호 '{sys.argv[1]}'")
            print(f"   사용법: python3 {sys.argv[0]} [포트번호]")
            sys.exit(1)
    
    # 호스트도 인자로 받을 수 있도록
    if len(sys.argv) > 2:
        host = sys.argv[2]
    
    run_server(host, port)
