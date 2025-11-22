# Project Matching System Subagent

## Role
프로젝트 팀 빌딩 및 매칭 시스템 구축 전문 에이전트

## Responsibilities
1. 프로젝트 생성 및 관리
2. 팀원 모집 시스템
3. 지원 및 스카웃 기능
4. 팀원 관리
5. 매칭 알림

## Database Schema

```sql
-- projects 테이블
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  required_roles JSONB NOT NULL, -- [{ role, count, filled, required_skills }]
  tech_stack TEXT[] DEFAULT '{}',
  duration VARCHAR(100),
  status VARCHAR(20) DEFAULT 'recruiting', -- recruiting, in_progress, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- project_members 테이블
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- applications 테이블
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id, role)
);

-- scouts 테이블
CREATE TABLE scouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, to_user_id, role)
);

-- 인덱스
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_tech_stack ON projects USING GIN(tech_stack);

CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);

CREATE INDEX idx_applications_project_id ON applications(project_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);

CREATE INDEX idx_scouts_project_id ON scouts(project_id);
CREATE INDEX idx_scouts_to_user_id ON scouts(to_user_id);
CREATE INDEX idx_scouts_from_user_id ON scouts(from_user_id);
CREATE INDEX idx_scouts_status ON scouts(status);

-- updated_at 트리거
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scouts_updated_at
  BEFORE UPDATE ON scouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouts ENABLE ROW LEVEL SECURITY;

-- projects 정책
CREATE POLICY "Projects are viewable by everyone"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners can update"
  ON projects FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Project owners can delete"
  ON projects FOR DELETE
  USING (auth.uid() = owner_id);

-- project_members 정책
CREATE POLICY "Project members are viewable by everyone"
  ON project_members FOR SELECT
  USING (true);

CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can remove members"
  ON project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- applications 정책
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Project owners can view applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Project owners can update applications"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- scouts 정책
CREATE POLICY "Users can view own scouts"
  ON scouts FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Project owners can create scouts"
  ON scouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Scout recipients can update"
  ON scouts FOR UPDATE
  USING (auth.uid() = to_user_id);

-- 프로젝트 owner도 멤버로 자동 추가
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'Owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();

-- 지원 수락 시 멤버로 추가
CREATE OR REPLACE FUNCTION accept_application()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- 멤버로 추가
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (NEW.project_id, NEW.user_id, NEW.role)
    ON CONFLICT DO NOTHING;

    -- required_roles의 filled 카운트 증가
    UPDATE projects
    SET required_roles = (
      SELECT jsonb_agg(
        CASE
          WHEN elem->>'role' = NEW.role THEN
            jsonb_set(elem, '{filled}', to_jsonb((elem->>'filled')::int + 1))
          ELSE
            elem
        END
      )
      FROM jsonb_array_elements(required_roles) elem
    )
    WHERE id = NEW.project_id;

    -- 알림 생성
    INSERT INTO notifications (user_id, type, title, content, link)
    VALUES (
      NEW.user_id,
      'application',
      '지원이 승인되었습니다',
      (SELECT title FROM projects WHERE id = NEW.project_id),
      '/projects/' || NEW.project_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER application_accepted
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION accept_application();

-- 스카웃 수락 시 멤버로 추가
CREATE OR REPLACE FUNCTION accept_scout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- 멤버로 추가
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (NEW.project_id, NEW.to_user_id, NEW.role)
    ON CONFLICT DO NOTHING;

    -- required_roles의 filled 카운트 증가
    UPDATE projects
    SET required_roles = (
      SELECT jsonb_agg(
        CASE
          WHEN elem->>'role' = NEW.role THEN
            jsonb_set(elem, '{filled}', to_jsonb((elem->>'filled')::int + 1))
          ELSE
            elem
        END
      )
      FROM jsonb_array_elements(required_roles) elem
    )
    WHERE id = NEW.project_id;

    -- 알림 생성
    INSERT INTO notifications (user_id, type, title, content, link)
    VALUES (
      NEW.from_user_id,
      'scout',
      '스카웃 제안이 수락되었습니다',
      (SELECT name FROM public.users WHERE id = NEW.to_user_id),
      '/projects/' || NEW.project_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scout_accepted
  AFTER UPDATE ON scouts
  FOR EACH ROW
  EXECUTE FUNCTION accept_scout();
```

