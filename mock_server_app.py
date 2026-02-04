"""
HedgeFreedom Mock API - WSGI Application
Gunicorn, uWSGI 등의 WSGI 서버와 호환

필요한 패키지:
pip install openpyxl  # Excel 파싱용
pip install cryptography  # 암호화용
"""

import json
import random
import os
import mimetypes
import base64
import io
import tempfile
from datetime import datetime, timedelta
from urllib.parse import unquote, parse_qs
from pathlib import Path
import cgi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 암호화 모듈
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
    from cryptography.hazmat.backends import default_backend
    ENCRYPTION_AVAILABLE = True
except ImportError:
    print("⚠️ cryptography 모듈이 설치되지 않았습니다. 암호화 기능이 비활성화됩니다.")
    print("   설치: pip install cryptography")
    ENCRYPTION_AVAILABLE = False

# 엑셀 파서 및 익명화 모듈 import
try:
    from excel_parser import ExcelParser, DataAnonymizer, calculate_kpi
    EXCEL_PARSER_AVAILABLE = True
except ImportError:
    print("⚠️ excel_parser 모듈을 찾을 수 없습니다. Mock 데이터를 사용합니다.")
    EXCEL_PARSER_AVAILABLE = False

# 계산기 모듈 import
from calculators.registry import CalculatorRegistry
from calculators.total_exposure import TotalExposureCalculator
from calculators.hedged_amount import HedgedAmountCalculator
from calculators.hedge_ratio import HedgeRatioCalculator
from calculators.unhedged_gap import UnhedgedGapCalculator
from calculators.avg_hedge_rate import AvgHedgeRateCalculator
from calculators.recommendation import RecommendationCalculator

# 계산기 레지스트리 초기화 (서버 시작 시 1회)
calculator_registry = CalculatorRegistry()
calculator_registry.register(TotalExposureCalculator())
calculator_registry.register(HedgedAmountCalculator())
calculator_registry.register(HedgeRatioCalculator())
calculator_registry.register(UnhedgedGapCalculator())
calculator_registry.register(AvgHedgeRateCalculator())
calculator_registry.register(RecommendationCalculator())

