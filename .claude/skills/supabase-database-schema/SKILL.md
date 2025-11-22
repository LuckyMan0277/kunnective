---
name: supabase-database-schema
description: "Supabase PostgreSQL 데이터베이스 스키마 설계 및 마이그레이션 작성을 돕습니다. 테이블 생성, 관계 설정, 인덱스, 트리거, 함수 작성 시 사용합니다. '데이터베이스 스키마', '테이블 생성', '마이그레이션' 등의 요청에 활성화됩니다."
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Supabase 데이터베이스 스키마 설계 스킬

PostgreSQL을 사용한 Supabase 데이터베이스 스키마 설계 및 마이그레이션을 지원합니다.

## 주요 기능

### 1. 마이그레이션 파일 생성

```bash
# Supabase 프로젝트 초기화
npx supabase init

# 새 마이그레이션 생성
npx supabase migration new create_users_table

# 로컬 데이터베이스 시작
npx supabase start

# 마이그레이션 적용
npx supabase db push

# 원격 데이터베이스에 적용
npx supabase db push --linked
```

### 2. 기본 테이블 생성

```sql
-- supabase/migrations/001_create_users_table.sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_users_email ON public.users(email);

-- 코멘트
COMMENT ON TABLE public.users IS '사용자 프로필 정보';
```

### 3. 관계 설정

```sql
-- 1:N 관계 (User has many Posts)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 외래키 인덱스 (성능 향상)
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- N:M 관계 (Post has many Tags, Tag has many Posts)
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
```

### 4. 배열 및 JSONB 타입

```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  tags TEXT[] DEFAULT '{}',  -- 배열
  metadata JSONB,              -- JSON 데이터
  required_roles JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 배열 검색을 위한 GIN 인덱스
CREATE INDEX idx_ideas_tags ON ideas USING GIN(tags);

-- JSONB 검색을 위한 GIN 인덱스
CREATE INDEX idx_ideas_metadata ON ideas USING GIN(metadata);

-- 배열 쿼리 예시
-- SELECT * FROM ideas WHERE 'React' = ANY(tags);
-- SELECT * FROM ideas WHERE tags @> ARRAY['React', 'TypeScript'];

-- JSONB 쿼리 예시
-- SELECT * FROM ideas WHERE metadata->>'category' = 'tech';
```

### 5. 트리거 (Triggers)

```sql
-- updated_at 자동 업데이트 트리거
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

-- 카운트 자동 업데이트 트리거 (좋아요 수)
CREATE OR REPLACE FUNCTION increment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_liked
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_likes_count();
```

### 6. 함수 (Functions)

```sql
-- RPC 함수: 1:1 채팅방 찾기 또는 생성
CREATE OR REPLACE FUNCTION get_or_create_direct_room(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  room UUID;
BEGIN
  -- 기존 채팅방 찾기
  SELECT cr.id INTO room
  FROM chat_rooms cr
  WHERE cr.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM chat_participants cp1
      WHERE cp1.room_id = cr.id AND cp1.user_id = user1_id
    )
    AND EXISTS (
      SELECT 1 FROM chat_participants cp2
      WHERE cp2.room_id = cr.id AND cp2.user_id = user2_id
    );

  -- 없으면 생성
  IF room IS NULL THEN
    INSERT INTO chat_rooms (type) VALUES ('direct') RETURNING id INTO room;
    INSERT INTO chat_participants (room_id, user_id) VALUES (room, user1_id);
    INSERT INTO chat_participants (room_id, user_id) VALUES (room, user2_id);
  END IF;

  RETURN room;
END;
$$ LANGUAGE plpgsql;

-- 사용법: SELECT get_or_create_direct_room('user1-uuid', 'user2-uuid');
```

### 7. 뷰 (Views)

