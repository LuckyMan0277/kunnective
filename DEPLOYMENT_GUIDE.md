# Kunnective 배포 가이드

## 📋 배포 전 체크리스트

- [x] 프로덕션 빌드 성공 (`npm run build`)
- [ ] Supabase 프로젝트 설정 완료
- [ ] Supabase 마이그레이션 실행
- [ ] 환경 변수 준비
- [ ] Vercel 계정 생성

---

## 🗄️ 1. Supabase 설정

### 1.1 Supabase 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `kunnective`
   - **Database Password**: 강력한 비밀번호 설정 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)` (한국 사용자 대상)
   - **Pricing Plan**: `Free` (개발/테스트용)

### 1.2 데이터베이스 마이그레이션 실행

Supabase SQL Editor에서 다음 파일들을 **순서대로** 실행:

```bash
1. supabase/migrations/000_reset_and_rebuild.sql
2. supabase/migrations/003_auto_create_user_profile.sql
3. supabase/migrations/004_add_user_profile_fields.sql
```

**실행 방법**:
1. Supabase Dashboard > SQL Editor
2. "New Query" 클릭
3. 각 마이그레이션 파일 내용을 복사하여 붙여넣기
4. "Run" 클릭

### 1.3 Supabase Auth 설정

1. **Authentication > Providers** 이동
2. **Email Provider** 활성화 확인
3. **Authentication > URL Configuration**:
   - **Site URL**: `https://your-domain.vercel.app` (배포 후 업데이트)
   - **Redirect URLs** 추가:
     ```
     http://localhost:3000/auth/callback
     https://your-domain.vercel.app/auth/callback
     ```

### 1.4 Supabase Storage 설정

1. **Storage** > "Create a new bucket" 클릭
2. Bucket 이름: `avatars`
3. Public bucket: ✅ 체크
4. Allowed MIME types: `image/*`

### 1.5 환경 변수 확인

**Settings > API**에서 다음 정보 복사:

- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public key

---

## 🚀 2. Vercel 배포

### 2.1 GitHub 저장소 준비

```bash
# 로컬에서 Git 저장소 확인
git status

# 변경사항 커밋
git add .
git commit -m "Ready for deployment"

# GitHub에 푸시 (저장소가 있다면)
git push origin main
```