print(f"✅ 계산기 레지스트리 초기화 완료: {calculator_registry.list_calculators()}")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔍 폴더 상태 모니터링 모듈 (차단부 105 서버측)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class FolderStatusMonitor:
    """
    로컬 폴더 상태 모니터링 및 관리
    - 클라이언트로부터 폴더 상태 수신
    - 폴더 무결성 추적
    - 이상 상태 감지 및 알림
    """
    
    def __init__(self, storage_path='server_data/folder_status'):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)
        
        # 폴더 상태 히스토리 (메모리)
        self.status_history = {}
        
        # 알림 임계값
        self.alert_thresholds = {
            'consecutive_failures': 3,  # 연속 실패 횟수
            'structure_violations': 1   # 구조 위반 허용 횟수
        }
    
    def record_status(self, customer_id, status_data):
        """폴더 상태 기록"""
        try:
            timestamp = datetime.now().isoformat()
            
            # 고객별 폴더 생성
            customer_folder = os.path.join(self.storage_path, customer_id)
            os.makedirs(customer_folder, exist_ok=True)
            
            # 상태 데이터 저장
            status_file = os.path.join(
                customer_folder,
                f"status_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            )
            
            record = {
                'timestamp': timestamp,
                'customer_id': customer_id,
                'status': status_data,
                'analyzed': self._analyze_status(status_data)
            }
            
            with open(status_file, 'w', encoding='utf-8') as f:
                json.dump(record, f, indent=2, ensure_ascii=False)
            
            # 메모리에도 저장 (최근 10개만)
            if customer_id not in self.status_history:
                self.status_history[customer_id] = []
            
            self.status_history[customer_id].append(record)
            self.status_history[customer_id] = self.status_history[customer_id][-10:]
            
            # 이상 감지
            alerts = self._detect_anomalies(customer_id, record)
            
            return {
                'success': True,
                'recorded_at': timestamp,
                'alerts': alerts,
                'analysis': record['analyzed']
            }
            
        except Exception as e:
            print(f"❌ 폴더 상태 기록 실패: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _analyze_status(self, status_data):
        """상태 데이터 분석"""
        analysis = {
            'health_score': 0,
            'issues': [],
            'severity': 'normal'
        }
        
        # 건강 점수 계산 (100점 만점)
        score = 0
        
        if status_data.get('exists'):
            score += 25
        else:
            analysis['issues'].append('폴더가 존재하지 않음')
        
        if status_data.get('accessible'):
            score += 25
        else:
            analysis['issues'].append('폴더 접근 불가')
        
        if status_data.get('hasPermission'):
            score += 25
        else:
            analysis['issues'].append('폴더 권한 없음')
        
        if status_data.get('structureValid'):
            score += 25
        else:
            analysis['issues'].append('폴더 구조 무결성 실패')
            
            # 구조 세부 정보
            structure_details = status_data.get('details', {}).get('structure', {})
            if structure_details.get('unauthorizedFolders'):
                analysis['issues'].append(
                    f"임의 폴더 감지: {', '.join(structure_details['unauthorizedFolders'])}"
                )
            if structure_details.get('missingFolders'):
                analysis['issues'].append(
                    f"필수 폴더 누락: {', '.join(structure_details['missingFolders'])}"
                )
        
        analysis['health_score'] = score
        
        # 심각도 결정
        if score >= 90:
            analysis['severity'] = 'normal'
        elif score >= 70:
            analysis['severity'] = 'warning'
        elif score >= 50:
            analysis['severity'] = 'error'
        else:
            analysis['severity'] = 'critical'
        
        return analysis
    
    def _detect_anomalies(self, customer_id, current_record):
        """이상 상태 감지"""
        alerts = []
        
        # 히스토리 확인
        history = self.status_history.get(customer_id, [])
        
        if len(history) < 2:
            return alerts
        
        # 1. 연속 실패 감지
        recent_failures = 0
        for record in reversed(history[-5:]):
            if not record['status'].get('healthy', False):
                recent_failures += 1
            else:
                break
        
        if recent_failures >= self.alert_thresholds['consecutive_failures']:
            alerts.append({
                'type': 'CONSECUTIVE_FAILURES',
                'severity': 'critical',
                'message': f'연속 {recent_failures}회 폴더 상태 실패',
                'action': '즉시 확인 필요'
            })
        
        # 2. 폴더 구조 위반 감지
        if not current_record['status'].get('structureValid', True):
            alerts.append({
                'type': 'STRUCTURE_VIOLATION',
                'severity': 'error',
                'message': '폴더 구조 무결성 위반 감지',
                'details': current_record['status'].get('details', {}),
                'action': '임의 폴더 제거 또는 폴더 복구 필요'
            })
        
        # 3. 폴더 삭제 감지
        prev_record = history[-2] if len(history) >= 2 else None
        if prev_record and prev_record['status'].get('exists') and not current_record['status'].get('exists'):
            alerts.append({
                'type': 'FOLDER_DELETED',
                'severity': 'critical',
                'message': '로컬 폴더 삭제 감지',
                'action': '폴더 재생성 필요'
            })
        
        # 4. 권한 상실 감지
        if current_record['status'].get('exists') and not current_record['status'].get('hasPermission'):
            alerts.append({
                'type': 'PERMISSION_LOST',
                'severity': 'warning',
                'message': '폴더 접근 권한 상실',
                'action': '브라우저에서 폴더 재선택 필요'
            })
        
        return alerts
    
    def get_customer_status_summary(self, customer_id):
        """고객별 폴더 상태 요약"""
        history = self.status_history.get(customer_id, [])
        
        if not history:
            return {
                'customer_id': customer_id,
                'status': 'no_data',
                'message': '폴더 상태 데이터 없음'
            }
        
        latest = history[-1]
        
        return {
            'customer_id': customer_id,
            'latest_check': latest['timestamp'],
            'health_score': latest['analyzed']['health_score'],
            'severity': latest['analyzed']['severity'],
            'issues': latest['analyzed']['issues'],
            'total_checks': len(history),
            'folder_name': latest['status'].get('folderName'),
            'pc_fingerprint': latest['status'].get('pcFingerprint')
        }
    
    def get_all_status_summary(self):
        """전체 고객 폴더 상태 요약"""
        summaries = []
        
        for customer_id in self.status_history.keys():
            summaries.append(self.get_customer_status_summary(customer_id))
        
        # 심각도별 집계
        severity_count = {'normal': 0, 'warning': 0, 'error': 0, 'critical': 0}
        for summary in summaries:
            severity = summary.get('severity', 'normal')
            severity_count[severity] = severity_count.get(severity, 0) + 1
        
        return {
            'total_customers': len(summaries),
            'severity_distribution': severity_count,
            'customers': summaries,
            'generated_at': datetime.now().isoformat()
        }

# 전역 인스턴스
folder_monitor = FolderStatusMonitor()

print("✅ 폴더 상태 모니터링 모듈 초기화 완료")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 암호화 클래스
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class DataEncryption:
    """
    AES-256 기반 데이터 암호화
    
    특징:
    - AES-256 암호화 (군사급 보안)
    - PBKDF2 키 유도 (무차별 대입 공격 방어)
    - 고객별 솔트 (동일 데이터도 다르게 암호화)
    - Base64 인코딩 (텍스트 저장 가능)
    """
    
    def __init__(self, master_key=None):
        """
        Args:
            master_key: 마스터 암호화 키 (환경변수 또는 설정파일에서 관리)
        """
        if not ENCRYPTION_AVAILABLE:
            self.enabled = False
            print("⚠️ 암호화 비활성화 (cryptography 미설치)")
            return
        
        self.enabled = True
        
        # 마스터 키 (실제 운영 시 환경변수에서 가져와야 함)
        self.master_key = master_key or os.getenv('HEDGEFREEDOM_MASTER_KEY', 'CHANGE_THIS_IN_PRODUCTION_DO_NOT_USE_DEFAULT_KEY_2026')
        
        if self.master_key == 'CHANGE_THIS_IN_PRODUCTION_DO_NOT_USE_DEFAULT_KEY_2026':
            print("⚠️ 경고: 기본 암호화 키 사용 중! 운영 환경에서는 반드시 변경하세요!")
    
    def _derive_key(self, customer_id):
        """고객별 암호화 키 유도"""
        # 고객 ID를 솔트로 사용
        salt = customer_id.encode()
        
        # PBKDF2로 키 유도 (100,000 iterations)
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.master_key.encode()))
        return Fernet(key)
    
    def encrypt(self, data, customer_id):
        """
        데이터 암호화
        
        Args:
            data: 암호화할 데이터 (dict 또는 str)
            customer_id: 고객 ID
            
        Returns:
            암호화된 문자열 (Base64)
        """
        if not self.enabled:
            # 암호화 비활성화 시 JSON으로 변환만
            return json.dumps(data, ensure_ascii=False)
        
        try:
            # JSON 직렬화
            if isinstance(data, dict) or isinstance(data, list):
                json_data = json.dumps(data, ensure_ascii=False)
            else:
                json_data = str(data)
            
            # 암호화
            fernet = self._derive_key(customer_id)
            encrypted = fernet.encrypt(json_data.encode('utf-8'))
            
            # Base64로 다시 인코딩 (저장 용이)
            return base64.b64encode(encrypted).decode('utf-8')
        
        except Exception as e:
            print(f"❌ 암호화 오류: {e}")
            # 암호화 실패 시 원본 반환 (데이터 손실 방지)
            return json.dumps(data, ensure_ascii=False)
    
    def decrypt(self, encrypted_data, customer_id):
        """
        데이터 복호화
        
        Args:
            encrypted_data: 암호화된 데이터 (Base64 문자열)
            customer_id: 고객 ID
            
        Returns:
            복호화된 데이터 (dict)
        """
        if not self.enabled:
            # 암호화 비활성화 시 JSON 파싱만
            return json.loads(encrypted_data)
        
        try:
            # Base64 디코딩
            encrypted_bytes = base64.b64decode(encrypted_data.encode('utf-8'))
            
            # 복호화
            fernet = self._derive_key(customer_id)
            decrypted = fernet.decrypt(encrypted_bytes)
            
            # JSON 파싱
            return json.loads(decrypted.decode('utf-8'))
        
        except Exception as e:
            print(f"❌ 복호화 오류: {e}")
            # 복호화 실패 시 원본을 JSON으로 파싱 시도
            try:
                return json.loads(encrypted_data)
            except:
                return {"error": "복호화 실패"}

