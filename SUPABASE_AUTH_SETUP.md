# Supabase Auth 설정 가이드

## 건국대학교 이메일 인증 설정

Kunnective는 건국대학교 학생 전용 플랫폼으로, `@konkuk.ac.kr` 또는 `@kku.ac.kr` 이메일만 가입 가능합니다.

## 1. Supabase 프로젝트 설정

### Authentication 설정 (최신 UI 기준)

1. **Supabase Dashboard** 접속
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Authentication > Sign In / Providers** 이동

3. **User Signups 설정 확인**
   - `Allow new users to sign up`: ✅ Enabled
   - `Confirm email`: ✅ Enabled (이메일 확인 필수)

4. **Auth Providers 확인**
   - `Email`: ✅ Enabled (기본 활성화되어 있음)

### URL Configuration

5. **Authentication > URL Configuration** 이동

6. **Site URL 설정**
   ```
   Site URL: http://localhost:3000 (개발 중)
   또는: https://your-domain.com (배포 후)
   ```

7. **Redirect URLs 추가** ⚠️ **중요!**
   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback (배포 후)
   ```

   **설정 방법**:
   - `Authentication > URL Configuration`에서 "Redirect URLs" 섹션 찾기
   - "Add URL" 버튼 클릭
   - 위 URL들을 하나씩 추가
   - 배포 후 프로덕션 URL도 반드시 추가해야 합니다

### 비밀번호 정책 (선택사항)

8. **Authentication > Policies** 이동 (있는 경우)
   - 최소 길이: 8자
   - 복잡도: 대소문자, 숫자, 특수문자 포함 권장
   - *Note*: 현재 Supabase는 클라이언트 측 검증 권장

## 2. 이메일 템플릿 설정

### Email Templates 커스터마이징

1. **Authentication > Email Templates** 이동

2. **Confirm signup** 템플릿 수정
   ```html
   <h2>Kunnective 회원가입을 환영합니다!</h2>
   <p>아래 링크를 클릭하여 이메일 인증을 완료해주세요:</p>
   <p><a href="{{ .ConfirmationURL }}">이메일 인증하기</a></p>
   <p>건국대학교 학생 전용 팀 빌딩 플랫폼, Kunnective</p>
   ```

## 3. 환경 변수 설정

### `.env.local` 파일 생성

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase 키 확인 방법

1. Supabase Dashboard > Settings > API
2. `Project URL`과 `anon public` 키 복사
3. `.env.local`에 붙여넣기

## 4. 이메일 도메인 검증

현재 구현된 검증 로직:

```typescript
// lib/utils.ts
export function isKonkukEmail(email: string): boolean {
  const lowercaseEmail = email.toLowerCase().trim()
  return (
    lowercaseEmail.endsWith('@konkuk.ac.kr') ||
    lowercaseEmail.endsWith('@kku.ac.kr')
  )
}
```

### 추가 도메인 허용 방법

`@kku.ac.kr`, `@konkuk.ac.kr` 외 다른 도메인을 추가하려면:

```typescript
// lib/utils.ts 수정
export function isKonkukEmail(email: string): boolean {
  const lowercaseEmail = email.toLowerCase().trim()
  const allowedDomains = [
    '@konkuk.ac.kr',
    '@kku.ac.kr',
    // '@example.ac.kr', // 추가 도메인
  ]
  return allowedDomains.some(domain => lowercaseEmail.endsWith(domain))
}
```

## 5. 회원가입 플로우

### 사용자 회원가입 과정

1. 사용자가 `/auth/signup`에서 회원가입 양식 작성
2. 클라이언트 측에서 이메일 도메인 검증 (건국대 이메일만 허용)
3. Supabase Auth로 회원가입 요청
4. Supabase가 인증 이메일 발송
5. 사용자가 이메일의 링크 클릭
6. `/auth/callback`에서 인증 코드 처리
7. 이메일 인증 완료 후 **데이터베이스 트리거가 자동으로** `users` 테이블에 프로필 생성
8. `/auth/verified` 페이지로 리디렉션 (환영 메시지 표시)
9. 사용자가 메인 페이지로 이동하여 서비스 이용 시작

### 코드 흐름

```typescript
// 1. 이메일 도메인 검증
import { validateKonkukEmail, validatePassword } from '@/lib/utils'

const emailValidation = validateKonkukEmail(email)
if (!emailValidation.isValid) {
  setError(emailValidation.message)
  return
}

// 2. 비밀번호 검증
const passwordValidation = validatePassword(password)
if (!passwordValidation.isValid) {
  setError(passwordValidation.message)
  return
}

// 3. Supabase 회원가입
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { username, name } // metadata로 저장
  }
})