**GitHub 저장소가 없다면**:
1. [GitHub](https://github.com)에서 새 저장소 생성
2. 로컬에서 원격 저장소 추가:
   ```bash
   git remote add origin https://github.com/your-username/kunnective.git
   git push -u origin main
   ```

### 2.2 Vercel 프로젝트 생성

1. [Vercel](https://vercel.com) 접속 및 로그인 (GitHub 계정 연동 권장)
2. "Add New..." > "Project" 클릭
3. GitHub 저장소 선택 (kunnective)
4. **Configure Project**:
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `web` ⚠️ **중요!**
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)

### 2.3 환경 변수 설정

**Environment Variables** 섹션에서 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

⚠️ **주의**:
- 환경 변수는 `Environment: Production, Preview, Development` 모두 체크
- Supabase 키는 Dashboard > Settings > API에서 확인

### 2.4 배포 시작

1. "Deploy" 버튼 클릭
2. 빌드 로그 확인 (약 2-3분 소요)
3. 배포 완료 후 도메인 확인:
   - 예: `https://kunnective.vercel.app`

---

## 🔧 3. 배포 후 설정

### 3.1 Supabase Redirect URL 업데이트

Vercel 배포 도메인을 받은 후:

1. Supabase Dashboard > Authentication > URL Configuration
2. **Redirect URLs**에 추가:
   ```
   https://your-domain.vercel.app/auth/callback
   ```
3. **Site URL** 업데이트:
   ```
   https://your-domain.vercel.app
   ```

### 3.2 커스텀 도메인 설정 (선택사항)

**Vercel Dashboard > Project > Settings > Domains**:
1. "Add Domain" 클릭
2. 도메인 입력 (예: `kunnective.com`)
3. DNS 설정 안내에 따라 도메인 등록 업체에서 설정
4. 도메인 확인 완료 후 Supabase Redirect URL도 업데이트

---

## 🧪 4. 배포 확인

### 4.1 기본 동작 테스트

1. **메인 페이지 접속**: `https://your-domain.vercel.app`
2. **회원가입 테스트**:
   - 건국대 이메일로 회원가입 (@konkuk.ac.kr, @kku.ac.kr)
   - 이메일 인증 링크 클릭
   - 프로필 설정 페이지 확인
3. **로그인 테스트**
4. **프로필 생성 확인**

### 4.2 이메일 발송 확인

**개발 환경**:
- Supabase 기본 SMTP (시간당 4개 제한)
- 테스트용으로 충분

**프로덕션 환경**:
- 커스텀 SMTP 설정 권장 (SendGrid, AWS SES 등)
- Supabase Dashboard > Authentication > Settings > SMTP Settings

---

## 📊 5. 모니터링

### 5.1 Vercel Analytics

- Vercel Dashboard > Project > Analytics
- 페이지 성능, 방문자 통계 확인 (무료 티어 제공)

### 5.2 Supabase Logs

- Supabase Dashboard > Logs
- 데이터베이스 쿼리, Auth 이벤트 모니터링

### 5.3 에러 추적

**Vercel Logs**:
- Vercel Dashboard > Project > Deployments > 최근 배포 클릭 > Logs

**브라우저 콘솔**:
- F12 > Console 탭에서 클라이언트 에러 확인

---

## 🔄 6. 업데이트 배포

### 6.1 코드 변경 후 배포

```bash
# 변경사항 커밋
git add .
git commit -m "Update feature X"

# GitHub에 푸시
git push origin main
```

⚠️ **자동 배포**: GitHub에 푸시하면 Vercel이 자동으로 새 버전 배포

### 6.2 환경 변수 업데이트

1. Vercel Dashboard > Project > Settings > Environment Variables
2. 변수 수정 또는 추가
3. 변경 후 **Redeploy** 필요 (Deployments > 최근 배포 > ... > Redeploy)

### 6.3 데이터베이스 마이그레이션

새 마이그레이션 파일 추가 시:
1. Supabase SQL Editor에서 새 마이그레이션 실행
2. 애플리케이션 재배포 (필요한 경우)

---

## 🐛 7. 문제 해결

### 7.1 빌드 실패

**증상**: Vercel 배포 중 빌드 에러

**해결**:
```bash
# 로컬에서 프로덕션 빌드 테스트
cd web
npm run build

# 에러 수정 후 다시 푸시
```

### 7.2 환경 변수 오류

**증상**: `NEXT_PUBLIC_SUPABASE_URL is not defined`

**해결**:
1. Vercel Dashboard > Settings > Environment Variables 확인
2. 변수가 없거나 오타가 있는지 확인
3. 재배포 (Deployments > Redeploy)

### 7.3 인증 리디렉션 실패

**증상**: 이메일 인증 후 404 에러

**해결**:
1. Supabase Authentication > URL Configuration 확인
2. Redirect URL에 배포 도메인 추가:
   ```
   https://your-domain.vercel.app/auth/callback
   ```

### 7.4 이미지 업로드 실패

**증상**: 프로필 사진 업로드 안됨

**해결**:
1. Supabase Storage > `avatars` 버킷 확인
2. Public bucket 설정 확인
3. RLS 정책 확인 (필요시 비활성화)

---

## 📈 8. 성능 최적화 (선택사항)

### 8.1 이미지 최적화

Next.js Image 컴포넌트 사용:
```tsx
import Image from 'next/image'

<Image
  src={profile.avatar_url}
  alt="Avatar"
  width={80}
  height={80}
  className="rounded-full"
/>
```

### 8.2 데이터베이스 인덱싱

자주 조회하는 필드에 인덱스 추가:
```sql
-- 예: 사용자명으로 검색 최적화
CREATE INDEX idx_users_username ON users(username);

-- 프로젝트 상태별 조회 최적화
CREATE INDEX idx_projects_status ON projects(status);
```

### 8.3 캐싱 전략

Vercel Edge Network를 통한 자동 캐싱 (추가 설정 불필요)

---

## 🔐 9. 보안 체크리스트

- [x] 환경 변수는 `.env.local`에만 저장 (Git에 커밋 안됨)
- [x] Supabase RLS (Row Level Security) 활성화
- [x] 건국대 이메일 검증 (@konkuk.ac.kr, @kku.ac.kr)
- [x] 비밀번호 정책: 8자 이상, 대소문자/숫자/특수문자
- [ ] HTTPS 강제 (Vercel 자동 제공)
- [ ] Rate Limiting 설정 (Supabase 기본 제공)

---

## 💰 10. 비용 관리

### 무료 티어 제한

**Vercel (Hobby Plan)**:
- 무제한 배포
- 월 100GB 대역폭
- SSR/Edge Functions: 월 100만 호출

**Supabase (Free Plan)**:
- 500MB 데이터베이스
- 1GB 파일 스토리지
- 월 50GB 데이터 전송
- 월 500MB Edge Function 호출

**비용 절감 팁**:
- 이미지 크기 최적화 (2MB 제한)
- 불필요한 쿼리 최소화
- 캐싱 활용

---

## 🎯 다음 단계

배포 완료 후 고려할 사항:

1. **SEO 최적화**:
   - `next-sitemap` 설치
   - Open Graph 메타 태그 추가
   - robots.txt 생성

2. **Analytics 연동**:
   - Google Analytics
   - Vercel Analytics (무료)

3. **에러 모니터링**:
   - Sentry 연동

4. **성능 모니터링**:
   - Vercel Speed Insights

---

## 📞 지원

문제 발생 시:
- Vercel 문서: https://vercel.com/docs
- Supabase 문서: https://supabase.com/docs
- Next.js 문서: https://nextjs.org/docs

---

**배포 성공을 기원합니다! 🚀**
