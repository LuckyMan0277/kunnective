# KU-Connect 배포 가이드

## 📋 사전 요구사항

- Supabase 프로젝트 (무료 티어 가능)
- Vercel 계정 (무료 티어 가능)
- Git/GitHub 저장소

---

## 🗄️ Supabase 설정

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 후 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `ku-connect`
   - Database Password: 강력한 비밀번호 설정
   - Region: `Northeast Asia (Seoul)` 선택
   - Pricing Plan: `Free` 선택

### 2. 데이터베이스 마이그레이션 실행

프로젝트가 생성되면 SQL Editor에서 다음 파일들을 순서대로 실행:

```bash
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_create_storage.sql
3. supabase/migrations/003_create_ideas.sql
4. supabase/migrations/004_create_projects.sql
5. supabase/migrations/005_create_chat_system.sql
6. supabase/migrations/006_create_notifications.sql
```

**실행 방법**:
1. Supabase Dashboard → SQL Editor
2. "New Query" 클릭
3. 각 마이그레이션 파일 내용 복사 & 붙여넣기
4. "Run" 클릭

### 3. Supabase Realtime 활성화

1. Database → Replication
2. 다음 테이블들에 대해 Realtime 활성화:
   - `messages`
   - `notifications`
   - `chat_participants`

### 4. 환경 변수 확인

Supabase Dashboard → Settings → API에서 다음 값 복사:

- **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
- **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🚀 Vercel 배포

### 1. GitHub 저장소 준비

```bash
# 프로젝트를 GitHub에 푸시
git remote add origin https://github.com/your-username/ku-connect.git
git branch -M main
git push -u origin main
```

### 2. Vercel 프로젝트 생성

1. [Vercel](https://vercel.com) 접속 후 로그인
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `cd .. && pnpm install`

### 3. 환경 변수 설정

Vercel Project Settings → Environment Variables에서 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 배포

"Deploy" 클릭하면 자동으로 배포가 시작됩니다.

---

## 🔧 로컬 개발 환경 설정

### 1. 환경 변수 설정

```bash
cd web
cp .env.example .env.local
```

`.env.local` 파일 수정:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 의존성 설치 및 실행

```bash
# 루트 디렉토리에서
pnpm install

# 개발 서버 실행
cd web
pnpm dev
```

브라우저에서 http://localhost:3000 접속

---

## ✅ 배포 후 확인 사항

### 1. 회원가입 테스트
- 건국대 이메일(@konkuk.ac.kr)로 회원가입
- 이메일 인증 확인

### 2. 기능 테스트
- [ ] 프로필 생성 및 수정
- [ ] 아이디어 작성, 조회, 수정, 삭제
- [ ] 좋아요, 북마크, 댓글 기능
- [ ] 프로젝트 생성 및 지원
- [ ] 지원서 수락/거절
- [ ] 1:1 채팅 및 프로젝트 팀 채팅
- [ ] 알림 수신 및 읽음 처리

### 3. 성능 확인
- Lighthouse 점수 확인 (권장: 90점 이상)
- 페이지 로딩 속도 확인
- 모바일 반응형 확인

---

## 🔒 보안 체크리스트

### Supabase RLS (Row Level Security)
- [x] users 테이블 RLS 활성화
- [x] ideas 테이블 RLS 활성화
- [x] projects 테이블 RLS 활성화
- [x] chat_rooms, messages RLS 활성화
- [x] notifications RLS 활성화

### 환경 변수
- [x] .env.local은 .gitignore에 포함
- [x] Vercel에 환경 변수 설정
- [x] API 키는 절대 클라이언트 코드에 하드코딩 금지

---

## 📊 모니터링

### Vercel Analytics
1. Vercel Dashboard → Analytics 탭
2. 실시간 방문자 및 성능 모니터링

### Supabase Logs
1. Supabase Dashboard → Logs
2. 데이터베이스 쿼리 및 에러 모니터링

---

## 🐛 트러블슈팅

### 빌드 오류

**문제**: `Module not found` 오류
```bash
# 해결: 의존성 재설치
rm -rf node_modules web/node_modules
pnpm install
```

**문제**: TypeScript 타입 오류
```bash
# 해결: 타입 체크
cd web
pnpm type-check
```

### 데이터베이스 오류

**문제**: RLS 정책으로 인한 접근 거부
- Supabase Dashboard → Authentication → Policies 확인
- 각 테이블의 RLS 정책 재검토

**문제**: 마이그레이션 오류
- SQL Editor에서 에러 메시지 확인
- 테이블 의존성 순서 확인 (외래 키)

### 인증 오류

**문제**: 이메일 인증이 작동하지 않음
- Supabase Dashboard → Authentication → Email Templates 확인
- SMTP 설정 확인 (무료 티어는 하루 이메일 제한 있음)

**문제**: 로그인 후 리다이렉트 안됨
- Supabase Dashboard → Authentication → URL Configuration
- Site URL과 Redirect URLs에 배포된 도메인 추가

---

## 🔄 업데이트 및 재배포

### 코드 변경 후 재배포

```bash
git add .
git commit -m "Update: 변경 내용"
git push origin main
```

Vercel이 자동으로 새 배포를 시작합니다.

### 데이터베이스 스키마 변경

1. 새 마이그레이션 파일 생성
2. Supabase SQL Editor에서 실행
3. 애플리케이션 코드 업데이트
4. Git push로 재배포

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. **Vercel Logs**: 배포 및 런타임 에러
2. **Supabase Logs**: 데이터베이스 쿼리 에러
3. **브라우저 Console**: 클라이언트 에러

---

## 🎯 성능 최적화 팁

### 이미지 최적화
- Next.js Image 컴포넌트 사용
- WebP 형식 사용

### 캐싱
- Vercel Edge Network 자동 캐싱 활용
- Supabase 쿼리 결과 클라이언트 캐싱

### 번들 크기 최적화
```bash
cd web
pnpm analyze  # 번들 분석 (package.json에 스크립트 추가 필요)
```

---

## 📈 확장성

### Supabase 무료 티어 제한
- Database: 500MB
- Storage: 1GB
- Bandwidth: 2GB/월
- Realtime: 200 동시 연결

### Vercel 무료 티어 제한
- Bandwidth: 100GB/월
- Builds: 6000분/월
- Serverless Functions: 100GB-Hrs

제한 초과 시 Pro 플랜 고려 ($20/월)

---

**배포 완료! 🎉**

배포된 앱 URL: `https://your-project.vercel.app`
