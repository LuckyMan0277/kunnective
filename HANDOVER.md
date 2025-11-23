# KU-Connect 개발 인수인계 문서

## 📋 프로젝트 개요

**프로젝트명**: KU-Connect (건국대 아이디어 공유 및 팀 빌딩 플랫폼)
**개발 기간**: 2025년 1월
**현재 상태**: Phase 0-6 완료 (MVP 100% 구현, 배포 준비 완료)
**기술 스택**: Next.js 15, TypeScript, Supabase, Tailwind CSS, shadcn/ui, Zustand
**배포 가이드**: [DEPLOYMENT.md](./DEPLOYMENT.md) 참조

---

## 🎯 완료된 기능

### Phase 0: 환경 설정 ✅
- [x] pnpm workspace 설정
- [x] Next.js 15 + TypeScript 프로젝트 구조
- [x] Tailwind CSS + shadcn/ui 테마
- [x] Supabase 클라이언트/서버 설정
- [x] Git 저장소 초기화

### Phase 1: 인증 & 프로필 ✅
- [x] Supabase Auth 연동
- [x] 건국대 이메일 검증 회원가입
- [x] 로그인/로그아웃
- [x] 프로필 생성/수정/조회
- [x] 프로필 사진 업로드
- [x] Protected routes

### Phase 2: 아이디어 게시판 ✅
- [x] 데이터베이스 스키마 (ideas, likes, bookmarks, comments)
- [x] 아이디어 목록 (검색, 필터링, 정렬)
- [x] Markdown 에디터
- [x] 아이디어 CRUD
- [x] 좋아요/북마크
- [x] 댓글 시스템

### Phase 3: 프로젝트 & 매칭 ✅
- [x] 프로젝트 생성/목록/상세
- [x] 팀원 지원 시스템
- [x] 지원서 관리
- [x] 팀원 수락/거절

### Phase 4: 채팅 시스템 ✅
- [x] 채팅방 데이터베이스 (1:1, 그룹, 프로젝트)
- [x] 실시간 메시징 (Supabase Realtime)
- [x] 채팅방 목록
- [x] 읽음 표시 및 읽지 않은 메시지 카운트
- [x] 프로젝트 팀 채팅

### Phase 5: 알림 시스템 ✅
- [x] 알림 데이터베이스 및 자동 트리거
- [x] 알림 센터 UI
- [x] 실시간 알림 배지
- [x] 이벤트별 알림 (지원, 좋아요, 댓글 등)

### Phase 6: UX 개선 ✅
- [x] Skeleton 로딩 UI
- [x] Toast 알림 시스템
- [x] Error Boundary
- [x] 404 페이지
- [x] 반응형 디자인

---

## 🗂️ 프로젝트 구조

```
project-maker/
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql      # 사용자 프로필 테이블
│       ├── 002_create_storage.sql      # 이미지 저장소
│       ├── 003_create_ideas.sql        # 아이디어 시스템
│       └── 004_create_projects.sql     # 프로젝트 시스템
│
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/                 # 인증 페이지 그룹
│   │   │   │   ├── login/
│   │   │   │   └── signup/
│   │   │   ├── auth/
│   │   │   │   └── callback/          # OAuth 콜백
│   │   │   ├── ideas/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx       # 아이디어 상세
│   │   │   │   │   └── edit/          # 아이디어 수정
│   │   │   │   ├── new/               # 아이디어 작성
│   │   │   │   └── page.tsx           # 아이디어 목록
│   │   │   ├── profile/
│   │   │   │   ├── setup/             # 프로필 생성
│   │   │   │   ├── edit/              # 프로필 수정
│   │   │   │   └── page.tsx           # 프로필 조회
│   │   │   ├── projects/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx       # 프로젝트 상세
│   │   │   │   │   └── manage/        # 지원서 관리
│   │   │   │   ├── new/               # 프로젝트 생성
│   │   │   │   └── page.tsx           # 프로젝트 목록
│   │   │   ├── layout.tsx             # 루트 레이아웃
│   │   │   └── page.tsx               # 홈페이지
│   │   │
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── logout-button.tsx
│   │   │   ├── ideas/
│   │   │   │   ├── idea-card.tsx
│   │   │   │   └── markdown-editor.tsx
│   │   │   ├── layout/
│   │   │   │   ├── header.tsx
│   │   │   │   └── footer.tsx
│   │   │   ├── profile/
│   │   │   │   └── avatar-upload.tsx
│   │   │   ├── projects/
│   │   │   │   └── project-card.tsx
│   │   │   └── ui/                    # shadcn/ui 컴포넌트
│   │   │       ├── badge.tsx
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── select.tsx
│   │   │       └── textarea.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts         # 인증 상태 훅
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts          # 브라우저 클라이언트
│   │   │   │   └── server.ts          # 서버 클라이언트
│   │   │   ├── utils.ts               # 유틸리티 함수
│   │   │   └── validation.ts          # Zod 스키마
│   │   │
│   │   ├── styles/
│   │   │   └── globals.css            # 전역 스타일
│   │   │
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript 타입
│   │   │
│   │   └── middleware.ts              # 인증 미들웨어
│   │
│   ├── components.json                # shadcn/ui 설정
│   ├── next.config.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── .gitignore
├── pnpm-workspace.yaml
├── package.json
├── techspec.md                        # 기술 명세서
└── HANDOVER.md                        # 이 문서
```