```sql
-- 복잡한 조인을 간단하게
CREATE VIEW user_stats AS
SELECT
  u.id,
  u.name,
  COUNT(DISTINCT p.id) AS post_count,
  COUNT(DISTINCT pl.id) AS like_count
FROM public.users u
LEFT JOIN posts p ON p.user_id = u.id
LEFT JOIN post_likes pl ON pl.user_id = u.id
GROUP BY u.id, u.name;

-- 사용법: SELECT * FROM user_stats WHERE id = 'user-uuid';
```

### 8. Full-text Search

```sql
-- 검색 벡터 컬럼 추가
ALTER TABLE posts ADD COLUMN search_vector tsvector;

-- GIN 인덱스 생성
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

-- 검색 벡터 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION posts_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_search_update
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION posts_search_trigger();

-- 검색 쿼리
-- SELECT * FROM posts WHERE search_vector @@ to_tsquery('react & typescript');
```

### 9. ENUM 타입

```sql
-- ENUM 타입 생성
CREATE TYPE project_status AS ENUM ('recruiting', 'in_progress', 'completed', 'cancelled');

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  status project_status DEFAULT 'recruiting'
);

-- ENUM 값 추가
-- ALTER TYPE project_status ADD VALUE 'on_hold';
```

### 10. Constraints (제약 조건)

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),

  -- UNIQUE 제약
  UNIQUE(project_id, user_id),

  -- CHECK 제약
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected')),
  CONSTRAINT future_date CHECK (created_at <= NOW())
);
```

## TypeScript 타입 생성

```bash
# Supabase CLI로 타입 자동 생성
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > web/types/database.ts

# 또는 로컬 DB에서 생성
npx supabase gen types typescript --local > web/types/database.ts
```

생성된 타입 사용:
```typescript
import { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row']
type InsertUser = Database['public']['Tables']['users']['Insert']
type UpdateUser = Database['public']['Tables']['users']['Update']
```

## 마이그레이션 관리

### 순서 지정
```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_add_users_table.sql
├── 003_add_posts_table.sql
└── 004_add_search.sql
```

### 롤백
```bash
# 마이그레이션 리셋
npx supabase db reset

# 특정 마이그레이션까지 롤백
npx supabase db reset --version 002
```

## 베스트 프랙티스

### 1. 항상 인덱스 추가
```sql
-- 외래키에 인덱스
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- 자주 검색하는 컬럼에 인덱스
CREATE INDEX idx_users_email ON users(email);

-- 정렬에 사용되는 컬럼
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

### 2. ON DELETE 정책 명시
```sql
-- CASCADE: 부모 삭제 시 자식도 삭제
user_id UUID REFERENCES users(id) ON DELETE CASCADE

-- SET NULL: 부모 삭제 시 NULL로 설정
idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL

-- RESTRICT: 자식이 있으면 부모 삭제 불가 (기본값)
user_id UUID REFERENCES users(id) ON DELETE RESTRICT
```

### 3. 기본값 설정
```sql
created_at TIMESTAMP DEFAULT NOW()
status VARCHAR(20) DEFAULT 'active'
is_active BOOLEAN DEFAULT TRUE
tags TEXT[] DEFAULT '{}'
```

### 4. NOT NULL 제약 추가
```sql
title VARCHAR(200) NOT NULL
user_id UUID NOT NULL
email VARCHAR(255) UNIQUE NOT NULL
```

## 사용 시나리오

이 스킬은 다음 요청에 활성화됩니다:

- "데이터베이스 스키마를 만들어줘"
- "users 테이블을 생성해줘"
- "마이그레이션 파일을 작성해줘"
- "Full-text search를 추가해줘"
- "트리거를 만들어줘"

## 체크리스트

- [ ] Supabase CLI 설치됨
- [ ] 마이그레이션 디렉토리 생성됨
- [ ] 테이블 생성 SQL 작성
- [ ] 인덱스 추가
- [ ] 트리거 및 함수 작성 (필요시)
- [ ] TypeScript 타입 생성
- [ ] 로컬 DB 테스트
- [ ] 원격 DB에 적용

## 참고 자료

- [Supabase Database 문서](https://supabase.com/docs/guides/database)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Supabase CLI 문서](https://supabase.com/docs/reference/cli)
