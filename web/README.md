# Project Maker - Web Application

아이디어 공유 및 팀원 모집 플랫폼

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열어 확인하세요.

## 프로젝트 구조

```
web/
├── app/                    # Next.js App Router 페이지
│   ├── ideas/             # 아이디어 게시판
│   ├── projects/          # 프로젝트 팀 모집
│   ├── auth/              # 인증 (로그인/회원가입)
│   └── page.tsx           # 메인 페이지
├── components/            # 재사용 가능한 컴포넌트
│   ├── ideas/
│   ├── projects/
│   └── ui/
├── lib/                   # 유틸리티 및 헬퍼
│   ├── supabase/          # Supabase 클라이언트
│   └── utils/
└── types/                 # TypeScript 타입 정의
    └── index.ts
```

## 주요 기능

### 1. 아이디어 게시판
- 제목과 설명만으로 간단하게 아이디어 공유
- 추천 및 댓글 기능
- 아이디어를 프로젝트로 전환 가능

### 2. 프로젝트 팀 모집
- 프로젝트 설명 중심의 팀 모집 게시
- 포지션별 모집 현황 표시
- 기술 스택 태그
- 일반 지원 및 헤드헌팅 시스템

### 3. 인증 시스템
- 이메일 기반 회원가입/로그인
- Supabase Auth 사용

## 데이터베이스 설정

### Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. Project URL과 anon key를 `.env.local`에 설정

### 마이그레이션 실행
프로젝트 루트의 `supabase/migrations/` 폴더에 있는 SQL 파일들을 순서대로 실행:

1. `001_initial_schema.sql` - 사용자 테이블
2. `003_create_ideas.sql` - 아이디어 테이블
3. `004_create_projects.sql` - 프로젝트 테이블

## 배포

### Vercel에 배포

1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 배포

```bash
npm run build
```

## 개발 가이드

### 코드 스타일
- TypeScript strict 모드 사용
- Tailwind CSS로 스타일링
- Server Components 우선, 필요시 Client Components 사용

### 컴포넌트 작성 규칙
- 파일명: kebab-case
- 컴포넌트명: PascalCase
- 타입 정의: `types/index.ts`에 중앙화

## 라이선스

MIT