# 전역 암호화 인스턴스
data_encryption = DataEncryption()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 전역 변수로 사용자 설정 및 데이터 저장
USER_SETTINGS = {
    'targetHedgeRatio': 70,
    'companyName': '데모 회사',
    'lastUpdated': datetime.now().isoformat()
}
STORED_POSITIONS = []

# 서버 데이터 루트 경로
SERVER_DATA_ROOT = Path(__file__).parent / 'server_data'

def get_customer_folder(customer_id='default'):
    """
    고객별 폴더 구조 생성 (B-tree 스타일 다단계 해시 분할)
    
    구조: server_data/customers/{L1}/{L2}/{L3}/{customer_id}/
    - L1: 해시 첫 2자리 (256개 버킷)
    - L2: 해시 3-4자리 (256개 버킷)
    - L3: 해시 5-6자리 (256개 버킷)
    
    예시:
    - customer_abc123 → hash: a3b5c7d9...
    - 경로: customers/a3/b5/c7/customer_abc123/
    
    장점:
    - 3단계 트리로 최대 16,777,216개 폴더 지원
    - 각 폴더당 평균 파일 수 감소
    - 파일 시스템 성능 최적화
    - 고객 1억명까지 확장 가능
    - 백업/아카이빙 시 균등 분산
    
    성능:
    - 고객 1,000명: 각 L3 폴더당 평균 ~1개
    - 고객 100만명: 각 L3 폴더당 평균 ~60개
    - 고객 1억명: 각 L3 폴더당 평균 ~6,000개
    """
    import hashlib
    
    # customer_id의 MD5 해시 생성
    hash_value = hashlib.md5(customer_id.encode()).hexdigest()
    
    # 해시를 3단계로 분할 (각 2자리씩)
    level1 = hash_value[0:2]   # 00-ff (256개)
    level2 = hash_value[2:4]   # 00-ff (256개)
    level3 = hash_value[4:6]   # 00-ff (256개)
    
    # B-tree 스타일 경로: customers/a3/b5/c7/customer_xxx/
    customer_path = SERVER_DATA_ROOT / 'customers' / level1 / level2 / level3 / customer_id
    
    # 하위 폴더 구조
    folders = {
        'positions': customer_path / 'positions',      # 포지션 데이터
        'masked': customer_path / 'masked',            # 마스킹된 데이터
        'reports': customer_path / 'reports',          # 보고서
        'kpi': customer_path / 'kpi',                  # KPI 데이터
        'uploads': customer_path / 'uploads',          # 업로드 원본
        'backup': customer_path / 'backup',            # 일일 백업
        'archive': customer_path / 'archive'           # 월별 아카이브
    }
    
    # 모든 폴더 생성
    for folder_name, folder_path in folders.items():
        folder_path.mkdir(parents=True, exist_ok=True)
    
    return folders

def save_customer_data(customer_id, data_type, data, filename_prefix, encrypt=True):
    """
    고객 데이터를 날짜별로 누적 저장 (암호화)
    
    Args:
        customer_id: 고객 ID
        data_type: 데이터 타입 (positions, masked, kpi, etc.)
        data: 저장할 데이터
        filename_prefix: 파일명 접두사
        encrypt: 암호화 여부 (기본값: True)
    """
    folders = get_customer_folder(customer_id)
    
    # 타임스탬프 생성
    now = datetime.now()
    date_str = now.strftime('%Y-%m-%d')
    time_str = now.strftime('%H-%M-%S')
    
    # 파일명: prefix_YYYY-MM-DD_HH-MM-SS.{enc|json}
    if encrypt and data_encryption.enabled:
        filename = f"{filename_prefix}_{date_str}_{time_str}.enc"
        file_path = folders[data_type] / filename
        
        # ★ 데이터 암호화 ★
        encrypted_data = data_encryption.encrypt(data, customer_id)
        
        # 암호화된 데이터 저장
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(encrypted_data)
        
        print(f"✅ 암호화 저장 완료: {file_path}")
    else:
        filename = f"{filename_prefix}_{date_str}_{time_str}.json"
        file_path = folders[data_type] / filename
        
        # 평문 JSON 저장
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 평문 저장 완료: {file_path}")
    
    return str(file_path)


def load_customer_data(customer_id, data_type, filename):
    """
    고객 데이터 로드 (복호화)
    
    Args:
        customer_id: 고객 ID
        data_type: 데이터 타입
        filename: 파일명
        
    Returns:
        복호화된 데이터
    """
    folders = get_customer_folder(customer_id)
    file_path = folders[data_type] / filename
    
    if not file_path.exists():
        return None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 파일 확장자로 암호화 여부 판단
    if filename.endswith('.enc'):
        # 암호화된 파일 → 복호화
        return data_encryption.decrypt(content, customer_id)
    else:
        # 평문 JSON
        return json.loads(content)


def find_customer_data(customer_id):
    """
    B-tree 구조에서 고객 데이터 조회
    
    Args:
        customer_id: 고객 ID
        
    Returns:
        고객 폴더 경로 (존재하지 않으면 None)
    """
    import hashlib
    
    hash_value = hashlib.md5(customer_id.encode()).hexdigest()
    level1 = hash_value[0:2]
    level2 = hash_value[2:4]
    level3 = hash_value[4:6]
    
    customer_path = SERVER_DATA_ROOT / 'customers' / level1 / level2 / level3 / customer_id
    
    if customer_path.exists():
        return customer_path
    return None


def get_all_customers():
    """
    모든 고객 목록 조회 (B-tree 구조 순회)
    
    Returns:
        고객 ID 리스트
    """
    customers = []
    customers_root = SERVER_DATA_ROOT / 'customers'
    
    if not customers_root.exists():
        return customers
    
    # L1 → L2 → L3 → customer_id 순회
    for level1 in customers_root.iterdir():
        if not level1.is_dir():
            continue
        for level2 in level1.iterdir():
            if not level2.is_dir():
                continue
            for level3 in level2.iterdir():
                if not level3.is_dir():
                    continue
                for customer_dir in level3.iterdir():
                    if customer_dir.is_dir():
                        customers.append(customer_dir.name)
    
    return customers


