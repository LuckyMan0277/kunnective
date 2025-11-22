# Idea Board Subagent

## Role
아이디어 게시판 구축 전문 에이전트

## Responsibilities
1. 아이디어 CRUD 기능 구현
2. 좋아요 및 북마크 시스템
3. 검색 및 필터링
4. Markdown 에디터 통합
5. 무한 스크롤 구현
6. 반응형 UI

## Database Schema

```sql
-- ideas 테이블
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  required_skills TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  bookmarks_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 좋아요 테이블
CREATE TABLE idea_likes (
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (idea_id, user_id)
);

-- 북마크 테이블
CREATE TABLE idea_bookmarks (
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (idea_id, user_id)
);

-- 인덱스
CREATE INDEX idx_ideas_user_id ON ideas(user_id);
CREATE INDEX idx_ideas_category ON ideas(category);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX idx_ideas_likes_count ON ideas(likes_count DESC);
CREATE INDEX idx_ideas_tags ON ideas USING GIN(tags);
CREATE INDEX idx_ideas_required_skills ON ideas USING GIN(required_skills);

CREATE INDEX idx_idea_likes_user_id ON idea_likes(user_id);
CREATE INDEX idx_idea_bookmarks_user_id ON idea_bookmarks(user_id);

-- Full-text search 인덱스
ALTER TABLE ideas ADD COLUMN search_vector tsvector;

CREATE INDEX idx_ideas_search ON ideas USING GIN(search_vector);

-- 검색 벡터 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION ideas_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ideas_search_update
  BEFORE INSERT OR UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION ideas_search_trigger();

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_bookmarks ENABLE ROW LEVEL SECURITY;

-- ideas 정책
CREATE POLICY "Ideas are viewable by everyone"
  ON ideas FOR SELECT
  USING (true);

CREATE POLICY "Users can create ideas"
  ON ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas"
  ON ideas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas"
  ON ideas FOR DELETE
  USING (auth.uid() = user_id);

-- likes 정책
CREATE POLICY "Likes are viewable by everyone"
  ON idea_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like ideas"
  ON idea_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike ideas"
  ON idea_likes FOR DELETE
  USING (auth.uid() = user_id);

-- bookmarks 정책
CREATE POLICY "Users can view own bookmarks"
  ON idea_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can bookmark ideas"
  ON idea_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove bookmarks"
  ON idea_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- 좋아요 카운트 업데이트 함수
CREATE OR REPLACE FUNCTION increment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ideas SET likes_count = likes_count + 1 WHERE id = NEW.idea_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ideas SET likes_count = likes_count - 1 WHERE id = OLD.idea_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER idea_liked
  AFTER INSERT ON idea_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_likes_count();

CREATE TRIGGER idea_unliked
  AFTER DELETE ON idea_likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_likes_count();

-- 북마크 카운트 업데이트 함수
CREATE OR REPLACE FUNCTION increment_bookmarks_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ideas SET bookmarks_count = bookmarks_count + 1 WHERE id = NEW.idea_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_bookmarks_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ideas SET bookmarks_count = bookmarks_count - 1 WHERE id = OLD.idea_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER idea_bookmarked
  AFTER INSERT ON idea_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION increment_bookmarks_count();

CREATE TRIGGER idea_unbookmarked
  AFTER DELETE ON idea_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION decrement_bookmarks_count();
```

## TypeScript Types

파일: `shared/types/idea.ts`
```typescript
export interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  required_skills: string[];
  likes_count: number;
  bookmarks_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    name: string;
    avatar_url: string | null;
    major: string | null;
  };
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export interface CreateIdeaData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  required_skills: string[];
}

export interface UpdateIdeaData {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  required_skills?: string[];
}

export interface IdeaFilters {
  category?: string;
  tags?: string[];
  required_skills?: string[];
  search?: string;
  sort?: 'latest' | 'popular' | 'oldest';
}
```

## Validation Schemas

파일: `shared/utils/validation.ts` (추가)
```typescript
export const ideaSchema = z.object({
  title: z
    .string()
    .min(5, '제목은 최소 5자 이상이어야 합니다')
    .max(200, '제목은 200자를 초과할 수 없습니다'),
  description: z
    .string()
    .min(20, '설명은 최소 20자 이상이어야 합니다')
    .max(10000, '설명은 10000자를 초과할 수 없습니다'),
  category: z.string().min(1, '카테고리를 선택하세요'),
  tags: z
    .array(z.string())
    .max(10, '태그는 최대 10개까지 추가할 수 있습니다')
    .optional()
    .default([]),
  required_skills: z
    .array(z.string())
    .max(15, '필요 기술은 최대 15개까지 추가할 수 있습니다')
    .optional()
    .default([]),
});
```

## Constants