## TypeScript Types

파일: `shared/types/project.ts`
```typescript
export interface ProjectRole {
  role: string;
  count: number;
  filled: number;
  required_skills?: string[];
}

export interface Project {
  id: string;
  idea_id: string | null;
  owner_id: string;
  title: string;
  description: string;
  required_roles: ProjectRole[];
  tech_stack: string[];
  duration: string | null;
  status: 'recruiting' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Joined data
  owner?: {
    id: string;
    name: string;
    avatar_url: string | null;
    major: string | null;
  };
  idea?: {
    id: string;
    title: string;
  };
  members?: ProjectMember[];
  member_count?: number;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: {
    id: string;
    name: string;
    avatar_url: string | null;
    major: string | null;
    skills: string[];
  };
}

export interface Application {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    avatar_url: string | null;
    major: string | null;
    skills: string[];
  };
  project?: {
    id: string;
    title: string;
  };
}

export interface Scout {
  id: string;
  project_id: string;
  from_user_id: string;
  to_user_id: string;
  role: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    title: string;
  };
  from_user?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export interface CreateProjectData {
  title: string;
  description: string;
  required_roles: ProjectRole[];
  tech_stack: string[];
  duration?: string;
  idea_id?: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  required_roles?: ProjectRole[];
  tech_stack?: string[];
  duration?: string;
  status?: 'recruiting' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ProjectFilters {
  status?: string;
  tech_stack?: string[];
  roles?: string[];
  search?: string;
  sort?: 'latest' | 'popular' | 'oldest';
}
```

## Validation Schemas

파일: `shared/utils/validation.ts` (추가)
```typescript
const projectRoleSchema = z.object({
  role: z.string().min(1, '역할을 입력하세요'),
  count: z.number().min(1, '최소 1명 이상이어야 합니다').max(20, '최대 20명까지 가능합니다'),
  filled: z.number().min(0).default(0),
  required_skills: z.array(z.string()).optional(),
});

export const projectSchema = z.object({
  title: z
    .string()
    .min(5, '제목은 최소 5자 이상이어야 합니다')
    .max(200, '제목은 200자를 초과할 수 없습니다'),
  description: z
    .string()
    .min(20, '설명은 최소 20자 이상이어야 합니다')
    .max(10000, '설명은 10000자를 초과할 수 없습니다'),
  required_roles: z
    .array(projectRoleSchema)
    .min(1, '최소 1개의 역할이 필요합니다')
    .max(10, '최대 10개의 역할까지 추가할 수 있습니다'),
  tech_stack: z
    .array(z.string())
    .max(20, '기술 스택은 최대 20개까지 추가할 수 있습니다')
    .optional()
    .default([]),
  duration: z.string().optional(),
  idea_id: z.string().uuid().optional(),
});

export const applicationSchema = z.object({
  role: z.string().min(1, '지원할 역할을 선택하세요'),
  message: z
    .string()
    .min(10, '지원 동기는 최소 10자 이상이어야 합니다')
    .max(1000, '지원 동기는 1000자를 초과할 수 없습니다'),
});

export const scoutSchema = z.object({
  role: z.string().min(1, '역할을 선택하세요'),
  message: z
    .string()
    .min(10, '제안 메시지는 최소 10자 이상이어야 합니다')
    .max(1000, '제안 메시지는 1000자를 초과할 수 없습니다'),
});
```

## Constants