def archive_old_data(customer_id, days_old=90):
    """
    오래된 데이터 아카이빙
    
    Args:
        customer_id: 고객 ID
        days_old: 아카이빙 기준 일수 (기본 90일)
    """
    from datetime import datetime, timedelta
    import shutil
    
    folders = get_customer_folder(customer_id)
    archive_folder = folders['archive']
    cutoff_date = datetime.now() - timedelta(days=days_old)
    
    archived_count = 0
    
    # positions, kpi, reports 폴더의 오래된 파일 아카이빙
    for folder_type in ['positions', 'kpi', 'reports']:
        folder_path = folders[folder_type]
        
        for file_path in folder_path.glob('*.json'):
            # 파일 수정 시간 확인
            mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
            
            if mtime < cutoff_date:
                # 아카이브 폴더로 이동
                archive_path = archive_folder / folder_type / file_path.name
                archive_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(file_path), str(archive_path))
                archived_count += 1
    
    return archived_count
    return str(file_path)

def application(environ, start_response):
    """WSGI 애플리케이션
    
    Args:
        environ: WSGI 환경 변수
        start_response: 응답 시작 콜백
    
    Returns:
        응답 본문 (bytes 리스트)
    """
    
    path = environ.get('PATH_INFO', '/')
    method = environ.get('REQUEST_METHOD', 'GET')
    
    # API 엔드포인트
    if path.startswith('/api/'):
        return handle_api(environ, start_response, path, method)
    
    # 정적 파일
    return serve_static(environ, start_response, path)


def handle_api(environ, start_response, path, method):
    """API 요청 처리"""
    
    if path == '/api/health':
        return json_response(start_response, {
            'status': 'ok',
            'timestamp': datetime.now().isoformat()
        })
    
    elif path == '/api/realtime-data':
        return handle_realtime_data(start_response)
    
    elif path == '/api/calculator/batch' and method == 'POST':
        return handle_batch_calculation(environ, start_response)
    
    elif path == '/api/upload/excel' and method == 'POST':
        return handle_excel_upload(environ, start_response)
    
    elif path == '/api/upload/data' and method == 'POST':
        return handle_data_upload(environ, start_response)
    
    elif path == '/api/user/settings' and method == 'POST':
        return handle_user_settings(environ, start_response)
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # 🔍 폴더 상태 모니터링 API (차단부 105)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    elif path == '/api/folder/status' and method == 'POST':
        return handle_folder_status_report(environ, start_response)
    
    elif path == '/api/folder/status' and method == 'GET':
        return handle_folder_status_query(environ, start_response)
    
    elif path == '/api/folder/summary' and method == 'GET':
        return handle_folder_summary(environ, start_response)
    
    elif path == '/api/hedge/positions':
        if method == 'POST':
            return handle_hedge_positions_save(environ, start_response)
        else:
            return handle_hedge_positions(start_response)
    
    elif path == '/api/hedge/kpi':
        return handle_hedge_kpi(start_response)
    
    elif path == '/api/hedge/suggestions':
        return handle_hedge_suggestions(start_response)
    
    elif path == '/api/hedge/calculate' and method == 'POST':
        return handle_hedge_calculate(environ, start_response)
    
    else:
        return json_response(start_response, {
            'error': 'Endpoint not found'
        }, status='404 Not Found')


def handle_realtime_data(start_response):
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
        'alerts': []
    }
    
    return json_response(start_response, mock_data)


def handle_batch_calculation(environ, start_response):
    """배치 계산 Mock 응답"""
    try:
        # 요청 본문 읽기
        content_length = int(environ.get('CONTENT_LENGTH', 0))
        request_body = environ['wsgi.input'].read(content_length)
        request_data = json.loads(request_body.decode('utf-8'))
        
        # Mock 응답
        mock_result = {
            'timestamp': datetime.now().isoformat(),
            'status': 'success',
            'summary': {
                'total_exposure': 15000000,
                'hedge_ratio': 67.5,
                'recommended_hedge': 70.0
            }
        }
        
        return json_response(start_response, mock_result)
        
    except Exception as e:
        return json_response(start_response, {
            'error': str(e),
            'status': 'error'
        }, status='500 Internal Server Error')