파일: `web/lib/constants.ts` (추가)
```typescript
export const IDEA_CATEGORIES = [
  { value: 'it', label: 'IT/기술' },
  { value: 'design', label: '디자인' },
  { value: 'business', label: '비즈니스' },
  { value: 'social', label: '소셜/커뮤니티' },
  { value: 'education', label: '교육' },
  { value: 'health', label: '헬스케어' },
  { value: 'entertainment', label: '엔터테인먼트' },
  { value: 'environment', label: '환경' },
  { value: 'other', label: '기타' },
];

export const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'oldest', label: '오래된순' },
];
```

## API Functions

파일: `web/lib/api/ideas.ts`
```typescript
import { createClient } from '@/lib/supabase/client';
import { Idea, CreateIdeaData, UpdateIdeaData, IdeaFilters } from '@/shared/types/idea';

const PAGE_SIZE = 12;

export async function getIdeas(
  filters: IdeaFilters = {},
  page: number = 0
): Promise<{ ideas: Idea[]; hasMore: boolean }> {
  const supabase = createClient();
  const { category, tags, required_skills, search, sort = 'latest' } = filters;

  let query = supabase
    .from('ideas')
    .select(
      `
      *,
      user:users!user_id (
        id,
        name,
        avatar_url,
        major
      )
    `,
      { count: 'exact' }
    );

  // 필터 적용
  if (category) {
    query = query.eq('category', category);
  }

  if (tags && tags.length > 0) {
    query = query.contains('tags', tags);
  }

  if (required_skills && required_skills.length > 0) {
    query = query.contains('required_skills', required_skills);
  }

  if (search) {
    query = query.textSearch('search_vector', search);
  }

  // 정렬
  if (sort === 'popular') {
    query = query.order('likes_count', { ascending: false });
  } else if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // 페이지네이션
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  const ideas = (data || []) as Idea[];
  const hasMore = count ? from + PAGE_SIZE < count : false;

  return { ideas, hasMore };
}

export async function getIdea(id: string, userId?: string): Promise<Idea> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('ideas')
    .select(
      `
      *,
      user:users!user_id (
        id,
        name,
        avatar_url,
        major
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;

  const idea = data as Idea;

  // 좋아요/북마크 여부 확인
  if (userId) {
    const [likeRes, bookmarkRes] = await Promise.all([
      supabase.from('idea_likes').select('*').eq('idea_id', id).eq('user_id', userId).single(),
      supabase.from('idea_bookmarks').select('*').eq('idea_id', id).eq('user_id', userId).single(),
    ]);

    idea.is_liked = !likeRes.error;
    idea.is_bookmarked = !bookmarkRes.error;
  }

  return idea;
}

export async function createIdea(data: CreateIdeaData): Promise<Idea> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: idea, error } = await supabase
    .from('ideas')
    .insert({ ...data, user_id: user.id })
    .select(
      `
      *,
      user:users!user_id (
        id,
        name,
        avatar_url,
        major
      )
    `
    )
    .single();

  if (error) throw error;

  return idea as Idea;
}

export async function updateIdea(id: string, data: UpdateIdeaData): Promise<Idea> {
  const supabase = createClient();

  const { data: idea, error } = await supabase
    .from('ideas')
    .update(data)
    .eq('id', id)
    .select(
      `
      *,
      user:users!user_id (
        id,
        name,
        avatar_url,
        major
      )
    `
    )
    .single();

  if (error) throw error;

  return idea as Idea;
}

export async function deleteIdea(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('ideas').delete().eq('id', id);

  if (error) throw error;
}

export async function toggleLike(ideaId: string): Promise<boolean> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 좋아요 여부 확인
  const { data: existing } = await supabase
    .from('idea_likes')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // 좋아요 취소
    await supabase.from('idea_likes').delete().eq('idea_id', ideaId).eq('user_id', user.id);
    return false;
  } else {
    // 좋아요
    await supabase.from('idea_likes').insert({ idea_id: ideaId, user_id: user.id });
    return true;
  }
}

export async function toggleBookmark(ideaId: string): Promise<boolean> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 북마크 여부 확인
  const { data: existing } = await supabase
    .from('idea_bookmarks')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // 북마크 취소
    await supabase.from('idea_bookmarks').delete().eq('idea_id', ideaId).eq('user_id', user.id);
    return false;
  } else {
    // 북마크
    await supabase.from('idea_bookmarks').insert({ idea_id: ideaId, user_id: user.id });
    return true;
  }
}

