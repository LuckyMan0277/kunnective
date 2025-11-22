# 건국대 아이디어 공유 & 팀 빌딩 플랫폼 기술 명세서

## 📋 프로젝트 개요

### 프로젝트 정보
- **프로젝트명**: KU-Connect (가칭)
- **목표**: 건국대학교 학생들의 아이디어 공유, 팀원 매칭, 프로젝트 협업을 위한 플랫폼
- **대상 사용자**: 건국대학교 재학생 (@konkuk.ac.kr 이메일 보유자)
- **플랫폼**: 웹 + 모바일 멀티플랫폼
- **개발 형태**: 1인 개발 (AI 지원)
- **예산**: 무료 티어 우선 사용

### 비즈니스 목표
1. 건국대생들의 아이디어를 쉽게 공유하고 피드백 받을 수 있는 환경 제공
2. 프로젝트 팀원을 효율적으로 찾을 수 있는 매칭 시스템
3. 향후 창업 지원 플랫폼으로 확장

---

## 🛠️ 기술 스택

### Frontend

#### 웹 (Web)
- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript 5.0+
- **스타일링**: Tailwind CSS 3.0+
- **상태관리**: React Context API + Zustand (필요시)
- **폼 관리**: React Hook Form + Zod (validation)
- **UI 컴포넌트**: shadcn/ui (Radix UI 기반)
- **아이콘**: Lucide React
- **배포**: Vercel (무료 티어)

**선택 이유**:
- App Router의 서버 컴포넌트로 성능 최적화
- Vercel 무료 배포로 비용 절감
- TypeScript로 타입 안정성 확보
- Tailwind CSS로 빠른 UI 개발

#### 모바일 (Mobile)
- **프레임워크**: React Native + Expo
- **언어**: TypeScript
- **내비게이션**: Expo Router (React Navigation 기반)
- **스타일링**: NativeWind (Tailwind for React Native)
- **배포**: Expo EAS (무료 티어)

**선택 이유**:
- 웹과 코드 공유 가능 (types, utils, business logic)
- Expo로 쉬운 빌드 및 배포
- 하나의 언어(TypeScript)로 전체 개발

### Backend

#### BaaS (Backend as a Service)
- **플랫폼**: Supabase
- **데이터베이스**: PostgreSQL 15+
- **인증**: Supabase Auth (Email + OAuth)
- **실시간**: Supabase Realtime (채팅용)
- **스토리지**: Supabase Storage (프로필 이미지, 파일)
- **API**: Auto-generated REST API + Row Level Security (RLS)

**선택 이유**:
- 무료 티어 넉넉함 (500MB DB, 1GB Storage, 2GB 전송량)
- PostgreSQL로 복잡한 쿼리 가능
- 실시간 기능 내장 (WebSocket)
- RLS로 보안 강화
- 백엔드 코드 최소화

#### 대체 옵션
- **Firebase**: 더 쉬운 시작, 하지만 복잡한 쿼리에 제한적
- **선택한 이유**: PostgreSQL의 강력한 관계형 쿼리가 매칭 시스템에 적합

### 개발 도구
- **패키지 매니저**: pnpm (빠른 속도, 디스크 효율)
- **버전 관리**: Git + GitHub
- **코드 포맷팅**: Prettier
- **린팅**: ESLint
- **타입 체킹**: TypeScript strict mode
- **환경 변수**: .env.local (Next.js), .env (Expo)

---

## 📱 핵심 기능 명세

### Phase 1: 핵심 기능 (MVP) - 4~6주

#### 1. 사용자 인증 및 관리
**기능**:
- 건국대 이메일 인증 (@konkuk.ac.kr)
- 이메일 인증 링크 발송
- 소셜 로그인 (Google OAuth - 추후)
- 로그인/로그아웃
- 비밀번호 재설정

**기술 구현**:
- Supabase Auth 사용
- 이메일 도메인 검증 로직
- Protected routes (middleware)

