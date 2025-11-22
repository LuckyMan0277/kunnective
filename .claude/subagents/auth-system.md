# Authentication System Subagent

## Role
사용자 인증 및 프로필 관리 시스템 구축 전문 에이전트

## Responsibilities
1. Supabase Auth 연동
2. 건국대 이메일 검증 로직
3. 회원가입/로그인 UI 구현
4. 사용자 프로필 CRUD
5. Protected routes 설정
6. 이미지 업로드 기능

## Database Schema

### users 테이블 (Supabase Auth 확장)
```sql
-- Supabase는 auth.users 테이블을 자동 생성
-- public.users 테이블로 프로필 정보 확장
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  major VARCHAR(100),
  year INTEGER CHECK (year >= 1 AND year <= 4),
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  portfolio_url VARCHAR(500),
  github_url VARCHAR(500),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 프로필 조회 가능
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

-- 본인 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- 회원가입 시 프로필 생성
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 인덱스
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_skills ON public.users USING GIN(skills);
CREATE INDEX idx_users_interests ON public.users USING GIN(interests);

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## TypeScript Types

파일: `shared/types/user.ts`
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  major: string | null;
  year: number | null;
  bio: string | null;
  skills: string[];
  interests: string[];
  portfolio_url: string | null;
  github_url: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  name: string;
  major?: string;
  year?: number;
  bio?: string;
  skills?: string[];
  interests?: string[];
  portfolio_url?: string;
  github_url?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}
```

## Validation Schemas

파일: `shared/utils/validation.ts`
```typescript
import { z } from 'zod';

export const signUpSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일을 입력하세요')
    .endsWith('@konkuk.ac.kr', '건국대 이메일(@konkuk.ac.kr)만 사용 가능합니다'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Za-z]/, '비밀번호에 영문자가 포함되어야 합니다')
    .regex(/[0-9]/, '비밀번호에 숫자가 포함되어야 합니다'),
  name: z
    .string()
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(50, '이름은 50자를 초과할 수 없습니다'),
});

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(50),
  major: z.string().optional(),
  year: z.number().min(1).max(4).optional(),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()).max(20).optional(),
  interests: z.array(z.string()).max(10).optional(),
  portfolio_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
});
```

## Authentication Hooks

파일: `web/lib/hooks/useAuth.ts`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 현재 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return { user, loading };
}
```

파일: `web/lib/hooks/useUser.ts`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { User } from '@/shared/types/user';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export function useUser() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    // 프로필 정보 가져오기
    const fetchUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!error && data) {
        setUser(data as User);
      }
      setLoading(false);
    };

    fetchUser();
  }, [authUser, supabase]);

  return { user, loading };
}
```

## UI Components

### 1. 회원가입 페이지
파일: `web/app/(auth)/signup/page.tsx`

주요 기능:
- 건국대 이메일 검증
- 이름 입력
- 비밀번호 입력 (확인 포함)
- 실시간 유효성 검사
- 에러 메시지 표시
- 회원가입 후 이메일 인증 안내

### 2. 로그인 페이지
파일: `web/app/(auth)/login/page.tsx`

주요 기능:
- 이메일/비밀번호 로그인
- "비밀번호 찾기" 링크
- "회원가입" 링크
- 로그인 성공 시 메인 페이지로 리다이렉트

### 3. 프로필 생성/수정 페이지
파일: `web/app/(main)/profile/edit/page.tsx`

주요 기능:
- 프로필 이미지 업로드 (드래그 앤 드롭)
- 기본 정보 입력 (이름, 학과, 학년, 자기소개)
- 기술 스택 선택 (태그 입력)
- 관심 분야 선택
- 포트폴리오/GitHub 링크
- 실시간 미리보기

### 4. 프로필 조회 페이지
파일: `web/app/(main)/profile/[id]/page.tsx`

주요 기능:
- 사용자 프로필 정보 표시
- 작성한 아이디어 목록
- 참여 중인 프로젝트 목록
- 1:1 메시지 보내기 버튼

