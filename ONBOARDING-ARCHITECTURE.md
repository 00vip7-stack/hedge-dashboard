# 🚀 HedgeFreedom - 온보딩 아키텍처

## 📋 시스템 구조

```
사용자 방문
    ↓
index.html (리다이렉트 로직)
    ↓
    ├─ 온보딩 완료? ❌ → onboarding.html (4단계 설정)
    │                      ├─ 단계 1️⃣ : 환영 메시지
    │                      ├─ 단계 2️⃣ : 작업공간 폴더 설정
    │                      ├─ 단계 3️⃣ : 데이터 보안 설명
    │                      └─ 단계 4️⃣ : 초기 설정 (목표 헤지 비율)
    │                           ↓
    │                      localStorage 저장:
    │                      - hedge_onboarding_completed=true
    │                      - hedge_folders_setup=true
    │                      - target_hedge_ratio=75
    │                           ↓
    │                      hedge-manager.html (대시보드)
    │
    └─ 온보딩 완료? ✅ → hedge-manager.html (대시보드)
                            ↓
                        폴더 설정 확인
                        ├─ localStorage ✅
                        └─ IndexedDB ✅
                            ↓
                        데이터 로드 + UI 표시
```

---

## 🔄 페이지별 역할

### 1. **index.html** - 엔트리 포인트
- localStorage에서 `hedge_onboarding_completed` 확인
- ✅ 완료 → `hedge-manager.html` 리다이렉트
- ❌ 미완료 → `onboarding.html` 리다이렉트

### 2. **login.html** - 로그인 (선택사항)
- 사용자 인증 처리
- 인증 성공 시:
  - `user_logged_in=true` 저장
  - 온보딩 완료 여부 확인
  - ✅ 완료 → `hedge-manager.html`
  - ❌ 미완료 → `onboarding.html`

### 3. **onboarding.html** - 온보딩 (필수!)
- **단계별 설정 UI**
  - 단계 1: 환영 인사
  - 단계 2: 작업공간 폴더 선택 (File System Access API)
    - HEDGEFREEDOM 폴더 자동 생성
    - 하위 폴더 자동 생성 (원본, 결과, 히스토리, 캐시)
    - IndexedDB에 저장
  - 단계 3: 보안 정보 안내
  - 단계 4: 초기 설정 (목표 헤지 비율)

- **저장되는 데이터**
  ```javascript
  localStorage:
  - hedge_onboarding_completed=true
  - hedge_folders_setup=true
  - target_hedge_ratio=75 (사용자가 설정한 값)
  - onboarding_completed_at=ISO8601 timestamp
  
  IndexedDB:
  - folderHandles.원본 (File Handle)
  - folderHandles.결과 (File Handle)
  ```

### 4. **hedge-manager.html** - 대시보드
- 온보딩 미완료 시 → `onboarding.html`로 리다이렉트
- 온보딩 완료 시:
  - 폴더 설정 확인 (localStorage + IndexedDB)
  - 로컬 폴더에서 데이터 자동 로드
  - UI 렌더링 및 기능 제공

---

## 💾 localStorage 키 정리

| 키 | 값 | 목적 |
|---|---|---|
| `hedge_onboarding_completed` | `"true"` | 온보딩 완료 여부 (필수!) |
| `hedge_folders_setup` | `"true"` | 폴더 설정 완료 여부 |
| `hedge_root_folder_name` | `string` | 사용자가 선택한 최상위 폴더 이름 |
| `target_hedge_ratio` | `"75"` | 목표 헤지 비율 (백분율) |
| `onboarding_completed_at` | `ISO8601` | 온보딩 완료 시간 |
| `user_logged_in` | `"true"` | 사용자 로그인 상태 (선택) |

---

## 🔐 IndexedDB 구조

```
Database: HedgeDashboardDB
  ├─ ObjectStore: folderHandles
  │   ├─ Key: "원본"
  │   │   ├─ type: "원본"
  │   │   ├─ handle: FileSystemDirectoryHandle
  │   │   └─ savedAt: ISO8601
  │   │
  │   └─ Key: "결과"
  │       ├─ type: "결과"
  │       ├─ handle: FileSystemDirectoryHandle
  │       └─ savedAt: ISO8601
```

---

## 🎯 사용 흐름 (사용자 관점)

### 🆕 첫 방문
```
1. 사이트 방문 (index.html)
2. 온보딩 페이지 자동 이동
3. 4단계 설정 완료
   - 폴더 선택
   - 목표 헤지 비율 설정
4. 자동으로 대시보드 로드
```

### 🔄 재방문
```
1. 사이트 방문 (index.html)
2. localStorage 체크 → 설정됨
3. 즉시 대시보드 로드 (온보딩 스킵)
4. 이전 데이터 자동 복원
```

---

## 🛠️ 개발자 가이드

### 온보딩 완료 확인
```javascript
const onboardingCompleted = localStorage.getItem('hedge_onboarding_completed') === 'true';
if (!onboardingCompleted) {
    window.location.href = './onboarding.html';
}
```

### 폴더 설정 확인
```javascript
const isSetup = localStorage.getItem('hedge_folders_setup') === 'true';
const targetRatio = localStorage.getItem('target_hedge_ratio');
```

### 저장된 폴더 핸들 복원
```javascript
// IndexedDB에서 자동 복원
const folderManager = window.folderManager;
await folderManager.restoreFolderHandles();
```

---

## ⚠️ 주의사항

1. **File System Access API 제약**
   - Chrome/Edge 브라우저만 지원
   - HTTPS 필수
   - localhost 개발 환경에서만 HTTP 지원

2. **IndexedDB 실패 처리**
   - IndexedDB 실패 시에도 localStorage로 진행
   - localStorage만으로도 온보딩 완료 상태 유지 가능

3. **데이터 삭제**
   - 사용자가 수동으로 폴더 권한 취소 시 재설정 필요
   - localStorage 삭제 시 온보딩 재진행 필요

---

## 🧪 테스트

### 온보딩 리셋 (테스트용)
```javascript
// 개발자 콘솔에서 실행
localStorage.removeItem('hedge_onboarding_completed');
localStorage.removeItem('hedge_folders_setup');
localStorage.removeItem('target_hedge_ratio');
location.reload();
```

### 강제 온보딩 진입
```javascript
window.location.href = './onboarding.html';
```

---

## 📊 마이그레이션 노트

### 기존 시스템과의 차이점

**기존:**
- hedge-manager.html이 모든 역할 담당
- 모달 기반 설정 (페이지 로드 후 표시)
- 온보딩 반복 문제 발생

**신규:**
- ✅ 명확한 온보딩 페이지 (별도 URL)
- ✅ 완료 플래그 기반 (반복 방지)
- ✅ 모듈화된 구조 (유지보수 용이)
- ✅ 더 나은 UX (4단계 설명)

---

## 🚀 배포 체크리스트

- [ ] onboarding.html 업로드
- [ ] index.html 리다이렉트 로직 확인
- [ ] login.html 로그인 후 리다이렉트 확인
- [ ] hedge-manager.html 온보딩 체크 로직 확인
- [ ] localStorage 테스트
- [ ] IndexedDB 테스트
- [ ] File System Access API 권한 요청 테스트
- [ ] 브라우저 호환성 테스트 (Chrome/Edge)