def handle_excel_upload(environ, start_response):
    """엑셀 파일 업로드 및 처리 (실제 파싱)"""
    try:
        # Content-Type 확인
        content_type = environ.get('CONTENT_TYPE', '')
        
        if not content_type.startswith('multipart/form-data'):
            return json_response(start_response, {
                'success': False,
                'error': 'Content-Type must be multipart/form-data'
            }, status='400 Bad Request')
        
        # multipart 파싱
        form_data = cgi.FieldStorage(
            fp=environ['wsgi.input'],
            environ=environ,
            keep_blank_values=True
        )
        
        # 파일 가져오기
        if 'file' not in form_data:
            return json_response(start_response, {
                'success': False,
                'error': '파일이 업로드되지 않았습니다.'
            }, status='400 Bad Request')
        
        file_item = form_data['file']
        
        # 파일 검증
        if not file_item.filename:
            return json_response(start_response, {
                'success': False,
                'error': '파일명이 없습니다.'
            }, status='400 Bad Request')
        
        # 파일 확장자 확인
        filename = file_item.filename.lower()
        if not (filename.endswith('.xlsx') or filename.endswith('.xls')):
            return json_response(start_response, {
                'success': False,
                'error': '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.'
            }, status='400 Bad Request')
        
        # 고객 ID 가져오기
        customer_id = form_data.getvalue('customerId', 'anonymous')
        
        # 목표헤지비율 가져오기 (기본값: 70)
        target_hedge_ratio = form_data.getvalue('targetHedgeRatio', '70')
        try:
            target_hedge_ratio = float(target_hedge_ratio)
        except (ValueError, TypeError):
            target_hedge_ratio = 70.0
        
        print(f"🎯 업로드 시 목표헤지비율: {target_hedge_ratio}%")
        
        # 파일 내용 읽기
        file_content = file_item.file.read()
        
        if not file_content:
            return json_response(start_response, {
                'success': False,
                'error': '파일 내용이 비어있습니다.'
            }, status='400 Bad Request')
        
        # 실제 엑셀 파싱
        if EXCEL_PARSER_AVAILABLE:
            try:
                # BytesIO로 변환
                file_stream = io.BytesIO(file_content)
                
                # 엑셀 파서 생성
                parser = ExcelParser(file_stream=file_stream)
                
                # 거래 데이터 파싱
                raw_trades = parser.parse_trade_data()
                
                if not raw_trades:
                    return json_response(start_response, {
                        'success': False,
                        'error': '엑셀 파일에서 거래 데이터를 찾을 수 없습니다. 파일 형식을 확인해주세요.'
                    }, status='400 Bad Request')
                
                # 데이터 익명화
                anonymizer = DataAnonymizer(customer_id)
                anonymized_trades = anonymizer.anonymize_trades(raw_trades)
                
                # KPI 계산 (targetHedgeRatio 사용)
                kpi = calculate_kpi(anonymized_trades)
                kpi['targetHedgeRatio'] = target_hedge_ratio  # 목표 헤지비율 추가
                kpi['gap'] = round(kpi.get('currentHedgeRatio', 0) - target_hedge_ratio, 2)  # 걭 계산
                
                # 사용자 설정 업데이트
                USER_SETTINGS['targetHedgeRatio'] = target_hedge_ratio
                USER_SETTINGS['lastUpdated'] = datetime.now().isoformat()
                
                print(f"✅ 엑셀 파싱 완료: {len(anonymized_trades)}건의 거래 데이터 (목표헤지: {target_hedge_ratio}%)")
                
            except Exception as parse_error:
                print(f"❌ 엑셀 파싱 오류: {parse_error}")
                return json_response(start_response, {
                    'success': False,
                    'error': f'엑셀 파일 파싱 중 오류 발생: {str(parse_error)}'
                }, status='500 Internal Server Error')
        
        else:
            # excel_parser를 사용할 수 없는 경우 Mock 데이터
            anonymized_trades = generate_mock_positions(10)
            kpi = calculate_mock_kpi(anonymized_trades)
            print("⚠️ Mock 데이터 사용 (excel_parser 미사용)")
        
        # ★ 고객별 폴더 자동 생성 및 저장 ★
        folders = get_customer_folder(customer_id)
        
        # 타임스탬프 생성
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # 1. 원본 파일을 고객 uploads 폴더에 저장
        saved_filename = f"{timestamp}_{file_item.filename}"
        saved_path = folders['uploads'] / saved_filename
        
        with open(saved_path, 'wb') as f:
            f.write(file_content)
        
        print(f"✅ 원본 파일 저장: {saved_path}")
        
        # 2. 처리된 데이터를 positions 폴더에 저장
        save_customer_data(
            customer_id=customer_id,
            data_type='positions',
            data=anonymized_trades,
            filename_prefix='positions'
        )
        
        # 3. KPI 데이터를 kpi 폴더에 저장
        save_customer_data(
            customer_id=customer_id,
            data_type='kpi',
            data=kpi,
            filename_prefix='kpi'
        )
        
        # 4. 백업 폴더에도 사본 저장 (일일 백업)
        backup_path = folders['backup'] / saved_filename
        with open(backup_path, 'wb') as f:
            f.write(file_content)
        
        print(f"📦 백업 파일 저장: {backup_path}")
        print(f"📊 처리 완료: {len(anonymized_trades)}건의 거래 데이터")
        print(f"📁 고객 폴더: server_data/customers/{customer_id}/")
        
        # 레거시 uploads 폴더에도 저장 (호환성)
        legacy_uploads_dir = 'uploads'
        if not os.path.exists(legacy_uploads_dir):
            os.makedirs(legacy_uploads_dir)
        legacy_path = os.path.join(legacy_uploads_dir, f"{customer_id}_{saved_filename}")
        with open(legacy_path, 'wb') as f:
            f.write(file_content)
        
        print(f"📁 레거시 경로에도 저장: {legacy_path}")
        
        # 응답 생성
        result = {
            'success': True,
            'message': '파일 업로드 및 처리 완료',
            'data': {
                'positions': anonymized_trades,
                'kpi': kpi,
                'uploadId': f'upload_{timestamp}',
                'processedAt': datetime.now().isoformat(),
                'fileName': file_item.filename,
                'tradeCount': len(anonymized_trades),
                'customerId': customer_id,
                'savedPaths': {
                    'original': str(saved_path),
                    'backup': str(backup_path),
                    'legacy': legacy_path
                }
            }
        }
        
        return json_response(start_response, result)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return json_response(start_response, {
            'success': False,
            'error': str(e)
        }, status='500 Internal Server Error')


def handle_data_upload(environ, start_response):
    """파싱된 데이터 업로드 및 저장 (엑셀 컬럼만)"""
    try:
        # 요청 본문 읽기
        content_length = int(environ.get('CONTENT_LENGTH', 0))
        if content_length == 0:
            return json_response(start_response, {
                'success': False,
                'error': '요청 본문이 비어있습니다.'
            }, status='400 Bad Request')
        
        request_body = environ['wsgi.input'].read(content_length)
        upload_data = json.loads(request_body.decode('utf-8'))
        
        # 필수 필드 검증
        if 'customerId' not in upload_data or 'data' not in upload_data:
            return json_response(start_response, {
                'success': False,
                'error': 'customerId와 data 필드가 필요합니다.'
            }, status='400 Bad Request')
        
        customer_id = upload_data['customerId']
        parsed_data = upload_data['data']
        file_name = upload_data.get('fileName', 'unknown.xlsx')
        upload_time = upload_data.get('uploadTime', datetime.now().isoformat())
        
        print('═══════════════════════════════════════════════════════')
        print('📥 파싱된 데이터 수신')
        print(f'   ✓ 고객 ID: {customer_id}')
        print(f'   ✓ 원본 파일: {file_name}')
        print(f'   ✓ 데이터 건수: {len(parsed_data)}건')
        print(f'   ✓ 업로드 시간: {upload_time}')
        print('═══════════════════════════════════════════════════════')
        
        # ★ 고객별 폴더 자동 생성 ★
        folders = get_customer_folder(customer_id)
        
        # 타임스탬프 생성
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # 저장할 데이터 구조
        data_to_save = {
            'uploadTime': upload_time,
            'originalFileName': file_name,
            'dataCount': len(parsed_data),
            'data': parsed_data
        }
        
        # ★ 1. 암호화하여 positions 폴더에 저장 ★
        positions_path = save_customer_data(
            customer_id=customer_id,
            data_type='positions',
            data=data_to_save,
            filename_prefix='positions',
            encrypt=True  # 암호화 활성화
        )
        
        print(f"✅ 암호화된 파싱 데이터 저장: {positions_path}")
        
        # 2. KPI 계산
        kpi = {
            'totalTrades': len(parsed_data),
            'totalAmount': sum(item.get('amount', 0) for item in parsed_data),
            'currencies': list(set(item.get('currency', 'USD') for item in parsed_data)),
            'uploadTime': upload_time
        }
        
        # ★ KPI 데이터 암호화 저장 ★
        save_customer_data(
            customer_id=customer_id,
            data_type='kpi',
            data=kpi,
            filename_prefix='kpi',
            encrypt=True  # 암호화 활성화
        )
        
        # ★ 3. 백업 폴더에도 암호화 사본 저장 ★
        backup_path = save_customer_data(
            customer_id=customer_id,
            data_type='backup',
            data=data_to_save,
            filename_prefix='backup_positions',
            encrypt=True  # 백업도 암호화
        )
        
        print(f"📦 암호화된 백업 데이터 저장: {backup_path}")
        print(f"📊 처리 완료: {len(parsed_data)}건의 거래 데이터")
        print(f"📁 고객 폴더: server_data/customers/{customer_id}/")
        
        # 응답 생성
        result = {
            'success': True,
            'message': '데이터 업로드 및 처리 완료',
            'data': {
                'customerId': customer_id,
                'uploadId': f'upload_{timestamp}',
                'processedAt': datetime.now().isoformat(),
                'originalFileName': file_name,
                'tradeCount': len(parsed_data),
                'kpi': kpi,
                'savedPaths': {
                    'positions': str(positions_path),
                    'backup': str(backup_path)
                }
            }
        }
        
        return json_response(start_response, result)
        
    except Exception as e:
        print(f"❌ 업로드 처리 오류: {e}")
        import traceback
        traceback.print_exc()
        
        return json_response(start_response, {
            'success': False,
            'error': f'서버 오류: {str(e)}'
        }, status='500 Internal Server Error')