파일: `web/lib/constants.ts` (추가)
```typescript
export const PROJECT_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'UI/UX Designer',
  'Product Manager',
  'Data Scientist',
  'DevOps Engineer',
  'Marketing',
  'Business Developer',
  'Other',
];

export const PROJECT_STATUSES = [
  { value: 'recruiting', label: '모집 중', color: 'blue' },
  { value: 'in_progress', label: '진행 중', color: 'yellow' },
  { value: 'completed', label: '완료', color: 'green' },
  { value: 'cancelled', label: '취소됨', color: 'gray' },
];
```

## API Functions

파일: `web/lib/api/projects.ts`
```typescript
import { createClient } from '@/lib/supabase/client';
import {
  Project,
  CreateProjectData,
  UpdateProjectData,
  ProjectFilters,
  Application,
  Scout,
} from '@/shared/types/project';

const PAGE_SIZE = 12;

export async function getProjects(
  filters: ProjectFilters = {},
  page: number = 0
): Promise<{ projects: Project[]; hasMore: boolean }> {
  const supabase = createClient();
  const { status, tech_stack, roles, search, sort = 'latest' } = filters;

  let query = supabase
    .from('projects')
    .select(
      `
      *,
      owner:users!owner_id (
        id,
        name,
        avatar_url,
        major
      ),
      idea:ideas (
        id,
        title
      ),
      members:project_members (count)
    `,
      { count: 'exact' }
    );

  // 필터 적용
  if (status) {
    query = query.eq('status', status);
  }

  if (tech_stack && tech_stack.length > 0) {
    query = query.contains('tech_stack', tech_stack);
  }

  // TODO: roles 필터 (JSONB 쿼리)

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // 정렬
  if (sort === 'oldest') {
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

  const projects = (data || []) as Project[];
  const hasMore = count ? from + PAGE_SIZE < count : false;

  return { projects, hasMore };
}

export async function getProject(id: string): Promise<Project> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      owner:users!owner_id (
        id,
        name,
        avatar_url,
        major
      ),
      idea:ideas (
        id,
        title
      ),
      members:project_members (
        *,
        user:users (
          id,
          name,
          avatar_url,
          major,
          skills
        )
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;

  return data as Project;
}

export async function createProject(data: CreateProjectData): Promise<Project> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ ...data, owner_id: user.id })
    .select(
      `
      *,
      owner:users!owner_id (
        id,
        name,
        avatar_url,
        major
      )
    `
    )
    .single();

  if (error) throw error;

  return project as Project;
}

export async function updateProject(id: string, data: UpdateProjectData): Promise<Project> {
  const supabase = createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .update(data)
    .eq('id', id)
    .select(
      `
      *,
      owner:users!owner_id (
        id,
        name,
        avatar_url,
        major
      )
    `
    )
    .single();

  if (error) throw error;

  return project as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) throw error;
}

// 지원하기
export async function applyToProject(
  projectId: string,
  role: string,
  message: string
): Promise<Application> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('applications')
    .insert({
      project_id: projectId,
      user_id: user.id,
      role,
      message,
    })
    .select('*')
    .single();

  if (error) throw error;

  // 프로젝트 owner에게 알림
  const project = await getProject(projectId);
  await supabase.from('notifications').insert({
    user_id: project.owner_id,
    type: 'application',
    title: '새로운 지원서가 도착했습니다',
    content: `${role} 역할에 지원이 들어왔습니다`,
    link: `/projects/${projectId}/applications`,
  });

  return data as Application;
}

// 지원서 목록 (프로젝트별)
export async function getApplicationsByProject(projectId: string): Promise<Application[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      *,
      user:users (
        id,
        name,
        avatar_url,
        major,
        skills
      )
    `
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []) as Application[];
}

// 지원서 처리 (수락/거절)
export async function updateApplicationStatus(
  applicationId: string,
  status: 'accepted' | 'rejected'
): Promise<Application> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)
    .select('*')
    .single();

  if (error) throw error;

  return data as Application;
}