## Middleware for Protected Routes

파일: `web/middleware.ts`
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 인증 필요한 페이지
  if (request.nextUrl.pathname.startsWith('/(main)') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 인증된 사용자가 로그인/회원가입 페이지 접근 시 메인으로
  if (
    (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup')) &&
    user
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

## Image Upload

파일: `web/lib/utils/uploadImage.ts`
```typescript
import { createClient } from '@/lib/supabase/client';

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const supabase = createClient();

  // 파일 크기 제한 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('파일 크기는 5MB를 초과할 수 없습니다');
  }

  // 파일 타입 검증
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다');
  }

  // 파일명 생성 (충돌 방지)
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // 업로드
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Public URL 가져오기
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath);

  return publicUrl;
}
```

## Storage Bucket Setup

Supabase 대시보드에서 수동 설정:
1. Storage > New Bucket
2. Bucket name: `avatars`
3. Public bucket: ✅
4. File size limit: 5MB
5. Allowed MIME types: `image/*`

## Constants

파일: `web/lib/constants.ts`
```typescript
// 기술 스택 목록 (자주 사용되는 것)
export const TECH_STACKS = [
  // Frontend
  'React', 'Vue', 'Angular', 'Next.js', 'Svelte',
  'TypeScript', 'JavaScript', 'HTML/CSS', 'Tailwind CSS',

  // Backend
  'Node.js', 'Python', 'Java', 'Spring', 'Django', 'Flask',
  'Express', 'NestJS', 'PHP', 'Ruby on Rails',

  // Mobile
  'React Native', 'Flutter', 'Swift', 'Kotlin',

  // Database
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase',

  // DevOps
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Vercel',

  // Design
  'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator',

  // Other
  'Git', 'GraphQL', 'REST API', 'WebSocket',
];

// 관심 분야
export const INTERESTS = [
  '웹 개발',
  '앱 개발',
  'AI/머신러닝',
  '데이터 사이언스',
  'UI/UX 디자인',
  '게임 개발',
  '블록체인',
  'IoT',
  '보안',
  '창업',
  '비즈니스',
  '마케팅',
  '교육',
];

// 학과 목록 (건국대)
export const MAJORS = [
  '컴퓨터공학부',
  '소프트웨어학과',
  '전자공학과',
  '경영학과',
  '경제학과',
  '디자인학과',
  // ... 더 추가
];
```

## Tasks

### Phase 1: Database Setup
- [ ] Supabase 프로젝트 생성
- [ ] users 테이블 생성 및 RLS 설정
- [ ] Storage bucket 생성 (avatars)
- [ ] 환경 변수 설정

### Phase 2: Auth UI
- [ ] 회원가입 페이지 구현
- [ ] 로그인 페이지 구현
- [ ] 비밀번호 재설정 페이지 (선택적)
- [ ] 이메일 인증 확인 페이지

### Phase 3: Profile
- [ ] 프로필 생성 페이지
- [ ] 프로필 수정 페이지
- [ ] 프로필 조회 페이지
- [ ] 이미지 업로드 기능
- [ ] 태그 입력 컴포넌트

### Phase 4: Protected Routes
- [ ] Middleware 설정
- [ ] 인증 상태 확인
- [ ] 리다이렉트 로직

## Success Criteria
- [ ] 건국대 이메일로 회원가입 가능
- [ ] 다른 도메인 이메일은 차단됨
- [ ] 로그인/로그아웃 정상 작동
- [ ] 프로필 CRUD 정상 작동
- [ ] 이미지 업로드 정상 작동
- [ ] Protected routes 정상 작동
- [ ] 반응형 UI

## Notes
- Supabase Auth는 자동으로 이메일 인증 링크 발송
- 이메일 템플릿은 Supabase 대시보드에서 커스터마이징 가능
- OAuth 로그인(Google)은 Supabase 대시보드에서 설정