**보안 요구사항**:
- 건국대 이메일만 가입 허용
- 이메일 인증 필수
- HTTPS 통신
- CSRF 보호

#### 2. 사용자 프로필
**기능**:
- 프로필 생성/수정
- 프로필 정보:
  - 기본 정보: 이름, 학과, 학년, 자기소개
  - 기술 스택 (다중 선택, 태그 방식)
  - 관심 분야 (다중 선택)
  - 포트폴리오 링크 (GitHub, Notion 등)
  - 프로필 이미지
- 다른 사용자 프로필 조회
- 프로필 검색

**기술 구현**:
- Supabase Storage (이미지 업로드)
- 태그 시스템 (많이 사용되는 기술 스택 미리 정의)
- 이미지 최적화 (Next.js Image)

**데이터 모델**:
```typescript
interface UserProfile {
  id: string;
  email: string;
  name: string;
  major: string;
  year: number;
  bio: string;
  skills: string[]; // ['React', 'Python', 'Figma']
  interests: string[]; // ['웹개발', 'AI', '창업']
  portfolio_url?: string;
  github_url?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}
```

#### 3. 아이디어 게시판
**기능**:
- 아이디어 등록/수정/삭제 (CRUD)
- 아이디어 정보:
  - 제목, 설명 (Markdown 지원)
  - 카테고리 (IT, 디자인, 비즈니스, 소셜, 교육 등)
  - 태그
  - 필요한 역할/기술 스택
- 아이디어 목록 조회 (페이지네이션)
- 좋아요 기능
- 북마크 기능
- 검색 (제목, 설명, 태그)
- 필터링 (카테고리, 태그, 인기순, 최신순)

**기술 구현**:
- Markdown 에디터 및 렌더러
- PostgreSQL Full-text search
- 낙관적 업데이트 (좋아요)
- Infinite scroll (무한 스크롤)

**데이터 모델**:
```typescript
interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string; // Markdown
  category: string;
  tags: string[];
  required_skills: string[];
  likes_count: number;
  created_at: Date;
  updated_at: Date;
}

interface IdeaLike {
  idea_id: string;
  user_id: string;
  created_at: Date;
}

interface IdeaBookmark {
  idea_id: string;
  user_id: string;
  created_at: Date;
}
```

### Phase 2: 팀 매칭 시스템 - 3~4주

#### 4. 프로젝트 팀 빌딩
**기능**:
- 프로젝트 생성 (아이디어 기반 또는 독립)
- 프로젝트 정보:
  - 제목, 설명
  - 필요한 역할 및 인원 (예: 프론트엔드 1명, 디자이너 1명)
  - 요구 기술 스택
  - 프로젝트 기간
  - 모집 상태 (모집 중, 모집 완료)
- 팀원 모집 공고 목록
- 프로젝트 상세 페이지
- 검색 및 필터링

**기술 구현**:
- 아이디어와 프로젝트 연결 (선택적)
- 역할별 모집 상태 관리
- 복합 필터링 쿼리

**데이터 모델**:
```typescript
interface Project {
  id: string;
  idea_id?: string; // optional
  owner_id: string;
  title: string;
  description: string;
  required_roles: ProjectRole[]; // [{ role: 'Frontend', count: 1, filled: 0 }]
  tech_stack: string[];
  duration?: string;
  status: 'recruiting' | 'in_progress' | 'completed';
  created_at: Date;
  updated_at: Date;
}

interface ProjectRole {
  role: string;
  count: number;
  filled: number;
  required_skills?: string[];
}
```

#### 5. 지원 및 스카웃 시스템
**기능**:
- 프로젝트 지원
  - 지원서 작성 (지원 동기, 역할, 기여 방법)
  - 지원 내역 관리
- 지원서 관리 (프로젝트 관리자)
  - 지원자 목록 조회
  - 지원 수락/거절
  - 지원자 프로필 확인
- 스카웃 기능
  - 프로젝트 관리자가 유저 검색
  - 스카웃 제안 발송
  - 스카웃 수락/거절