export async function getMyBookmarks(userId: string): Promise<Idea[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('idea_bookmarks')
    .select(
      `
      idea:ideas (
        *,
        user:users!user_id (
          id,
          name,
          avatar_url,
          major
        )
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((item) => item.idea) as Idea[];
}
```

## UI Components

### Required Packages
```bash
pnpm add @uiw/react-md-editor react-markdown remark-gfm
```

### 1. 아이디어 목록 페이지
파일: `web/app/(main)/ideas/page.tsx`

주요 기능:
- 무한 스크롤 (Intersection Observer)
- 카테고리 필터
- 태그 필터
- 검색바
- 정렬 옵션
- 그리드 레이아웃

### 2. 아이디어 카드 컴포넌트
파일: `web/components/ideas/IdeaCard.tsx`

표시 정보:
- 제목
- 설명 (미리보기)
- 카테고리 배지
- 태그
- 작성자 정보 (아바타, 이름, 학과)
- 좋아요/북마크 버튼
- 필요 기술 스택
- 작성일

### 3. 아이디어 상세 페이지
파일: `web/app/(main)/ideas/[id]/page.tsx`

주요 기능:
- 전체 내용 표시 (Markdown 렌더링)
- 좋아요/북마크 버튼
- 공유 버튼
- 작성자 프로필 링크
- 수정/삭제 버튼 (본인만)
- "프로젝트 시작하기" 버튼

### 4. 아이디어 작성/수정 페이지
파일: `web/app/(main)/ideas/new/page.tsx`
파일: `web/app/(main)/ideas/[id]/edit/page.tsx`

주요 기능:
- 제목 입력
- Markdown 에디터 (@uiw/react-md-editor)
- 실시간 미리보기
- 카테고리 선택 (드롭다운)
- 태그 입력 (자동완성)
- 필요 기술 스택 선택
- 초안 저장 (LocalStorage)
- 폼 유효성 검사

### 5. 검색 및 필터 컴포넌트
파일: `web/components/ideas/IdeaFilters.tsx`

주요 기능:
- 검색 입력
- 카테고리 선택 (체크박스)
- 태그 선택 (다중 선택)
- 정렬 옵션 (드롭다운)
- "필터 초기화" 버튼
- 모바일 반응형 (슬라이드 메뉴)

### 6. 태그 입력 컴포넌트
파일: `web/components/ui/TagInput.tsx`

주요 기능:
- 태그 입력 및 추가 (Enter 키)
- 태그 삭제
- 태그 최대 개수 제한
- 자동완성 (자주 사용되는 태그)
- 태그 중복 방지

## Custom Hooks

파일: `web/lib/hooks/useIdeas.ts`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Idea, IdeaFilters } from '@/shared/types/idea';
import { getIdeas } from '@/lib/api/ideas';

export function useIdeas(filters: IdeaFilters = {}) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setIdeas([]);
    setPage(0);
    setHasMore(true);
  }, [filters]);

  useEffect(() => {
    const fetchIdeas = async () => {
      setLoading(true);
      try {
        const { ideas: newIdeas, hasMore: more } = await getIdeas(filters, page);
        setIdeas((prev) => (page === 0 ? newIdeas : [...prev, ...newIdeas]));
        setHasMore(more);
      } catch (error) {
        console.error('Failed to fetch ideas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [filters, page]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return { ideas, loading, hasMore, loadMore };
}
```

파일: `web/lib/hooks/useInfiniteScroll.ts`
```typescript
'use client';

import { useEffect, useRef } from 'react';

export function useInfiniteScroll(callback: () => void, hasMore: boolean) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, hasMore]);

  return loadMoreRef;
}
```

## Tasks

### Phase 1: Database Setup
- [ ] ideas, idea_likes, idea_bookmarks 테이블 생성
- [ ] 인덱스 및 RLS 정책 설정
- [ ] Full-text search 설정
- [ ] 트리거 함수 생성

### Phase 2: API Layer
- [ ] API 함수 작성 (CRUD, 좋아요, 북마크)
- [ ] TypeScript 타입 정의
- [ ] Validation 스키마 작성

### Phase 3: UI Components
- [ ] IdeaCard 컴포넌트
- [ ] IdeaFilters 컴포넌트
- [ ] TagInput 컴포넌트
- [ ] Markdown 에디터 통합

### Phase 4: Pages
- [ ] 아이디어 목록 페이지 (무한 스크롤)
- [ ] 아이디어 상세 페이지
- [ ] 아이디어 작성 페이지
- [ ] 아이디어 수정 페이지

### Phase 5: Features
- [ ] 검색 기능
- [ ] 필터링 (카테고리, 태그, 정렬)
- [ ] 좋아요/북마크 (낙관적 업데이트)
- [ ] 공유 기능

### Phase 6: Polish
- [ ] 로딩 스켈레톤
- [ ] 에러 핸들링
- [ ] 빈 상태 UI
- [ ] 반응형 디자인

## Success Criteria
- [ ] 아이디어 작성/수정/삭제 정상 작동
- [ ] 검색 및 필터링 정상 작동
- [ ] 좋아요/북마크 실시간 업데이트
- [ ] 무한 스크롤 정상 작동
- [ ] Markdown 렌더링 정상 작동
- [ ] 반응형 UI
- [ ] 성능 최적화 (페이지네이션)

## Notes
- Markdown 에디터는 @uiw/react-md-editor 사용 (라이트/다크 모드 지원)
- 검색은 PostgreSQL Full-text search 사용 (한글 지원 제한적)
- 무한 스크롤은 Intersection Observer API 사용
- 좋아요/북마크는 낙관적 업데이트로 UX 개선
