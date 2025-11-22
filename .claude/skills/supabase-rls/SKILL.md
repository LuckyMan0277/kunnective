---
name: supabase-rls
description: "Supabase Row Level Security (RLS) 정책 설계 및 구현을 돕습니다. 데이터 접근 권한, 보안 정책 설정 시 사용합니다. 'RLS 정책', '보안 설정', '접근 권한' 등의 요청에 활성화됩니다."
allowed-tools:
  - Read
  - Write
  - Edit
---

# Supabase Row Level Security (RLS) 스킬

PostgreSQL의 Row Level Security를 사용하여 데이터 접근 권한을 제어합니다.

## 주요 기능

### 1. RLS 기본 개념

RLS는 **행 단위로 데이터 접근을 제어**하는 PostgreSQL 기능입니다.

- 사용자가 자신의 데이터만 볼 수 있도록 제한
- SQL 인젝션 공격 방지
- 클라이언트 사이드에서 직접 DB 접근 가능 (안전하게)

### 2. RLS 활성화

```sql
-- 테이블에 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS 비활성화 (주의: 모든 사용자가 접근 가능)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

**중요**: RLS를 활성화하면 **정책이 없는 한 모든 접근이 차단**됩니다!

### 3. 기본 정책 패턴

#### 패턴 1: 모든 사용자가 읽기 가능, 본인만 수정

```sql
-- users 테이블
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 다른 사용자 프로필 조회 가능
CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

-- 본인 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- 본인 프로필만 삭제 가능
CREATE POLICY "Users can delete own profile"
  ON public.users FOR DELETE
  USING (auth.uid() = id);
```

#### 패턴 2: 본인 데이터만 조회/수정

```sql
-- posts 테이블
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 본인 게시글만 조회
CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 게시글만 생성
CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 게시글만 수정
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

-- 본인 게시글만 삭제
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);
```

#### 패턴 3: 공개 읽기, 본인만 쓰기

```sql
-- ideas 테이블 (아이디어는 모두가 볼 수 있음)
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 아이디어 조회 가능
CREATE POLICY "Ideas are viewable by everyone"
  ON ideas FOR SELECT
  USING (true);

-- 인증된 사용자만 아이디어 생성 가능
CREATE POLICY "Authenticated users can create ideas"
  ON ideas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 본인 아이디어만 수정/삭제
CREATE POLICY "Users can update own ideas"
  ON ideas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas"
  ON ideas FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. 고급 정책 패턴

#### 패턴 4: 관계 기반 접근 제어

```sql
-- project_members 테이블
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- 프로젝트 멤버만 멤버 목록 조회 가능
CREATE POLICY "Project members can view other members"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- 프로젝트 owner만 멤버 추가/제거 가능
CREATE POLICY "Project owners can manage members"
  ON project_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
        AND p.owner_id = auth.uid()
    )
  );
```

#### 패턴 5: 다중 조건 정책

```sql
-- applications 테이블 (지원서)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 지원자 본인 또는 프로젝트 owner만 조회 가능
CREATE POLICY "Users can view own applications or as project owner"
  ON applications FOR SELECT
  USING (
    auth.uid() = user_id  -- 지원자 본인
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = applications.project_id
        AND p.owner_id = auth.uid()  -- 프로젝트 owner
    )
  );

-- 지원자 본인만 생성 가능
CREATE POLICY "Users can create own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 지원자 본인 또는 프로젝트 owner만 수정 가능
CREATE POLICY "Users can update own applications or as project owner"
  ON applications FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = applications.project_id
        AND p.owner_id = auth.uid()
    )
  );
```

#### 패턴 6: 상태 기반 접근 제어

```sql
-- 승인된 게시물만 공개
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT
  USING (
    status = 'published'
    OR auth.uid() = user_id  -- 본인은 초안도 볼 수 있음
  );
```

### 5. 채팅 메시지 RLS

```sql
-- messages 테이블
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 채팅방 참여자만 메시지 조회 가능
CREATE POLICY "Users can view messages in their rooms"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.room_id = messages.room_id
        AND cp.user_id = auth.uid()
    )
  );

-- 채팅방 참여자만 메시지 전송 가능
CREATE POLICY "Users can send messages to their rooms"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.room_id = messages.room_id
        AND cp.user_id = auth.uid()
    )
  );
```

### 6. 알림 RLS

```sql
-- notifications 테이블
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 본인 알림만 조회 가능
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 알림만 업데이트 가능 (읽음 표시)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 시스템/트리거가 알림 생성 (사용자 직접 생성 불가)
-- INSERT 정책은 생략하거나 서비스 역할만 허용
```

### 7. 좋아요/북마크 RLS