// 4. 프로필은 데이터베이스 트리거가 자동으로 생성합니다
// Migration 003_auto_create_user_profile.sql 참고
```

### 자동 프로필 생성 (Database Trigger)

이메일 인증 후, 데이터베이스 트리거가 자동으로 `users` 테이블에 프로필을 생성합니다.

**장점**:
- RLS 정책 우회 (`SECURITY DEFINER`로 실행)
- 클라이언트 코드에서 프로필 생성 로직 불필요
- 이메일 인증 후에만 프로필 생성 (보안 강화)
- 프로필 생성 실패 걱정 없음

**구현**:
```sql
-- supabase/migrations/003_auto_create_user_profile.sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, name, ...)
  VALUES (NEW.id, NEW.email, ...);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 6. 이메일 발송 설정 (프로덕션)

### Supabase 기본 SMTP 제한

- 개발 단계에서는 Supabase의 기본 SMTP 사용 (시간당 4개 이메일 제한)
- 프로덕션 배포 시 커스텀 SMTP 설정 필요

### 커스텀 SMTP 설정 (프로덕션 필수)

1. **Authentication > Settings > SMTP Settings** 이동

2. **SMTP 제공업체 선택 및 설정**
   - SendGrid (추천)
   - AWS SES
   - Mailgun
   - Gmail (테스트용)

3. **설정 예시 (SendGrid)**
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [SendGrid API Key]
   Sender Email: noreply@konkuk.ac.kr (또는 인증된 도메인)
   Sender Name: Kunnective
   ```

## 7. 보안 설정

### Row Level Security (RLS) 확인

`users` 테이블의 RLS 정책이 올바른지 확인:

```sql
-- 이미 000_reset_and_rebuild.sql에 포함됨
CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);
```

### Rate Limiting

Supabase는 기본적으로 Rate Limiting 제공:
- 회원가입: 시간당 동일 IP에서 제한된 요청만 허용
- 추가 보호가 필요한 경우 Supabase Dashboard에서 설정 가능

## 8. 테스트

### 로컬 테스트

1. 개발 서버 실행
   ```bash
   cd web
   npm run dev
   ```

2. 회원가입 테스트
   - http://localhost:3000/auth/signup 접속
   - `yourname@konkuk.ac.kr` 형식으로 가입
   - 이메일 확인 (Supabase Dashboard > Authentication > Users에서 확인 가능)

3. 다른 도메인 테스트
   - `test@gmail.com`으로 가입 시도
   - "건국대학교 이메일만 가입 가능합니다" 에러 확인

### 프로덕션 배포 전 체크리스트

- [ ] Supabase Auth 활성화
- [ ] 이메일 확인 필수 설정
- [ ] Site URL 및 Redirect URLs 설정
- [ ] 커스텀 SMTP 설정 (프로덕션)
- [ ] 환경 변수 설정 (Vercel/배포 플랫폼)
- [ ] RLS 정책 확인
- [ ] 실제 건국대 이메일로 테스트

## 9. 문제 해결

### "new row violates row-level security policy for table 'users'" 에러

**원인**: 이메일 확인이 완료되지 않은 상태에서 프로필을 생성하려고 시도

**해결 방법**:
1. ✅ 데이터베이스 트리거 사용 (권장) - `003_auto_create_user_profile.sql` 마이그레이션 적용
2. 프로필 생성을 이메일 인증 후로 지연
3. RLS 정책 수정 (보안상 권장하지 않음)

**마이그레이션 적용**:
```bash
# Supabase CLI 사용
supabase db push

# 또는 Supabase Dashboard > SQL Editor에서 수동 실행
# supabase/migrations/003_auto_create_user_profile.sql 내용 복사/붙여넣기
```

### "이메일이 전송되지 않아요"

1. Supabase Dashboard > Authentication > Users에서 사용자 확인
2. Email confirmations가 활성화되어 있는지 확인
3. SMTP 설정 확인 (프로덕션)
4. 스팸 폴더 확인

### "회원가입 후 프로필이 생성되지 않아요"

1. Supabase Dashboard > Table Editor > users 테이블 확인
2. 이메일 인증을 완료했는지 확인
3. Database > Triggers에서 `on_auth_user_created` 트리거 확인
4. 브라우저 콘솔에서 에러 로그 확인

### "다른 이메일로 가입하고 싶어요"

현재는 보안을 위해 건국대 이메일만 허용합니다.
다른 도메인을 추가하려면 `lib/utils.ts` 파일 수정 필요.

## 10. 향후 개선 사항

### 고려할 수 있는 기능들

- [ ] 소셜 로그인 (Google, GitHub) - 건국대 이메일 확인 후 연동
- [ ] 비밀번호 재설정 기능
- [ ] 이메일 재전송 기능
- [ ] 관리자 대시보드 (가입 승인)
- [ ] 학생 인증 강화 (학번 추가 검증)
- [ ] 2단계 인증 (2FA)

## 참고 문서

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js 15 App Router with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