// 스카웃 제안
export async function sendScout(
  projectId: string,
  toUserId: string,
  role: string,
  message: string
): Promise<Scout> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('scouts')
    .insert({
      project_id: projectId,
      from_user_id: user.id,
      to_user_id: toUserId,
      role,
      message,
    })
    .select('*')
    .single();

  if (error) throw error;

  // 스카웃 대상에게 알림
  await supabase.from('notifications').insert({
    user_id: toUserId,
    type: 'scout',
    title: '스카웃 제안이 도착했습니다',
    content: `${role} 역할로 스카웃 제안을 받았습니다`,
    link: `/scouts`,
  });

  return data as Scout;
}

// 내 스카웃 목록
export async function getMyScouts(): Promise<Scout[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('scouts')
    .select(
      `
      *,
      project:projects (
        id,
        title
      ),
      from_user:users!from_user_id (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq('to_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []) as Scout[];
}

// 스카웃 처리 (수락/거절)
export async function updateScoutStatus(
  scoutId: string,
  status: 'accepted' | 'rejected'
): Promise<Scout> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('scouts')
    .update({ status })
    .eq('id', scoutId)
    .select('*')
    .single();

  if (error) throw error;

  return data as Scout;
}

// 팀원 제거
export async function removeMember(projectId: string, userId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
}
```

## UI Components

### 1. 프로젝트 목록 페이지
파일: `web/app/(main)/projects/page.tsx`

주요 기능:
- 프로젝트 카드 그리드
- 상태 필터 (모집 중, 진행 중 등)
- 기술 스택 필터
- 검색
- 무한 스크롤

### 2. 프로젝트 상세 페이지
파일: `web/app/(main)/projects/[id]/page.tsx`

표시 정보:
- 프로젝트 정보
- 필요한 역할 목록 (모집 현황)
- 팀원 목록
- 지원하기 버튼
- 관리자 기능 (수정, 삭제, 지원서 관리)

### 3. 프로젝트 생성/수정 페이지
파일: `web/app/(main)/projects/new/page.tsx`

주요 기능:
- 아이디어 선택 (선택적)
- 역할 추가 (역할명, 인원, 요구 기술)
- 기술 스택 선택
- 프로젝트 기간

### 4. 지원서 관리 페이지
파일: `web/app/(main)/projects/[id]/applications/page.tsx`

주요 기능:
- 지원서 목록
- 지원자 프로필 확인
- 수락/거절 버튼
- 역할별 필터

### 5. 스카웃 페이지
파일: `web/app/(main)/scouts/page.tsx`

주요 기능:
- 받은 스카웃 목록
- 프로젝트 정보 미리보기
- 수락/거절 버튼

## Tasks

### Phase 1: Database Setup
- [ ] projects, project_members, applications, scouts 테이블 생성
- [ ] RLS 정책 및 트리거 설정

### Phase 2: API Layer
- [ ] 프로젝트 CRUD API
- [ ] 지원 시스템 API
- [ ] 스카웃 시스템 API

### Phase 3: UI Components
- [ ] ProjectCard 컴포넌트
- [ ] RoleSelector 컴포넌트
- [ ] ApplicationCard 컴포넌트

### Phase 4: Pages
- [ ] 프로젝트 목록 페이지
- [ ] 프로젝트 상세 페이지
- [ ] 프로젝트 생성/수정 페이지
- [ ] 지원서 관리 페이지
- [ ] 스카웃 페이지

### Phase 5: Features
- [ ] 지원하기 기능
- [ ] 스카웃 제안 기능
- [ ] 알림 연동

## Success Criteria
- [ ] 프로젝트 CRUD 정상 작동
- [ ] 지원/스카웃 시스템 정상 작동
- [ ] 팀원 관리 기능 정상 작동
- [ ] 실시간 알림
- [ ] 반응형 UI

## Notes
- required_roles는 JSONB 타입으로 유연한 구조
- 지원 수락 시 자동으로 멤버 추가 및 알림 발송
- 프로젝트 owner는 자동으로 멤버로 추가됨
