# Windows 사용 가이드

## 🎯 단 3개 파일만 기억하세요!

### 1️⃣ start.bat
**서버만 시작** (브라우저 수동)

```
더블클릭 → 서버 시작 → 브라우저에서 http://localhost:9000 접속
```

### 2️⃣ start-auto.bat  
**서버 + 브라우저 자동 실행** ⭐ 권장!

```
더블클릭 → 서버 시작 + 브라우저 자동 열림
```

### 3️⃣ stop.bat
**서버 종료**

```
더블클릭 → 모든 서버 종료
```

---

## 🚀 빠른 시작

### 가장 쉬운 방법
```
1. start-auto.bat 더블클릭
2. 끝! (자동으로 브라우저 열림)
3. 종료: stop.bat 더블클릭
```

### 수동 방법
```
1. start.bat 더블클릭
2. 브라우저에서 http://localhost:9000 접속
3. 종료: stop.bat 더블클릭 또는 창 닫기
```

---

## 📋 파일 설명

| 파일 | 기능 | 브라우저 자동 실행 |
|------|------|------------------|
| **start.bat** | 서버 시작 | ❌ 수동 |
| **start-auto.bat** | 서버 + 브라우저 | ✅ 자동 (권장) |
| **stop.bat** | 서버 종료 | - |

---

## 문제 해결

### 1. 한글이 깨지는 경우

**원인**: Windows 인코딩 문제

**해결**:
```cmd
# CMD 인코딩 변경
chcp 65001

# 그 다음 실행
python mock-server.py
```

또는 **start.bat** 사용 (한글 없음)

### 2. "python을 찾을 수 없습니다"

**원인**: Python이 설치되지 않았거나 PATH에 없음

**해결**:
1. Python 설치: https://www.python.org/downloads/
2. 설치 시 "Add Python to PATH" 체크
3. 재부팅

**확인**:
```cmd
python --version
```

### 3. 포트가 사용 중

**해결**:
```cmd
# 1. stop.bat 실행
stop.bat

# 2. 포트 확인
netstat -ano | findstr :9000
```

### 4. 배치 파일이 실행되지 않음

**원인**: 보안 설정

**해결**:
1. 마우스 우클릭 → "관리자 권한으로 실행"
2. 또는 직접 Python 실행:
```cmd
python mock-server.py
```

### 5. 브라우저가 자동으로 열리지 않음

**정상입니다!** 수동으로 브라우저를 열고:
```
http://localhost:9000
```

---

## 배치 파일 비교

| 파일 | 기능 | 자동 브라우저 | 사용 빈도 |
|------|------|--------------|----------|
| start.bat | 기본 실행 | ❌ | ⭐⭐⭐ |
| start-auto.bat | 자동 실행 | ✅ | ⭐⭐⭐⭐⭐ 권장 |
| stop.bat | 종료 | - | ⭐⭐⭐ |

---

## 추천 사용법

### 처음 사용자 (권장!)
```
1. start-auto.bat 더블클릭
2. 자동으로 브라우저 열림
3. 작업 완료 후 stop.bat 실행
```

### 일반 사용자
```
1. start.bat 더블클릭
2. 브라우저에서 http://localhost:9000 접속
3. 작업 완료 후 창 닫기
```

---

## 여전히 안 된다면?

### 최종 해결책: PowerShell 사용

```powershell
# PowerShell 열기 (Windows + X → Windows PowerShell)
cd C:\경로\hedge-dashboard
python mock-server.py
```

또는

```powershell
# 한 줄로
python C:\경로\hedge-dashboard\mock-server.py
```

### Docker 사용 (가장 확실)

```cmd
docker-compose up -d
```

---

## 참고 자료

- Python 설치: https://www.python.org/downloads/
- 전체 가이드: [LOCAL-SETUP.md](LOCAL-SETUP.md)
- 배포 가이드: [DEPLOYMENT.md](DEPLOYMENT.md)
