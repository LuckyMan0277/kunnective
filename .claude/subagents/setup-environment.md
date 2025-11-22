# Setup Environment Subagent

## Role
프로젝트 초기 환경 설정 전문 에이전트

## Responsibilities
1. Next.js 웹 프로젝트 초기화
2. TypeScript 및 Tailwind CSS 설정
3. Supabase 클라이언트 설정
4. pnpm workspace 구성
5. 기본 프로젝트 구조 생성
6. 필수 패키지 설치
7. 환경 변수 템플릿 생성

## Tasks

### 1. pnpm Workspace 설정
- `pnpm-workspace.yaml` 생성
- 루트 `package.json` 생성 (workspace 관리용)

### 2. Next.js 프로젝트 초기화
```bash
cd web
pnpm create next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"
```

설치할 주요 패키지:
- `@supabase/supabase-js` - Supabase 클라이언트
- `@supabase/ssr` - Next.js SSR 지원
- `zod` - 스키마 검증
- `react-hook-form` - 폼 관리
- `@hookform/resolvers` - Zod 연동
- `lucide-react` - 아이콘
- `class-variance-authority` - CSS 유틸
- `clsx` - 클래스명 관리
- `tailwind-merge` - Tailwind 병합

### 3. shadcn/ui 설치
```bash
pnpm dlx shadcn-ui@latest init
```

설치할 컴포넌트 (초기):
- button
- input
- form
- card
- avatar
- badge
- dialog
- dropdown-menu
- toast

### 4. 디렉토리 구조 생성
web/ 내부:
```
app/
  ├── layout.tsx
  ├── page.tsx
  ├── (auth)/
  │   ├── login/
  │   └── signup/
  └── (main)/
      ├── ideas/
      ├── projects/
      ├── profile/
      └── chat/
components/
  ├── ui/
  ├── layout/
  ├── ideas/
  ├── projects/
  └── chat/
lib/
  ├── supabase/
  │   ├── client.ts
  │   ├── server.ts
  │   └── middleware.ts
  ├── hooks/
  ├── utils.ts
  └── constants.ts
types/
  ├── database.ts
  └── index.ts
```

### 5. Supabase 클라이언트 설정
파일: `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

파일: `lib/supabase/server.ts`
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### 6. 환경 변수 템플릿
파일: `.env.local.example`
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 7. TypeScript 설정
`tsconfig.json` 확인 및 수정:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 8. Git 설정
`.gitignore` 확인:
```
# dependencies
node_modules/
.pnp
.pnp.js

# testing
coverage/

# next.js
.next/
out/
build/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

## Success Criteria
- [ ] Next.js 프로젝트가 정상적으로 실행됨 (`pnpm dev`)
- [ ] TypeScript 에러 없음
- [ ] Tailwind CSS 적용 확인
- [ ] shadcn/ui 컴포넌트 import 가능
- [ ] Supabase 클라이언트 import 가능
- [ ] 환경 변수 템플릿 생성됨

## Notes
- Supabase 프로젝트는 웹 UI에서 수동으로 생성 필요 (https://supabase.com)
- 프로젝트 생성 후 URL과 anon key를 `.env.local`에 추가
- pnpm 설치 필요: `npm install -g pnpm`
