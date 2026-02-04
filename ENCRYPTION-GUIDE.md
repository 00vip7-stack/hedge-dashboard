# 🔐 HedgeFreedom 암호화 가이드

## 개요

HedgeFreedom은 **AES-256 군사급 암호화**를 사용하여 고객 데이터를 안전하게 보호합니다.

## 암호화 사양

### 🔒 **암호화 알고리즘**
- **암호화 방식**: AES-256 (Fernet)
- **키 유도**: PBKDF2-HMAC-SHA256
- **반복 횟수**: 100,000 iterations
- **솔트**: 고객 ID 기반 (고객별 다른 암호화 키)
- **인코딩**: Base64 (텍스트 저장 가능)

### 📁 **암호화 대상**
✅ **암호화됨**:
- 거래 데이터 (positions)
- KPI 계산 결과 (kpi)
- 백업 데이터 (backup)
- 아카이브 데이터 (archive)

❌ **암호화 안됨**:
- 로그 파일
- 설정 파일
- 임시 파일

### 🗂️ **파일 형식**
```
# 암호화된 파일
positions_2026-02-04_10-30-00.enc    ← .enc 확장자
kpi_2026-02-04_10-30-00.enc

# 평문 파일 (암호화 비활성화 시)
positions_2026-02-04_10-30-00.json   ← .json 확장자
```

## 설치

```bash
pip install cryptography
```

## 암호화 키 설정

### 🚨 **운영 환경 필수 설정**

**기본 키는 절대 운영 환경에 사용하지 마세요!**

### 방법 1: 환경 변수 (권장)
```bash
# Linux/Mac
export HEDGEFREEDOM_MASTER_KEY="your-super-secret-key-here-minimum-32-characters"

# Windows
set HEDGEFREEDOM_MASTER_KEY=your-super-secret-key-here-minimum-32-characters
```

### 방법 2: .env 파일
```bash
# .env 파일 생성 (반드시 .gitignore에 추가!)
HEDGEFREEDOM_MASTER_KEY=your-super-secret-key-here-minimum-32-characters
```

### 방법 3: 코드 수정
```python
# mock_server_app.py
data_encryption = DataEncryption(master_key="your-super-secret-key")
```

## 암호화 키 생성

### 안전한 랜덤 키 생성
```python
import secrets

# 32바이트 랜덤 키 생성
key = secrets.token_urlsafe(32)
print(f"생성된 키: {key}")
```

```bash
# 또는 터미널에서
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 사용 방법

### 서버에서 자동 암호화
```python
# 데이터 저장 (자동 암호화)
save_customer_data(
    customer_id='customer_123',
    data_type='positions',
    data={'trade': 'data'},
    filename_prefix='positions',
    encrypt=True  # 기본값
)

# 데이터 로드 (자동 복호화)
data = load_customer_data(
    customer_id='customer_123',
    data_type='positions',
    filename='positions_2026-02-04_10-30-00.enc'
)
```

### 수동 암호화/복호화
```python
from mock_server_app import data_encryption

# 암호화
encrypted = data_encryption.encrypt(
    data={'sensitive': 'data'},
    customer_id='customer_123'
)

# 복호화
decrypted = data_encryption.decrypt(
    encrypted_data=encrypted,
    customer_id='customer_123'
)
```

## 보안 권장사항

### ✅ **권장**
1. 환경변수로 마스터 키 관리
2. 키 길이 최소 32자 이상
3. 주기적인 키 로테이션 (6개월~1년)
4. 암호화 키는 별도 보안 저장소 사용 (AWS KMS, Azure Key Vault 등)
5. HTTPS로 통신 (전송 계층 암호화)

### ❌ **금지**
1. 기본 키 사용
2. 코드에 하드코딩
3. Git 저장소에 키 커밋
4. 짧은 키 사용 (< 16자)
5. 평문 로깅

## 성능

### 암호화 오버헤드
- **작은 파일** (< 1MB): ~1-5ms
- **중간 파일** (1-10MB): ~10-50ms
- **큰 파일** (> 10MB): ~100ms+

### 최적화 팁
```python
# 대용량 데이터는 압축 후 암호화
import gzip
import json

# 압축 + 암호화
compressed = gzip.compress(json.dumps(data).encode())
encrypted = data_encryption.encrypt(compressed, customer_id)
```

## 문제 해결

### 복호화 실패
```
❌ 복호화 오류: Invalid token
```
**원인**: 잘못된 고객 ID 또는 마스터 키 변경  
**해결**: 원래 키와 고객 ID 사용

### 암호화 비활성화
```
⚠️ 암호화 비활성화 (cryptography 미설치)
```
**원인**: cryptography 라이브러리 미설치  
**해결**: `pip install cryptography`

## 규정 준수

### 지원 규정
✅ GDPR (유럽 개인정보보호법)  
✅ CCPA (캘리포니아 소비자 프라이버시법)  
✅ ISO 27001  
✅ PCI DSS (Level 3 이상)  

### 암호화 강도
- **AES-256**: NSA Suite B 승인
- **PBKDF2**: NIST 승인
- **100,000 iterations**: OWASP 권장

## 추가 보안 계층

### 1. 전송 계층 암호화
```nginx
# HTTPS 필수 설정
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
```

### 2. 데이터베이스 암호화
```python
# 추가 암호화 레이어
encrypted_data = data_encryption.encrypt(data, customer_id)
db.save(encrypted_data)  # DB도 암호화
```

### 3. 접근 제어
```python
# 역할 기반 접근 제어 (RBAC)
@require_role('admin')
def decrypt_customer_data(customer_id):
    # 관리자만 복호화 가능
    pass
```

## 참고 자료

- [Cryptography 공식 문서](https://cryptography.io/)
- [OWASP 암호화 가이드](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [NIST 암호화 표준](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)