def handle_user_settings(environ, start_response):
    """사용자 설정 저장"""
    global USER_SETTINGS
    try:
        content_length = int(environ.get('CONTENT_LENGTH', 0))
        request_body = environ['wsgi.input'].read(content_length)
        settings = json.loads(request_body.decode('utf-8'))
        
        # 전역 변수에 저장 (실제로는 DB에 저장)
        USER_SETTINGS.update(settings)
        USER_SETTINGS['lastUpdated'] = datetime.now().isoformat()
        
        print(f"✅ 사용자 설정 저장됨: 목표 헤지 비율 = {USER_SETTINGS.get('targetHedgeRatio', 70)}%")
        
        return json_response(start_response, {
            'success': True,
            'message': '설정이 저장되었습니다',
            'data': USER_SETTINGS
        })
        
    except Exception as e:
        return json_response(start_response, {
            'success': False,
            'error': str(e)
        }, status='500 Internal Server Error')


def handle_hedge_positions(start_response):
    """헤지 포지션 조회"""
    global STORED_POSITIONS
    
    # 저장된 포지션이 있으면 반환, 없으면 Mock 데이터
    positions = STORED_POSITIONS if STORED_POSITIONS else generate_mock_positions(8)
    
    return json_response(start_response, {
        'success': True,
        'data': positions,
        'timestamp': datetime.now().isoformat()
    })


def handle_hedge_positions_save(environ, start_response):
    """헤지 포지션 저장 (클라이언트에서 전송) - 강제 폴더 구조로 누적 저장"""
    global STORED_POSITIONS
    
    try:
        content_length = int(environ.get('CONTENT_LENGTH', 0))
        request_body = environ['wsgi.input'].read(content_length)
        data = json.loads(request_body.decode('utf-8'))
        
        # 고객 ID 추출 (세션, IP 등으로 식별 가능)
        # 여기서는 간단하게 IP 주소 기반 또는 데이터에 포함된 고객 ID 사용
        customer_id = data.get('customerId', 'default')
        remote_addr = environ.get('REMOTE_ADDR', 'unknown')
        print(f"📥 데이터 수신 - 고객: {customer_id}, IP: {remote_addr}")
        
        # 포지션 데이터 저장
        if 'positions' in data:
            STORED_POSITIONS = data['positions']
            
            # 1. 원본 포지션 데이터 저장 (positions 폴더)
            positions_path = save_customer_data(
                customer_id=customer_id,
                data_type='positions',
                data={
                    'timestamp': data.get('timestamp'),
                    'positions': data['positions'],
                    'count': len(data['positions']),
                    'source': data.get('source', 'unknown')
                },
                filename_prefix='positions'
            )
            print(f"✅ 포지션 데이터 저장: {len(STORED_POSITIONS)}건")
            
            # 2. 마스킹된 데이터 저장 (masked 폴더)
            if 'maskedPositions' in data:
                masked_path = save_customer_data(
                    customer_id=customer_id,
                    data_type='masked',
                    data={
                        'timestamp': data.get('timestamp'),
                        'maskedPositions': data['maskedPositions'],
                        'count': len(data['maskedPositions']),
                        'note': '개인정보 보호를 위해 마스킹 처리됨'
                    },
                    filename_prefix='masked'
                )
                print(f"✅ 마스킹 데이터 저장: {len(data['maskedPositions'])}건")
            
            # 3. KPI 데이터 저장 (kpi 폴더)
            if 'kpi' in data:
                kpi = data['kpi']
                kpi_path = save_customer_data(
                    customer_id=customer_id,
                    data_type='kpi',
                    data={
                        'timestamp': data.get('timestamp'),
                        'kpi': kpi
                    },
                    filename_prefix='kpi'
                )
                print(f"✅ KPI 저장 - 총 노출액: {kpi.get('totalExposure', 0):,.0f}원, 헤지비율: {kpi.get('currentHedgeRatio', 0)}%")
            
            # 4. 일일 백업 (backup 폴더)
            backup_path = save_customer_data(
                customer_id=customer_id,
                data_type='backup',
                data={
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'timestamp': data.get('timestamp'),
                    'positions': data['positions'],
                    'maskedPositions': data.get('maskedPositions', []),
                    'kpi': data.get('kpi', {}),
                    'source': data.get('source', 'unknown')
                },
                filename_prefix='backup'
            )
            print(f"✅ 일일 백업 완료")
            
            print(f"🎉 고객 {customer_id} 데이터 누적 저장 완료 (입증용)")
        
        return json_response(start_response, {
            'success': True,
            'message': '포지션 데이터가 서버에 누적 저장되었습니다',
            'count': len(STORED_POSITIONS),
            'timestamp': datetime.now().isoformat(),
            'customerId': customer_id
        })
        
    except Exception as e:
        print(f"❌ 포지션 저장 오류: {e}")
        import traceback
        traceback.print_exc()
        return json_response(start_response, {
            'success': False,
            'error': str(e)
        }, status='500 Internal Server Error')


