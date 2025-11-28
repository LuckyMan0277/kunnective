# Kunnective (건국대 자율 협업 플랫폼)

> 건국대학교 학생들을 위한 아이디어 공유, 팀 빌딩, 프로젝트 협업 플랫폼
>
> **철학**: 자율성 - 역할 제한 없이 누구든 무엇이든 할 수 있습니다

[![Next.js](https://img.shields.io/badge/Next.js-15.1.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)

## 🎉 개발 현황

### ✅ 완료된 Phase (100%)
- **Phase 0**: 환경 설정 ✅
- **Phase 1**: 인증 & 프로필 ✅
- **Phase 2**: 아이디어 게시판 ✅
- **Phase 3**: 프로젝트 & 매칭 시스템 ✅
- **Phase 4**: 채팅 시스템 ✅
- **Phase 5**: 알림 시스템 ✅
- **Phase 6**: UX 개선 ✅

**총 코드 라인**: 8,154줄 | **총 커밋**: 19개 | **총 파일**: 55개

## 📌 프로젝트 소개

Kunnective는 건국대학교 학생들이 자신의 아이디어를 공유하고, 함께할 팀원을 찾아 프로젝트를 시작할 수 있는 플랫폼입니다.

**우리의 철학**: 개발자, 디자이너, 기획자 같은 역할 제한을 두지 않습니다. 예술, 상업, 연구, 교육, 사회 공헌 등 모든 분야의 프로젝트를 환영합니다. 누구든 무엇이든 할 수 있는 자율적인 협업 환경을 제공합니다.

### 주요 기능

- 🎯 **아이디어 게시판**: 아이디어를 자유롭게 공유하고 피드백 받기
- 👥 **팀원 매칭**: 프로젝트에 필요한 팀원 모집 (기술, 예술, 비즈니스, 연구 등 모든 분야)
- 📝 **지원 시스템**: 관심있는 프로젝트에 지원하거나 스카웃 제안 받기
- 💬 **실시간 채팅**: 1:1 메시징 및 프로젝트 팀 그룹 채팅
- 🔔 **알림 시스템**: 지원 결과, 스카웃 제안, 새 메시지 등 실시간 알림
- 👤 **프로필 관리**: 전공, 학년, 기술/스킬, 관심 분야를 자유롭게 등록

### 향후 계획

- 🚀 창업 지원 (멘토링, 투자 연계)
- 🎓 다른 대학으로 확대
- 🤖 AI 기반 팀원 추천
- 📊 프로젝트 관리 도구 (Kanban)

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API, Zustand
- **Form**: React Hook Form + Zod

### Backend
- **BaaS**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Realtime**: Supabase Realtime (WebSocket)
- **Storage**: Supabase Storage

### Mobile (향후)
- **Framework**: React Native + Expo
- **Navigation**: Expo Router

### DevOps
- **Hosting**: Vercel (Web), Expo EAS (Mobile)
- **Package Manager**: pnpm
- **Version Control**: Git

## 📦 프로젝트 구조

```
project-maker/
├── README.md                   # 프로젝트 소개
├── techspec.md                 # 기술 명세서
├── .gitignore
├── pnpm-workspace.yaml         # pnpm workspace 설정
│
├── web/                        # Next.js 웹 애플리케이션
│   ├── app/                    # Next.js App Router
│   ├── components/             # React 컴포넌트
│   ├── lib/                    # 유틸리티 및 설정
│   └── types/                  # TypeScript 타입
│
├── mobile/                     # React Native 모바일 앱 (향후)
│
├── shared/                     # 웹과 모바일 공유 코드
│   ├── types/                  # 공통 타입 정의
│   ├── utils/                  # 공통 유틸 함수
│   └── constants/              # 공통 상수
│
├── supabase/                   # Supabase 설정
│   └── migrations/             # DB 마이그레이션
│
├── .claude/                    # Claude Code 서브에이전트
│   └── subagents/              # 개발 단계별 가이드
│       ├── setup-environment.md
│       ├── auth-system.md
│       ├── idea-board.md
│       ├── project-matching.md
│       └── chat-system.md
│
└── docs/                       # 문서
    ├── api.md
    ├── deployment.md
    └── development.md
```

## 🚀 시작하기

### 요구사항

- Node.js 18+
- pnpm 8+
- Supabase 계정

### 설치

1. **저장소 클론**
   ```bash
   git clone <repository-url>
   cd project-maker
   ```

2. **pnpm 설치** (없는 경우)
   ```bash
   npm install -g pnpm
   ```

3. **의존성 설치**
   ```bash
   pnpm install
   ```

4. **Supabase 프로젝트 생성**
   - [Supabase](https://supabase.com)에서 새 프로젝트 생성
   - Project URL과 anon key 복사

5. **환경 변수 설정**
   ```bash
   cd web
   cp .env.local.example .env.local
   ```

   `.env.local` 파일에 Supabase 정보 입력:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

6. **개발 서버 실행**
   ```bash
   cd web
   pnpm dev
   ```

7. **브라우저에서 열기**
   ```
   http://localhost:3000
   ```

## 📚 개발 가이드

이 프로젝트는 Claude Code와 함께 개발됩니다. 각 개발 단계별로 서브에이전트 가이드가 준비되어 있습니다.

### 서브에이전트 가이드

1. **[환경 설정](.claude/subagents/setup-environment.md)**
   - Next.js 프로젝트 초기화
   - TypeScript, Tailwind CSS 설정
   - Supabase 클라이언트 설정

2. **[인증 시스템](.claude/subagents/auth-system.md)**
   - 회원가입/로그인
   - 건국대 이메일 검증
   - 사용자 프로필 관리

3. **[아이디어 게시판](.claude/subagents/idea-board.md)**
   - 아이디어 CRUD
   - 검색 및 필터링
   - 좋아요/북마크

4. **[프로젝트 매칭](.claude/subagents/project-matching.md)**
   - 프로젝트 생성 및 관리
   - 지원/스카웃 시스템
   - 팀원 관리

5. **[채팅 시스템](.claude/subagents/chat-system.md)**
   - 1:1 메시징
   - 그룹 채팅
   - 실시간 메시지

### 개발 워크플로우

1. 각 서브에이전트 가이드를 순서대로 따라가세요
2. 데이터베이스 스키마는 `supabase/migrations/`에 SQL 파일로 저장
3. API 함수는 `web/lib/api/`에 작성
4. UI 컴포넌트는 `web/components/`에 작성
5. 타입 정의는 `shared/types/`에 작성하여 공유

## 🔒 보안

- 건국대 이메일(@konkuk.ac.kr, @kku.ac.kr)만 가입 가능
- 비밀번호 정책: 8자 이상, 대소문자/숫자/특수문자 포함
- Supabase Row Level Security (RLS) 적용
- 환경 변수로 API 키 관리
- HTTPS 강제

## 📊 데이터베이스 스키마

주요 테이블:
- `users`: 사용자 프로필
- `ideas`: 아이디어
- `projects`: 프로젝트
- `applications`: 지원서
- `scouts`: 스카웃 제안
- `chat_rooms`: 채팅방
- `messages`: 메시지
- `notifications`: 알림

상세한 스키마는 [techspec.md](./techspec.md)를 참고하세요.

## 🧪 테스트

```bash
# 단위 테스트 (향후)
pnpm test

# E2E 테스트 (향후)
pnpm test:e2e
```

## 🚢 배포

### 웹 (Vercel)

1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 자동 배포

```bash
vercel --prod
```

### 모바일 (Expo EAS) - 향후

```bash
cd mobile
eas build --platform all
```

## 📝 라이센스

MIT License

## 👥 기여

이 프로젝트는 현재 개발 중입니다. 기여를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 연락처

프로젝트 관리자: Jaeyun
- 대학: 건국대학교
- GitHub: [프로젝트 저장소]

## 🙏 감사의 말

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Claude Code](https://claude.com/claude-code)

---

**Made with ❤️ for Konkuk University Students**