- 알림 (지원 결과, 스카웃 제안)

**기술 구현**:
- 지원 상태 관리 (pending, accepted, rejected)
- 스카웃 제안 시스템
- 실시간 알림 (Supabase Realtime)

**데이터 모델**:
```typescript
interface Application {
  id: string;
  project_id: string;
  user_id: string;
  role: string; // 지원 역할
  message: string; // 지원 동기
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

interface Scout {
  id: string;
  project_id: string;
  from_user_id: string; // 프로젝트 관리자
  to_user_id: string; // 스카웃 대상
  role: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date;
}

interface ProjectMember {
  project_id: string;
  user_id: string;
  role: string;
  joined_at: Date;
}
```

#### 6. 실시간 채팅
**기능**:
- 1:1 메시징
  - 메시지 전송/수신
  - 읽음 표시
  - 대화 목록
- 그룹 채팅 (프로젝트별)
  - 프로젝트 팀원 간 단체 채팅
  - 공지사항 고정
- 메시지 기록 조회
- 실시간 업데이트

**기술 구현**:
- Supabase Realtime Subscriptions
- 메시지 페이지네이션
- 읽음 처리 로직
- WebSocket 연결 관리

**데이터 모델**:
```typescript
interface ChatRoom {
  id: string;
  type: 'direct' | 'group';
  project_id?: string; // 그룹 채팅인 경우
  name?: string;
  created_at: Date;
}

interface ChatParticipant {
  room_id: string;
  user_id: string;
  joined_at: Date;
  last_read_at: Date;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: Date;
  is_read: boolean;
}
```

### Phase 3: UX 개선 - 2~3주

#### 7. 알림 시스템
**기능**:
- 알림 유형:
  - 프로젝트 지원 (새 지원서, 지원 결과)
  - 스카웃 제안
  - 새 메시지
  - 프로젝트 업데이트
  - 아이디어 좋아요
- 알림 센터 (목록, 읽음 표시)
- 실시간 알림 뱃지
- 이메일 알림 (선택적)

**기술 구현**:
- Supabase Realtime으로 실시간 알림
- 알림 읽음 상태 관리
- 푸시 알림 (모바일 - 추후)

**데이터 모델**:
```typescript
interface Notification {
  id: string;
  user_id: string;
  type: 'application' | 'scout' | 'message' | 'like' | 'project_update';
  title: string;
  content: string;
  link?: string; // 클릭 시 이동할 링크
  is_read: boolean;
  created_at: Date;
}
```

#### 8. UX 개선
- 반응형 디자인 (모바일, 태블릿, 데스크톱)
- 로딩 상태 (Skeleton UI)
- 에러 핸들링 및 사용자 피드백
- Toast 알림
- 접근성 (ARIA, 키보드 네비게이션)
- 다크 모드 (선택적)

---

## 🗂️ 데이터베이스 스키마

### ERD 개요
```
users (1) ──── (N) ideas
users (1) ──── (N) projects (owner)
users (N) ──── (N) projects (members via project_members)
ideas (1) ──── (1) projects (optional)
projects (1) ──── (N) applications
projects (1) ──── (N) scouts
users (N) ──── (N) chat_rooms (via chat_participants)
chat_rooms (1) ──── (N) messages
users (1) ──── (N) notifications
```

### 주요 테이블

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  major VARCHAR(100),
  year INTEGER,
  bio TEXT,
  skills TEXT[], -- 배열
  interests TEXT[],
  portfolio_url VARCHAR(500),
  github_url VARCHAR(500),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### ideas
```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  tags TEXT[],
  required_skills TEXT[],
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ideas_user_id ON ideas(user_id);
CREATE INDEX idx_ideas_category ON ideas(category);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);
```

#### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  required_roles JSONB, -- [{ role, count, filled, required_skills }]
  tech_stack TEXT[],
  duration VARCHAR(100),
  status VARCHAR(20) DEFAULT 'recruiting', -- recruiting, in_progress, completed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