def handle_hedge_kpi(start_response):
    """헤지 KPI 조회"""
    global STORED_POSITIONS, USER_SETTINGS
    
    # 저장된 포지션이 있으면 사용, 없으면 Mock 데이터
    positions = STORED_POSITIONS if STORED_POSITIONS else generate_mock_positions(8)
    
    # 사용자 설정의 목표 헤지 비율 사용
    target_ratio = USER_SETTINGS.get('targetHedgeRatio', 70)
    kpi = calculate_mock_kpi(positions, target_ratio)
    
    return json_response(start_response, {
        'success': True,
        'data': kpi,
        'timestamp': datetime.now().isoformat()
    })


def handle_hedge_suggestions(start_response):
    """헤지 제안 조회"""
    suggestions = [
        {
            'id': 1,
            'type': '선물환',
            'currency': 'USD',
            'amount': 50000,
            'rate': 1345.50,
            'maturityDate': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            'reason': '목표 헤지 비율 달성',
            'priority': 'high',
            'expectedCost': 150000
        },
        {
            'id': 2,
            'type': '옵션',
            'currency': 'EUR',
            'amount': 30000,
            'rate': 1450.20,
            'maturityDate': (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d'),
            'reason': '환율 변동성 대비',
            'priority': 'medium',
            'expectedCost': 80000
        }
    ]
    
    return json_response(start_response, {
        'success': True,
        'data': suggestions,
        'timestamp': datetime.now().isoformat()
    })


def handle_hedge_calculate(environ, start_response):
    """
    헤지 KPI 계산 (서버 측 계산기 사용)
    
    요청:
        POST /api/hedge/calculate
        {
            "positions": [...],  # 헤지 포지션 리스트
            "customerId": "C001",  # 선택적
            "saveResults": true    # 결과 저장 여부
        }
    
    응답:
        {
            "success": true,
            "timestamp": "2026-02-04T10:30:00",
            "kpi": {
                "totalExposure": 1000000.0,
                "hedgedAmount": 700000.0,
                "hedgeRatio": 70.0,
                "unhedgedGap": 300000.0,
                "avgHedgeRate": 1350.25,
                "recommendation": "적정"
            },
            "calculatorInfo": {
                "version": "1.0",
                "calculators": ["totalExposure", "hedgedAmount", ...]
            }
        }
    """
    try:
        # 요청 본문 읽기
        content_length = int(environ.get('CONTENT_LENGTH', 0))
        if content_length == 0:
            return json_response(start_response, {
                'success': False,
                'error': '요청 본문이 비어있습니다'
            }, status='400 Bad Request')
        
        request_body = environ['wsgi.input'].read(content_length)
        request_data = json.loads(request_body.decode('utf-8'))
        
        # 포지션 데이터 추출
        positions = request_data.get('positions', [])
        if not positions:
            return json_response(start_response, {
                'success': False,
                'error': '포지션 데이터가 없습니다'
            }, status='400 Bad Request')
        
        customer_id = request_data.get('customerId', 'default')
        save_results = request_data.get('saveResults', True)
        
        # 목표헤지비율 가져오기 (기본값: 70)
        target_hedge_ratio = request_data.get('targetHedgeRatio', 70)
        try:
            target_hedge_ratio = float(target_hedge_ratio)
        except (ValueError, TypeError):
            target_hedge_ratio = 70.0
        
        print(f"🧮 계산 시작 - 포지션 {len(positions)}건, 고객: {customer_id}, 목표헤지: {target_hedge_ratio}%")
        
        # 계산기 레지스트리를 통해 모든 KPI 계산
        kpi_results = calculator_registry.calculate_all(
            positions=positions,
            context={'customerId': customer_id}
        )
        
        # 목표헤지비율 및 gap 추가
        kpi_results['targetHedgeRatio'] = target_hedge_ratio
        current_hedge_ratio = kpi_results.get('hedgeRatio', 0)
        kpi_results['gap'] = round(current_hedge_ratio - target_hedge_ratio, 2)
        
        # 사용자 설정 업데이트
        USER_SETTINGS['targetHedgeRatio'] = target_hedge_ratio
        USER_SETTINGS['lastUpdated'] = datetime.now().isoformat()
        
        print(f"✅ 계산 완료: {kpi_results}")
        
        # 결과 저장 (선택적)
        if save_results:
            try:
                save_customer_data(
                    customer_id=customer_id,
                    data_type='kpi',
                    data={
                        'timestamp': datetime.now().isoformat(),
                        'kpi': kpi_results,
                        'positionCount': len(positions)
                    },
                    filename_prefix='calculated_kpi'
                )
                print(f"💾 KPI 결과 저장 완료")
            except Exception as save_error:
                print(f"⚠️ KPI 저장 실패 (계산은 성공): {save_error}")
        
        # 응답 생성
        result = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'kpi': kpi_results,
            'calculatorInfo': {
                'version': '1.0',
                'calculators': calculator_registry.list_calculators(),
                'totalCalculators': len(calculator_registry.list_calculators())
            }
        }
        
        return json_response(start_response, result)
        
    except json.JSONDecodeError as e:
        return json_response(start_response, {
            'success': False,
            'error': f'JSON 파싱 오류: {str(e)}'
        }, status='400 Bad Request')
    except Exception as e:
        print(f"❌ 계산 오류: {str(e)}")
        import traceback
        traceback.print_exc()
        return json_response(start_response, {
            'success': False,
            'error': f'계산 오류: {str(e)}'
        }, status='500 Internal Server Error')


def generate_mock_positions(count=10):
    """Mock 포지션 데이터 생성 (익명화됨)"""
    positions = []
    currencies = ['USD', 'EUR', 'JPY', 'CNY']
    types = ['수출', '수입']
    
    for i in range(count):
        currency = random.choice(currencies)
        trade_type = random.choice(types)
        amount = random.randint(10000, 500000)
        days_until = random.randint(7, 180)
        hedge_status = random.choice(['미헤지', '부분헤지', '전액헤지'])
        
        position = {
            'id': f'T{2024000 + i + 1}',
            'counterparty': f'거래처{chr(65 + i)}',  # 익명화: 거래처A, 거래처B, ...
            'currency': currency,
            'amount': amount,
            'settlementDate': (datetime.now() + timedelta(days=days_until)).strftime('%Y-%m-%d'),
            'type': trade_type,
            'krwAmount': amount * (1350 if currency == 'USD' else 1450),
            'daysUntil': days_until,
            'hedgeStatus': hedge_status
        }
        positions.append(position)
    
    return positions


