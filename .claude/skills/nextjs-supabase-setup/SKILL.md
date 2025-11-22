---
name: nextjs-supabase-setup
description: "Next.js 프로젝트에서 Supabase를 설정할 때 사용합니다. 환경변수 설정, Supabase 클라이언트 생성, TypeScript 타입 정의, middleware 설정을 자동화합니다. 'Supabase 설정', 'Supabase 초기화', 'Supabase 연동' 등의 요청에 활성화됩니다."
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Next.js + Supabase 통합 설정 스킬

이 스킬은 Next.js 프로젝트에 Supabase를 통합하는 모든 설정을 자동화합니다.

## 주요 기능

### 1. 패키지 설치
```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### 2. 환경 변수 설정

**파일**: `web/.env.local.example`
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**파일**: `web/.env.local` (gitignore에 포함)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 3. Supabase 클라이언트 생성

**파일**: `web/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**파일**: `web/lib/supabase/server.ts`
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
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // 서버 컴포넌트에서는 set 불가능
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // 서버 컴포넌트에서는 remove 불가능
          }
        },
      },
    }
  )
}
```

### 4. Middleware 설정 (인증용)

**파일**: `web/middleware.ts`
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 5. TypeScript 타입 생성

Supabase CLI 설치 및 타입 생성:
```bash
pnpm add -D supabase
npx supabase login
npx supabase init
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > web/types/database.ts
```

### 6. 디렉토리 구조 확인

```
web/
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── types/
│   └── database.ts
├── middleware.ts
├── .env.local
└── .env.local.example
```

## 사용 시나리오

이 스킬은 다음과 같은 요청에 자동으로 활성화됩니다:

- "Supabase를 설정해줘"
- "Next.js에 Supabase를 연동하고 싶어"
- "Supabase 클라이언트를 만들어줘"
- "Supabase 환경변수를 설정해줘"

## 체크리스트

설정 완료 후 확인:
- [ ] `@supabase/supabase-js`, `@supabase/ssr` 패키지 설치됨
- [ ] `.env.local` 파일 생성됨 (gitignore 포함)
- [ ] `lib/supabase/client.ts` 파일 생성됨
- [ ] `lib/supabase/server.ts` 파일 생성됨
- [ ] `middleware.ts` 파일 생성됨
- [ ] Supabase 프로젝트 URL과 anon key가 환경변수에 추가됨

## 참고 자료

- [Supabase Next.js 공식 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase SSR 문서](https://supabase.com/docs/guides/auth/server-side/nextjs)