```

#### applications
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id, role)
);

CREATE INDEX idx_applications_project_id ON applications(project_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
```

#### project_members
```sql
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);
```

#### chat_rooms
```sql
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL, -- direct, group
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

#### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

### Row Level Security (RLS) 정책

모든 테이블에 RLS 적용:
- users: 본인 프로필만 수정, 모든 프로필 조회 가능
- ideas: 본인 아이디어만 수정/삭제, 모든 아이디어 조회 가능
- projects: 프로젝트 owner만 수정/삭제
- applications: 본인 지원서만 조회/수정, 프로젝트 owner는 모든 지원서 조회
- messages: 채팅방 참여자만 메시지 조회/전송
- notifications: 본인 알림만 조회

---

## 📦 프로젝트 구조

```
project-maker/
├── README.md
├── techspec.md                 # 이 문서
├── .gitignore
├── pnpm-workspace.yaml         # pnpm workspace 설정
│
├── web/                        # Next.js 웹 애플리케이션
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── .env.local.example
│   ├── public/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # 홈페이지
│   │   ├── (auth)/             # 인증 관련 라우트
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── layout.tsx
│   │   ├── (main)/             # 메인 앱 라우트
│   │   │   ├── ideas/          # 아이디어 게시판
│   │   │   ├── projects/       # 프로젝트
│   │   │   ├── profile/        # 프로필
│   │   │   ├── chat/           # 채팅
│   │   │   └── layout.tsx
│   │   └── api/                # API routes (필요시)
│   ├── components/             # React 컴포넌트
│   │   ├── ui/                 # shadcn/ui 컴포넌트
│   │   ├── ideas/              # 아이디어 관련 컴포넌트
│   │   ├── projects/           # 프로젝트 관련 컴포넌트
│   │   ├── chat/               # 채팅 관련 컴포넌트
│   │   └── layout/             # 레이아웃 컴포넌트
│   ├── lib/                    # 유틸리티 및 설정
│   │   ├── supabase/
│   │   │   ├── client.ts       # Supabase 클라이언트
│   │   │   ├── server.ts       # 서버용 Supabase
│   │   │   └── middleware.ts   # Auth middleware
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils.ts            # 유틸 함수
│   │   └── constants.ts        # 상수 정의
│   ├── types/                  # TypeScript 타입 정의
│   │   ├── database.ts         # Supabase 생성 타입
│   │   └── index.ts
│   └── styles/
│       └── globals.css
│
├── mobile/                     # React Native 모바일 앱
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── app/                    # Expo Router
│   │   ├── (auth)/
│   │   ├── (tabs)/
│   │   └── _layout.tsx
│   ├── components/
│   ├── lib/
│   └── assets/
│
├── shared/                     # 웹과 모바일이 공유하는 코드
│   ├── package.json
│   ├── types/                  # 공통 타입 정의
│   │   ├── user.ts
│   │   ├── idea.ts
│   │   ├── project.ts
│   │   └── index.ts
│   ├── utils/                  # 공통 유틸 함수
│   │   ├── validation.ts       # Zod 스키마
│   │   └── helpers.ts
│   └── constants/              # 공통 상수
│       └── index.ts
│
├── supabase/                   # Supabase 설정
│   ├── migrations/             # DB 마이그레이션
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_rls.sql
│   │   └── ...
│   ├── seed.sql                # 초기 데이터
│   └── config.toml             # Supabase 설정
│
└── docs/                       # 문서
    ├── api.md                  # API 문서
    ├── deployment.md           # 배포 가이드
    └── development.md          # 개발 가이드
