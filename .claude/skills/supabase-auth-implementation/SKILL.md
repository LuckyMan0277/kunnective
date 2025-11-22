---
name: supabase-auth-implementation
description: "Supabase Auth를 사용한 인증 시스템 구현을 돕습니다. 회원가입, 로그인, 로그아웃, 이메일 인증, 비밀번호 재설정 기능을 구현할 때 사용합니다. '회원가입 구현', '로그인 기능', 'Supabase Auth' 등의 요청에 활성화됩니다."
allowed-tools:
  - Read
  - Write
  - Edit
---

# Supabase 인증 시스템 구현 스킬

Supabase Auth를 사용하여 완전한 인증 시스템을 구축합니다.

## 주요 기능

### 1. 회원가입 (Sign Up)

```typescript
// app/(auth)/signup/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      alert(error.message)
    } else {
      alert('회원가입 완료! 이메일을 확인해주세요.')
      router.push('/login')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSignUp}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? '처리 중...' : '회원가입'}
      </button>
    </form>
  )
}
```

### 2. 로그인 (Sign In)

```typescript
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}
```

### 3. 로그아웃 (Sign Out)

```typescript
// components/LogoutButton.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return <button onClick={handleLogout}>로그아웃</button>
}
```

### 4. 인증 콜백 처리

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 에러 발생 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

### 5. 인증 상태 확인 Hook

```typescript
// lib/hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // 현재 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return { user, loading }
}
```

### 6. Protected Routes

```typescript
// middleware.ts에 추가
export async function middleware(request: NextRequest) {
  // ... Supabase 클라이언트 생성

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 인증 필요한 페이지
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 인증된 사용자가 로그인 페이지 접근 시
  if (
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/signup') &&
    user
  ) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}
```

### 7. 서버 컴포넌트에서 인증 확인

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>환영합니다, {user.email}!</div>
}
```

### 8. 이메일 도메인 검증 (건국대 전용)

```typescript
// utils/validation.ts
export function isKonkukEmail(email: string): boolean {
  return email.endsWith('@konkuk.ac.kr')
}

// 회원가입 시 사용
const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!isKonkukEmail(email)) {
    alert('건국대 이메일(@konkuk.ac.kr)만 사용 가능합니다.')
    return
  }

  // ... 나머지 회원가입 로직
}
```

### 9. 비밀번호 재설정

```typescript
// app/(auth)/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    })

    if (error) {
      alert(error.message)
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  if (sent) {
    return <div>비밀번호 재설정 이메일이 발송되었습니다.</div>
  }

  return (
    <form onSubmit={handleReset}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? '전송 중...' : '비밀번호 재설정'}
      </button>
    </form>
  )
}
```

### 10. OAuth 로그인 (Google)

```typescript
const handleGoogleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${location.origin}/auth/callback`,
    },
  })

  if (error) {
    alert(error.message)
  }
}
```

## Supabase 대시보드 설정

### 1. Email Templates 커스터마이징
- Authentication > Email Templates
- Confirm signup, Reset password 템플릿 수정

### 2. URL Configuration
- Authentication > URL Configuration
- Site URL: `http://localhost:3000` (개발), `https://yourdomain.com` (프로덕션)
- Redirect URLs 추가

### 3. OAuth Providers 설정
- Authentication > Providers
- Google 활성화 및 Client ID/Secret 입력

## 사용 시나리오

이 스킬은 다음 요청에 활성화됩니다:

- "회원가입 기능을 만들어줘"
- "로그인/로그아웃 구현해줘"
- "Supabase Auth를 사용하고 싶어"
- "인증 시스템을 구축해줘"
- "이메일 인증을 추가해줘"

## 체크리스트

- [ ] 회원가입 페이지 구현
- [ ] 로그인 페이지 구현
- [ ] 로그아웃 기능 구현
- [ ] 인증 콜백 라우트 설정
- [ ] useAuth hook 생성
- [ ] Protected routes 설정
- [ ] 이메일 도메인 검증 추가
- [ ] Supabase 대시보드 설정 확인

## 참고 자료

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Next.js Auth 가이드](https://supabase.com/docs/guides/auth/server-side/nextjs)