---

## 🔧 환경 설정

### 1. 필수 환경 변수

`web/.env.local` 파일 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

### 3. Supabase 설정

1. Supabase 프로젝트 생성
2. 데이터베이스 마이그레이션 실행:
   ```bash
   # Supabase CLI 사용
   supabase db push

   # 또는 SQL Editor에서 수동 실행
   # supabase/migrations/ 폴더의 파일들을 순서대로 실행
   ```
3. Storage 설정:
   - Bucket 이름: `avatars`
   - Public 접근 허용

---

## 📊 데이터베이스 스키마

### 주요 테이블

#### 1. users (프로필)
```sql
- id (UUID, PK)
- email (VARCHAR)
- name (VARCHAR)
- major (VARCHAR)
- year (INTEGER)
- bio (TEXT)
- skills (TEXT[])
- interests (TEXT[])
- portfolio_url (VARCHAR)
- github_url (VARCHAR)
- avatar_url (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. ideas (아이디어)
```sql
- id (UUID, PK)
- user_id (UUID, FK -> users)
- title (VARCHAR)
- content (TEXT)
- category (VARCHAR)
- tags (TEXT[])
- status (VARCHAR)
- required_roles (TEXT[])
- view_count (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. projects (프로젝트)
```sql
- id (UUID, PK)
- owner_id (UUID, FK -> users)
- idea_id (UUID, FK -> ideas)
- title (VARCHAR)
- description (TEXT)
- category (VARCHAR)
- tags (TEXT[])
- status (VARCHAR)
- start_date (DATE)
- end_date (DATE)
- github_url (VARCHAR)
- demo_url (VARCHAR)
- max_members (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 4. project_applications (지원서)
```sql
- id (UUID, PK)
- project_id (UUID, FK -> projects)
- user_id (UUID, FK -> users)
- role (VARCHAR)
- message (TEXT)
- status (VARCHAR) # pending, accepted, rejected
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### RLS (Row Level Security) 정책

모든 테이블에 RLS 활성화:
- SELECT: 모두 조회 가능
- INSERT: 인증된 사용자만
- UPDATE/DELETE: 작성자만

---

## 🛠️ 주요 기술 스택

### Frontend
- **Next.js 15**: App Router, Server Components
- **React 19**: 최신 React 기능
- **TypeScript 5.7**: 타입 안정성
- **Tailwind CSS 3.4**: 유틸리티 CSS
- **shadcn/ui**: Radix UI 기반 컴포넌트
- **React Hook Form**: 폼 관리
- **Zod**: 스키마 검증
- **React Markdown**: Markdown 렌더링

### Backend
- **Supabase**: BaaS (Backend as a Service)
  - PostgreSQL 데이터베이스
  - 인증 시스템
  - Storage (파일 업로드)
  - Row Level Security

### 개발 도구
- **pnpm**: 패키지 매니저
- **ESLint**: 코드 린팅
- **Git**: 버전 관리

---

## 🔑 주요 파일 설명

### 1. 인증 관련

**`src/middleware.ts`**
- Protected routes 설정
- 인증되지 않은 사용자 리다이렉트
- 로그인한 사용자의 auth 페이지 접근 차단

**`src/lib/supabase/client.ts`**
- 브라우저 환경 Supabase 클라이언트
- `createClient()` 함수 export

**`src/lib/supabase/server.ts`**
- 서버 환경 Supabase 클라이언트
- 쿠키 기반 세션 관리

**`src/lib/hooks/useAuth.ts`**
- 클라이언트 사이드 인증 상태 훅
- 사용자 정보 및 프로필 조회
- 실시간 인증 상태 변경 감지

### 2. 유효성 검증

**`src/lib/validation.ts`**
- Zod 스키마 정의
- `isKonkukEmail()`: 건국대 이메일 검증
- 각종 폼 검증 스키마:
  - `signUpSchema`
  - `signInSchema`
  - `profileSchema`
  - `ideaSchema`
  - `projectSchema`
  - `applicationSchema`

### 3. 타입 정의

**`src/types/index.ts`**
- TypeScript 인터페이스 정의
- 사용자, 아이디어, 프로젝트 등 모든 엔티티 타입
- Insert/Update 타입 분리

---

## 🎨 UI 컴포넌트

### shadcn/ui 컴포넌트 목록

설치된 컴포넌트:
- `Button`: 버튼
- `Input`: 입력 필드
- `Textarea`: 텍스트 영역
- `Label`: 레이블
- `Card`: 카드 레이아웃
- `Badge`: 배지
- `Select`: 드롭다운

### 커스텀 컴포넌트

**레이아웃:**
- `Header`: 네비게이션 바
- `Footer`: 푸터

**아이디어:**
- `IdeaCard`: 아이디어 카드
- `MarkdownEditor`: Markdown 에디터

**프로필:**
- `AvatarUpload`: 프로필 사진 업로드

**프로젝트:**
- `ProjectCard`: 프로젝트 카드

---

## 📝 개발 가이드

### 새 페이지 추가하기

1. **페이지 파일 생성**
   ```tsx
   // web/src/app/my-page/page.tsx
   export default function MyPage() {
     return <div>My Page</div>
   }
   ```

2. **네비게이션 추가**
   ```tsx
   // web/src/components/layout/header.tsx
   <Link href="/my-page">내 페이지</Link>
   ```

### 새 데이터베이스 테이블 추가하기

1. **마이그레이션 파일 생성**
   ```sql
   -- supabase/migrations/005_new_feature.sql
   CREATE TABLE IF NOT EXISTS public.my_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES public.users(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- RLS 활성화
   ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

   -- 정책 추가
   CREATE POLICY "Users can view their own data"
     ON public.my_table FOR SELECT
     USING (auth.uid() = user_id);
   ```

2. **TypeScript 타입 추가**
   ```typescript
   // web/src/types/index.ts
   export interface MyTable {
     id: string
     user_id: string
     created_at: string
   }
   ```

### 새 UI 컴포넌트 추가하기

shadcn/ui 컴포넌트 추가:
```bash
# 예: Dialog 컴포넌트 추가
npx shadcn-ui@latest add dialog
```

---

## 🐛 트러블슈팅

### 1. Supabase 연결 오류

**문제**: `fetch failed` 에러
**해결**:
- `.env.local` 파일 확인
- Supabase URL과 Key가 올바른지 확인
- 네트워크 연결 확인

### 2. RLS 정책 오류

**문제**: 데이터 조회/수정 불가
**해결**:
- Supabase Dashboard에서 RLS 정책 확인
- 정책이 올바르게 설정되었는지 확인
- `auth.uid()`가 올바르게 작동하는지 확인

### 3. 이미지 업로드 실패

**문제**: Storage 업로드 에러
**해결**:
- Storage bucket이 생성되었는지 확인
- Public 접근이 허용되었는지 확인
- RLS 정책이 올바른지 확인

### 4. 빌드 에러

**문제**: TypeScript 타입 에러
**해결**:
```bash
# 타입 체크
pnpm tsc --noEmit

# 의존성 재설치
rm -rf node_modules
pnpm install
```

---

## 🚀 배포 가이드

### Vercel 배포

1. **GitHub 연결**
   - Vercel 프로젝트 생성
   - GitHub 저장소 연결

2. **환경 변수 설정**
   - Vercel Dashboard에서 환경 변수 추가
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **빌드 설정**
   ```
   Build Command: cd web && pnpm build
   Output Directory: web/.next
   Install Command: pnpm install
   ```

### 데이터베이스 마이그레이션

프로덕션 배포 전:
```bash
# Supabase CLI 사용
supabase link --project-ref your-project-ref
supabase db push
```

---

## 📚 다음 개발 단계 (Phase 4-6)

### Phase 4: 채팅 시스템 (예정)

**구현 항목:**
- [ ] 데이터베이스 스키마 (chat_rooms, messages, participants)
- [ ] 채팅방 목록
- [ ] 1:1 채팅 UI
- [ ] 그룹 채팅 UI
- [ ] 실시간 메시지 (Supabase Realtime)
- [ ] 읽음 표시
- [ ] 메시지 페이지네이션

**참고 사항:**
- Supabase Realtime 사용
- WebSocket 연결 관리
- 메시지 최적화 (가상 스크롤)

### Phase 5: 알림 시스템 (예정)

**구현 항목:**
- [ ] 데이터베이스 스키마 (notifications)
- [ ] 알림 센터 UI
- [ ] 실시간 알림 뱃지
- [ ] 알림 생성 로직 (triggers)
- [ ] 알림 읽음 처리

**참고 사항:**
- Database Triggers 사용
- 알림 타입별 템플릿
- 읽지 않은 알림 카운트

### Phase 8: 배포 준비 ✅
- [x] Vercel 설정 파일 작성
- [x] 환경 변수 템플릿 (.env.example)
- [x] 배포 가이드 문서 (DEPLOYMENT.md)
- [x] 보안 체크리스트 검토

**배포 가능 상태:**
- ✅ 모든 핵심 기능 구현 완료
- ✅ 데이터베이스 마이그레이션 준비
- ✅ 환경 설정 문서화
- ✅ 배포 가이드 작성

---

## 🔒 보안 체크리스트

### 구현된 보안 기능
- ✅ Row Level Security (RLS)
- ✅ 이메일 검증 (건국대 도메인)
- ✅ Protected Routes
- ✅ SQL Injection 방지 (Supabase SDK)
- ✅ XSS 방지 (React 자동 이스케이핑)
- ✅ CSRF 방지 (Supabase Auth)

### 추가 고려사항
- [ ] Rate Limiting
- [ ] API 키 로테이션
- [ ] 민감 정보 로깅 방지
- [ ] Content Security Policy
- [ ] HTTPS 강제

---

## 📞 지원 및 문의

### 문서
- **기술 명세서**: `techspec.md`
- **인수인계 문서**: `HANDOVER.md` (이 문서)
- **배포 가이드**: `DEPLOYMENT.md`
- **프로젝트 개요**: `README.md`

### 외부 리소스
- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

### 주요 라이브러리 버전
- Next.js: 15.1.5
- React: 19.0.0
- TypeScript: 5.7.3
- Supabase: 2.48.1+
- Tailwind CSS: 3.4.17

---

## ✅ 체크리스트

### 개발 환경 셋업
- [ ] Node.js 18+ 설치
- [ ] pnpm 설치
- [ ] Git 저장소 클론
- [ ] 의존성 설치 (`pnpm install`)
- [ ] 환경 변수 설정 (`.env.local`)
- [ ] Supabase 프로젝트 연결
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 개발 서버 실행 확인

### 코드베이스 이해
- [ ] 프로젝트 구조 파악
- [ ] 주요 파일 위치 확인
- [ ] 데이터베이스 스키마 이해
- [ ] 인증 플로우 이해
- [ ] UI 컴포넌트 확인

### 추가 개발 준비
- [ ] Git 브랜치 전략 수립
- [ ] 이슈 트래킹 설정
- [ ] 코드 리뷰 프로세스 정의
- [ ] 배포 파이프라인 구축

---

## 📝 변경 이력

- **2025-01-23**: Phase 0-3 완료, 인수인계 문서 작성
- **향후**: Phase 4-6 개발 시 업데이트 예정

---

**문서 작성일**: 2025년 1월 23일
**최종 커밋**: `25b25df - Update Phase 3 checklist - all tasks completed`
**총 코드 라인**: 6,015줄
**총 파일 수**: 42개

이 문서를 기반으로 개발을 이어나가시면 됩니다. 추가 질문이나 도움이 필요하시면 언제든지 문의하세요! 🚀