```sql
-- idea_likes 테이블
ALTER TABLE idea_likes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 좋아요 목록 조회 가능
CREATE POLICY "Likes are viewable by everyone"
  ON idea_likes FOR SELECT
  USING (true);

-- 인증된 사용자만 좋아요 가능
CREATE POLICY "Users can like ideas"
  ON idea_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 좋아요만 취소 가능
CREATE POLICY "Users can unlike ideas"
  ON idea_likes FOR DELETE
  USING (auth.uid() = user_id);
```

### 8. auth.uid() 및 auth.role() 함수

```sql
-- 현재 로그인한 사용자의 UUID
auth.uid()

-- 현재 사용자의 역할
auth.role()  -- 'authenticated', 'anon', 'service_role'

-- 사용 예시
CREATE POLICY "Only authenticated users"
  ON table_name FOR SELECT
  USING (auth.role() = 'authenticated');
```

### 9. 정책 디버깅

#### 정책 목록 확인
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'your_table_name';
```

#### 정책 삭제
```sql
DROP POLICY "policy_name" ON table_name;
```

#### 정책 비활성화 (테스트용)
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### 10. 서비스 역할 (Bypass RLS)

서버 사이드에서 RLS를 우회해야 할 때:

```typescript
// Service role 키 사용 (환경변수에서)
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // 주의: 서버에서만 사용!
)

// 모든 RLS 정책 우회
const { data } = await supabaseAdmin.from('users').select('*')
```

**경고**: Service role 키는 절대 클라이언트에 노출하지 마세요!

## 베스트 프랙티스

### 1. 명확한 정책 이름
```sql
-- ❌ 나쁜 예
CREATE POLICY "select_policy" ON users FOR SELECT ...

-- ✅ 좋은 예
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT ...
```

### 2. USING vs WITH CHECK
```sql
-- USING: SELECT, UPDATE, DELETE에 사용 (기존 행 확인)
-- WITH CHECK: INSERT, UPDATE에 사용 (새로운/수정된 행 확인)

-- 예시: 게시글 작성 시 본인 user_id만 사용 가능
CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 3. 정책 테스트
```sql
-- 특정 사용자로 테스트
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"user-uuid"}';

SELECT * FROM posts;  -- RLS 적용된 결과 확인

RESET ROLE;
```

### 4. 성능 고려
```sql
-- ❌ 나쁜 예: 복잡한 서브쿼리
CREATE POLICY "Complex policy"
  ON table1 FOR SELECT
  USING (
    column1 IN (
      SELECT id FROM table2
      WHERE column2 IN (
        SELECT id FROM table3 WHERE ...
      )
    )
  );

-- ✅ 좋은 예: 인덱스와 함께 사용
CREATE INDEX idx_table1_column1 ON table1(column1);

CREATE POLICY "Simple policy"
  ON table1 FOR SELECT
  USING (column1 = auth.uid());
```

### 5. 정책 분리
```sql
-- 각 작업(SELECT, INSERT, UPDATE, DELETE)마다 별도 정책
CREATE POLICY "Users can view posts" ON posts FOR SELECT ...
CREATE POLICY "Users can create posts" ON posts FOR INSERT ...
CREATE POLICY "Users can update posts" ON posts FOR UPDATE ...
CREATE POLICY "Users can delete posts" ON posts FOR DELETE ...
```

## 일반적인 RLS 패턴 모음

```sql
-- 1. 공개 읽기, 인증된 사용자만 쓰기
CREATE POLICY "Public read" ON table FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON table FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. 본인 데이터만 접근
CREATE POLICY "Own data only" ON table FOR ALL USING (auth.uid() = user_id);

-- 3. 팀원만 접근
CREATE POLICY "Team access" ON table FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = table.team_id AND user_id = auth.uid()
    )
  );

-- 4. 관리자만 접근 (custom claim 사용)
CREATE POLICY "Admin only" ON table FOR ALL
  USING ((auth.jwt() ->> 'role') = 'admin');

-- 5. 시간 기반 접근 (발행된 게시물만)
CREATE POLICY "Published only" ON table FOR SELECT
  USING (published_at <= NOW() OR auth.uid() = user_id);
```

## 사용 시나리오

이 스킬은 다음 요청에 활성화됩니다:

- "RLS 정책을 만들어줘"
- "데이터 접근 권한을 설정해줘"
- "본인 데이터만 볼 수 있게 해줘"
- "보안 정책을 추가해줘"

## 체크리스트

- [ ] 모든 테이블에 RLS 활성화
- [ ] SELECT 정책 추가
- [ ] INSERT 정책 추가
- [ ] UPDATE 정책 추가
- [ ] DELETE 정책 추가
- [ ] 정책 테스트 완료
- [ ] 성능 확인 (인덱스 추가)

## 참고 자료

- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS 문서](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [RLS 성능 가이드](https://supabase.com/docs/guides/database/postgres/row-level-security#performance)