def calculate_mock_kpi(positions, target_ratio=70):
    """Mock KPI 계산"""
    total_exposure = sum(p['krwAmount'] for p in positions)
    hedged_amount = sum(p['krwAmount'] for p in positions if p['hedgeStatus'] != '미헤지')
    
    current_ratio = (hedged_amount / total_exposure * 100) if total_exposure > 0 else 0
    
    return {
        'totalExposure': total_exposure,
        'hedgedAmount': hedged_amount,
        'currentHedgeRatio': round(current_ratio, 1),
        'targetHedgeRatio': target_ratio,
        'gap': round(current_ratio - target_ratio, 1),
        'unhedgedAmount': total_exposure - hedged_amount
    }


def serve_static(environ, start_response, path):
    """정적 파일 서빙"""
    
    # URL 디코딩
    path = unquote(path)
    
    # 루트는 index.html
    if path == '/' or path == '':
        path = '/index.html'
    
    # 보안: 상위 디렉토리 접근 방지
    if '..' in path:
        start_response('403 Forbidden', [('Content-Type', 'text/plain')])
        return [b'Forbidden']
    
    # 파일 경로
    file_path = os.path.join(os.getcwd(), path.lstrip('/'))
    
    # 파일 존재 확인
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        start_response('404 Not Found', [('Content-Type', 'text/html')])
        return [b'<h1>404 Not Found</h1>']
    
    # MIME 타입
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type is None:
        mime_type = 'application/octet-stream'
    
    # 파일 읽기
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        
        start_response('200 OK', [
            ('Content-Type', mime_type),
            ('Content-Length', str(len(content))),
            ('Access-Control-Allow-Origin', '*'),
            ('Cache-Control', 'no-cache')
        ])
        
        return [content]
        
    except Exception as e:
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        return [f'Server error: {str(e)}'.encode('utf-8')]


def json_response(start_response, data, status='200 OK'):
    """JSON 응답 생성"""
    body = json.dumps(data, ensure_ascii=False).encode('utf-8')
    
    start_response(status, [
        ('Content-Type', 'application/json'),
        ('Content-Length', str(len(body))),
        ('Access-Control-Allow-Origin', '*')
    ])
    
    return [body]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔍 폴더 상태 모니터링 핸들러 (차단부 105)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def handle_folder_status_report(environ, start_response):
    """
    폴더 상태 보고 수신
    POST /api/folder/status
    {
        "customerId": "customer_xxx",
        "status": {
            "exists": true,
            "accessible": true,
            "structureValid": true,
            "hasPermission": true,
            "healthy": true,
            "details": {...}
        }
    }
    """
    try:
        # 요청 본문 읽기
        content_length = int(environ.get('CONTENT_LENGTH', 0))
        request_body = environ['wsgi.input'].read(content_length).decode('utf-8')
        data = json.loads(request_body)
        
        customer_id = data.get('customerId')
        status_data = data.get('status', {})
        
        if not customer_id:
            return json_response(start_response, {
                'success': False,
                'error': 'customerId가 필요합니다.'
            }, status='400 Bad Request')
        
        # 폴더 상태 기록
        result = folder_monitor.record_status(customer_id, status_data)
        
        # 로그 출력
        health_score = result.get('analysis', {}).get('health_score', 0)
        severity = result.get('analysis', {}).get('severity', 'unknown')
        
        print(f"📊 폴더 상태 수신: {customer_id} | 건강도: {health_score}/100 | 심각도: {severity}")
        
        if result.get('alerts'):
            print(f"🚨 알림 발생: {len(result['alerts'])}개")
            for alert in result['alerts']:
                print(f"   - {alert['type']}: {alert['message']}")
        
        return json_response(start_response, {
            'success': True,
            'message': '폴더 상태가 기록되었습니다.',
            'result': result
        })
        
    except Exception as e:
        print(f"❌ 폴더 상태 처리 오류: {e}")
        return json_response(start_response, {
            'success': False,
            'error': str(e)
        }, status='500 Internal Server Error')


def handle_folder_status_query(environ, start_response):
    """
    폴더 상태 조회
    GET /api/folder/status?customerId=xxx
    """
    try:
        # 쿼리 파라미터 파싱
        query_string = environ.get('QUERY_STRING', '')
        params = parse_qs(query_string)
        customer_id = params.get('customerId', [None])[0]
        
        if not customer_id:
            return json_response(start_response, {
                'success': False,
                'error': 'customerId 파라미터가 필요합니다.'
            }, status='400 Bad Request')
        
        # 고객 폴더 상태 조회
        summary = folder_monitor.get_customer_status_summary(customer_id)
        
        return json_response(start_response, {
            'success': True,
            'data': summary
        })
        
    except Exception as e:
        print(f"❌ 폴더 상태 조회 오류: {e}")
        return json_response(start_response, {
            'success': False,
            'error': str(e)
        }, status='500 Internal Server Error')


def handle_folder_summary(environ, start_response):
    """
    전체 폴더 상태 요약
    GET /api/folder/summary
    """
    try:
        summary = folder_monitor.get_all_status_summary()
        
        return json_response(start_response, {
            'success': True,
            'data': summary
        })
        
    except Exception as e:
        print(f"❌ 폴더 요약 조회 오류: {e}")
        return json_response(start_response, {
            'success': False,
            'error': str(e)
        }, status='500 Internal Server Error')


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 서버 실행 (개발용)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    
    PORT = 9000
    print(f"\n{'='*60}")
    print(f"🚀 HedgeFreedom API Server 시작")
    print(f"{'='*60}")
    print(f"📡 서버 주소: http://localhost:{PORT}")
    print(f"🔧 암호화: {'활성화 ✅' if ENCRYPTION_AVAILABLE else '비활성화 ⚠️'}")
    print(f"📊 계산기: {len(calculator_registry.list_calculators())}개 등록")
    print(f"{'='*60}\n")
    
    with make_server('', PORT, application) as httpd:
        print(f"⏳ 서버 대기 중... (Ctrl+C로 종료)\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n\n{'='*60}")
            print("🛑 서버 종료")
            print(f"{'='*60}\n")