```

---

## 🚀 개발 로드맵

### Phase 0: 환경 설정 (1일)
- [x] 프로젝트 디렉토리 구조 생성
- [ ] pnpm workspace 설정
- [ ] Next.js 프로젝트 초기화
- [ ] TypeScript, Tailwind CSS 설정
- [ ] Supabase 프로젝트 생성 및 연동
- [ ] Git 저장소 초기화
- [ ] shadcn/ui 설치
- [ ] 기본 레이아웃 및 테마 설정

### Phase 1: 인증 & 프로필 (1주)
- [ ] Supabase Auth 연동
- [ ] 회원가입 페이지 (건국대 이메일 검증)
- [ ] 로그인/로그아웃
- [ ] 프로필 생성 페이지
- [ ] 프로필 수정 페이지
- [ ] 프로필 조회 페이지
- [ ] 이미지 업로드 기능
- [ ] Protected routes 설정

### Phase 2: 아이디어 게시판 (1-2주)
- [ ] 데이터베이스 스키마 생성 (ideas, likes, bookmarks)
- [ ] 아이디어 목록 페이지 (무한 스크롤)
- [ ] 아이디어 상세 페이지
- [ ] 아이디어 작성 페이지 (Markdown 에디터)
- [ ] 아이디어 수정/삭제
- [ ] 좋아요 기능
- [ ] 북마크 기능
- [ ] 검색 기능
- [ ] 필터링 (카테고리, 태그, 정렬)

### Phase 3: 프로젝트 & 매칭 시스템 (2주)
- [ ] 데이터베이스 스키마 (projects, applications, scouts, members)
- [ ] 프로젝트 생성 페이지
- [ ] 프로젝트 목록 페이지
- [ ] 프로젝트 상세 페이지
- [ ] 지원하기 기능
- [ ] 지원서 관리 (프로젝트 owner)
- [ ] 스카웃 기능
- [ ] 팀원 수락/거절
- [ ] 프로젝트 멤버 관리

### Phase 4: 채팅 시스템 (1-2주)
- [ ] 데이터베이스 스키마 (chat_rooms, messages, participants)
- [ ] 채팅방 목록
- [ ] 1:1 채팅 UI
- [ ] 그룹 채팅 UI
- [ ] 실시간 메시지 전송/수신 (Supabase Realtime)
- [ ] 읽음 표시
- [ ] 메시지 페이지네이션

### Phase 5: 알림 시스템 (1주)
- [ ] 데이터베이스 스키마 (notifications)
- [ ] 알림 센터 UI
- [ ] 실시간 알림 뱃지
- [ ] 알림 생성 로직 (triggers)
- [ ] 알림 읽음 처리

### Phase 6: UX 개선 (1주)
- [ ] 반응형 디자인 최적화
- [ ] Skeleton 로딩 UI
- [ ] 에러 바운더리 및 에러 핸들링
- [ ] Toast 알림
- [ ] 접근성 개선
- [ ] 성능 최적화
- [ ] SEO 최적화 (메타 태그)

### Phase 7: 모바일 앱 (2-3주)
- [ ] React Native + Expo 프로젝트 초기화
- [ ] 공유 코드 연동 (types, utils)
- [ ] 주요 화면 구현 (홈, 아이디어, 프로젝트, 프로필, 채팅)
- [ ] 네비게이션 설정
- [ ] Supabase 연동
- [ ] 푸시 알림 (선택적)
- [ ] 앱 아이콘 및 스플래시 스크린

### Phase 8: 테스트 & 배포 (1주)
- [ ] 버그 수정
- [ ] 사용자 테스트
- [ ] Vercel 배포 (웹)
- [ ] Expo EAS 빌드 (모바일)
- [ ] 도메인 연결 (선택적)
- [ ] 모니터링 설정

---

## 💰 비용 계획

### 무료 티어 제한
- **Supabase Free Tier**:
  - Database: 500MB
  - Storage: 1GB
  - Bandwidth: 2GB/month
  - Edge Functions: 500K requests/month
  - Realtime: Unlimited connections (동시 접속 제한 있음)

- **Vercel Free Tier**:
  - Bandwidth: 100GB/month
  - Builds: 6000 build minutes/month
  - Serverless Functions: Unlimited

- **Expo EAS Free Tier**:
  - Builds: 제한적 (우선순위 낮음)
  - Updates: 무제한

### 확장 시 비용 (예상)
- Supabase Pro: $25/month (8GB DB, 100GB Storage)
- Vercel Pro: $20/month (1TB bandwidth)
- Expo EAS: $29/month (우선 빌드)

**총 예상 비용 (확장 시)**: ~$75/month

---

## 🔒 보안 고려사항

1. **인증 보안**
   - 건국대 이메일 도메인 검증
   - 이메일 인증 필수
   - 비밀번호 해싱 (Supabase 자동 처리)
   - HTTPS 강제

2. **데이터 보안**
   - Row Level Security (RLS) 적용
   - 민감 정보 암호화
   - 환경 변수로 API 키 관리
   - CORS 설정

3. **입력 검증**
   - Zod로 클라이언트 검증
   - Supabase에서 서버 검증
   - XSS 방지 (sanitization)
   - SQL Injection 방지 (parameterized queries)

4. **파일 업로드**
   - 파일 크기 제한 (5MB)
   - 파일 타입 검증 (이미지만)
   - 바이러스 스캔 (추후)

---

## 📊 성능 최적화

1. **프론트엔드**
   - Next.js 서버 컴포넌트 활용
   - 이미지 최적화 (next/image)
   - 코드 스플리팅
   - 번들 크기 최소화
   - 캐싱 전략

2. **데이터베이스**
   - 인덱스 최적화
   - 쿼리 최적화
   - 페이지네이션
   - Connection pooling

3. **실시간 기능**
   - WebSocket 연결 관리
   - 메시지 배치 처리
   - 불필요한 구독 해제

---

## 🧪 테스트 전략

1. **단위 테스트** (선택적)
   - 유틸 함수 테스트
   - 컴포넌트 테스트 (React Testing Library)

2. **통합 테스트** (선택적)
   - API 테스트
   - E2E 테스트 (Playwright)

3. **수동 테스트** (필수)
   - 기능 테스트
   - UI/UX 테스트
   - 크로스 브라우저 테스트
   - 모바일 반응형 테스트

---

## 📈 향후 확장 계획 (Phase 2 이후)

### 단기 (3-6개월)
- 다른 대학으로 확대
- AI 기반 팀원 추천
- 프로젝트 관리 도구 (Kanban 보드, 일정 관리)
- 멘토링 시스템
- 포트폴리오 생성 기능

### 중기 (6-12개월)
- 창업 지원 (투자 연계, IR 피칭)
- 대학 공식 파트너십
- 기업 협업 프로젝트
- 해커톤 통합
- 성과 인증 시스템 (배지, 수료증)

### 장기 (12개월+)
- 전국 대학 네트워크
- 글로벌 확장
- AI 코칭 시스템
- 수익 모델 (프리미엄 기능, 기업 스폰서)

---

## 🎯 성공 지표 (KPI)

### MVP 단계
- 건국대 학생 가입자 수: 100명
- 등록된 아이디어 수: 50개
- 생성된 프로젝트 수: 10개
- 매칭 성공률: 30%

### 성장 단계
- MAU (월간 활성 사용자): 500명
- 프로젝트 완료율: 50%
- 사용자 만족도: 4.0/5.0
- 창업 전환율: 5%

---

## 📚 참고 자료

### 기술 문서
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

### 유사 플랫폼 벤치마킹
- LinkedIn (프로페셔널 네트워킹)
- 원티드 (채용 매칭)
- 디스콰이엇 (개발자 커뮤니티)
- ProductHunt (아이디어 공유)

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2024-11-23 | 1.0.0 | 초기 기술 명세서 작성 | Claude Code |

---

## 👥 팀 & 연락처

- **개발자**: Jaeyun
- **AI 지원**: Claude Code
- **대학**: 건국대학교
- **프로젝트 저장소**: (추후 추가)

---

**문서 끝**
