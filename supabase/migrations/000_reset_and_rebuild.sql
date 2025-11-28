-- ============================================================
-- RESET: 모든 테이블, 정책, 트리거, 함수 삭제
-- ============================================================

-- Drop all tables first (CASCADE will remove all dependent objects including triggers and policies)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.project_comments CASCADE;
DROP TABLE IF EXISTS public.project_likes CASCADE;
DROP TABLE IF EXISTS public.headhunt_proposals CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.positions CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.idea_comments CASCADE;
DROP TABLE IF EXISTS public.idea_bookmarks CASCADE;
DROP TABLE IF EXISTS public.idea_likes CASCADE;
DROP TABLE IF EXISTS public.ideas CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_idea_view_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_notification(UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, JSONB) CASCADE;
DROP FUNCTION IF EXISTS notify_application_accepted() CASCADE;
DROP FUNCTION IF EXISTS notify_application_rejected() CASCADE;
DROP FUNCTION IF EXISTS notify_new_application() CASCADE;
DROP FUNCTION IF EXISTS notify_idea_liked() CASCADE;
DROP FUNCTION IF EXISTS notify_idea_commented() CASCADE;
DROP FUNCTION IF EXISTS notify_member_joined() CASCADE;

-- ============================================================
-- REBUILD: 모든 테이블, 정책, 트리거, 함수 생성
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE
-- ============================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100),
  role VARCHAR(100),
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  portfolio_url VARCHAR(500),
  github_url VARCHAR(500),
  linkedin_url VARCHAR(500),
  avatar_url VARCHAR(500),
  available_for_projects BOOLEAN DEFAULT true,
  project_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.users FOR DELETE USING (auth.uid() = id);

COMMENT ON TABLE public.users IS 'Kunnective - 사용자 프로필 정보';

-- ============================================================
-- 2. IDEAS TABLES
-- ============================================================

CREATE TABLE public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'converted_to_project', 'archived')),
  converted_project_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.idea_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

CREATE TABLE public.idea_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

CREATE TABLE public.idea_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.idea_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for ideas
CREATE INDEX idx_ideas_author_id ON public.ideas(author_id);
CREATE INDEX idx_ideas_status ON public.ideas(status);
CREATE INDEX idx_ideas_created_at ON public.ideas(created_at DESC);
CREATE INDEX idx_ideas_likes_count ON public.ideas(likes_count DESC);
CREATE INDEX idx_idea_likes_idea_id ON public.idea_likes(idea_id);
CREATE INDEX idx_idea_likes_user_id ON public.idea_likes(user_id);
CREATE INDEX idx_idea_bookmarks_idea_id ON public.idea_bookmarks(idea_id);
CREATE INDEX idx_idea_bookmarks_user_id ON public.idea_bookmarks(user_id);
CREATE INDEX idx_idea_comments_idea_id ON public.idea_comments(idea_id);
CREATE INDEX idx_idea_comments_parent_id ON public.idea_comments(parent_comment_id);

-- RLS for ideas
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ideas are viewable by everyone"
  ON public.ideas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create ideas"
  ON public.ideas FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own ideas"
  ON public.ideas FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own ideas"
  ON public.ideas FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Likes are viewable by everyone"
  ON public.idea_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like ideas"
  ON public.idea_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes"
  ON public.idea_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own bookmarks"
  ON public.idea_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can bookmark ideas"
  ON public.idea_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own bookmarks"
  ON public.idea_bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments are viewable by everyone"
  ON public.idea_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment"
  ON public.idea_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own comments"
  ON public.idea_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own comments"
  ON public.idea_comments FOR DELETE USING (auth.uid() = author_id);

-- ============================================================
-- 3. PROJECTS TABLES
-- ============================================================

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),
  tech_stack TEXT[] DEFAULT '{}',
  duration VARCHAR(50),
  status VARCHAR(20) DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'in_progress', 'completed', 'on_hold')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  source_idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
  github_url VARCHAR(500),
  demo_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  required_count INTEGER DEFAULT 1,
  filled_count INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  joined_via VARCHAR(20) NOT NULL CHECK (joined_via IN ('application', 'headhunt')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.headhunt_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.project_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE TABLE public.project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for projects
CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_projects_source_idea_id ON public.projects(source_idea_id);
CREATE INDEX idx_projects_category ON public.projects(category);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_projects_likes_count ON public.projects(likes_count DESC);
CREATE INDEX idx_positions_project_id ON public.positions(project_id);
CREATE INDEX idx_team_members_project_id ON public.team_members(project_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_applications_project_id ON public.applications(project_id);
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_headhunt_proposals_project_id ON public.headhunt_proposals(project_id);
CREATE INDEX idx_headhunt_proposals_to_user_id ON public.headhunt_proposals(to_user_id);
CREATE INDEX idx_headhunt_proposals_status ON public.headhunt_proposals(status);
CREATE INDEX idx_project_likes_project_id ON public.project_likes(project_id);
CREATE INDEX idx_project_likes_user_id ON public.project_likes(user_id);
CREATE INDEX idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX idx_project_comments_parent_id ON public.project_comments(parent_comment_id);

-- RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.headhunt_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects are viewable by everyone"
  ON public.projects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Project owners can update their projects"
  ON public.projects FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Project owners can delete their projects"
  ON public.projects FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Positions are viewable by everyone"
  ON public.positions FOR SELECT USING (true);
CREATE POLICY "Project owners can manage positions"
  ON public.positions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  );

CREATE POLICY "Team members are viewable by everyone"
  ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Project owners can add team members"
  ON public.team_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  );
CREATE POLICY "Project owners can update team members"
  ON public.team_members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  );
CREATE POLICY "Members can leave projects"
  ON public.team_members FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can view applications for their projects"
  ON public.applications FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  );
CREATE POLICY "Authenticated users can apply to projects"
  ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Project owners can update applications"
  ON public.applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
  );
CREATE POLICY "Users can delete their own applications"
  ON public.applications FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view headhunt proposals sent to them"
  ON public.headhunt_proposals FOR SELECT USING (
    to_user_id = auth.uid() OR from_user_id = auth.uid()
  );
CREATE POLICY "Project owners can send headhunt proposals"
  ON public.headhunt_proposals FOR INSERT WITH CHECK (
    from_user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Proposal receivers can update proposals"
  ON public.headhunt_proposals FOR UPDATE USING (to_user_id = auth.uid());
CREATE POLICY "Proposal senders can delete proposals"
  ON public.headhunt_proposals FOR DELETE USING (from_user_id = auth.uid());

CREATE POLICY "Project likes are viewable by everyone"
  ON public.project_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like projects"
  ON public.project_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes"
  ON public.project_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Project comments are viewable by everyone"
  ON public.project_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment on projects"
  ON public.project_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own project comments"
  ON public.project_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own project comments"
  ON public.project_comments FOR DELETE USING (auth.uid() = author_id);

-- ============================================================
-- 4. REVIEWS TABLE
-- ============================================================

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewee_id, project_id)
);

CREATE INDEX idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX idx_reviews_project_id ON public.reviews(project_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- ============================================================
-- 5. NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'application_accepted',
    'application_rejected',
    'new_application',
    'scout_received',
    'scout_accepted',
    'scout_rejected',
    'idea_liked',
    'idea_commented',
    'project_invite',
    'new_message',
    'member_joined',
    'member_left',
    'project_update',
    'system'
  )),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link_url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 6. FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_idea_view_count(idea_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.ideas
  SET view_count = view_count + 1
  WHERE id = idea_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_link_url VARCHAR DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link_url, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link_url, p_metadata)
  RETURNING id INTO notification_id;
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification trigger functions
CREATE OR REPLACE FUNCTION notify_application_accepted()
RETURNS TRIGGER AS $$
DECLARE
  project_title TEXT;
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    SELECT title INTO project_title FROM public.projects WHERE id = NEW.project_id;
    PERFORM create_notification(
      NEW.user_id,
      'application_accepted',
      '지원이 수락되었습니다',
      format('"%s" 프로젝트 지원이 수락되었습니다!', project_title),
      format('/projects/%s', NEW.project_id),
      jsonb_build_object('project_id', NEW.project_id, 'application_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_application_rejected()
RETURNS TRIGGER AS $$
DECLARE
  project_title TEXT;
BEGIN
  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    SELECT title INTO project_title FROM public.projects WHERE id = NEW.project_id;
    PERFORM create_notification(
      NEW.user_id,
      'application_rejected',
      '지원이 거절되었습니다',
      format('"%s" 프로젝트 지원이 거절되었습니다.', project_title),
      format('/projects/%s', NEW.project_id),
      jsonb_build_object('project_id', NEW.project_id, 'application_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_new_application()
RETURNS TRIGGER AS $$
DECLARE
  project_title TEXT;
  project_owner_id UUID;
  applicant_name TEXT;
BEGIN
  SELECT title, owner_id INTO project_title, project_owner_id
  FROM public.projects WHERE id = NEW.project_id;

  SELECT name INTO applicant_name FROM public.users WHERE id = NEW.user_id;

  PERFORM create_notification(
    project_owner_id,
    'new_application',
    '새 지원서가 도착했습니다',
    format('%s님이 "%s" 프로젝트에 지원했습니다.', applicant_name, project_title),
    format('/projects/%s/manage', NEW.project_id),
    jsonb_build_object('project_id', NEW.project_id, 'application_id', NEW.id, 'applicant_id', NEW.user_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_idea_liked()
RETURNS TRIGGER AS $$
DECLARE
  idea_title TEXT;
  idea_author_id UUID;
  liker_name TEXT;
BEGIN
  SELECT title, author_id INTO idea_title, idea_author_id
  FROM public.ideas WHERE id = NEW.idea_id;

  IF NEW.user_id = idea_author_id THEN
    RETURN NEW;
  END IF;

  SELECT name INTO liker_name FROM public.users WHERE id = NEW.user_id;

  PERFORM create_notification(
    idea_author_id,
    'idea_liked',
    '아이디어에 좋아요가 추가되었습니다',
    format('%s님이 "%s" 아이디어를 좋아합니다.', liker_name, idea_title),
    format('/ideas/%s', NEW.idea_id),
    jsonb_build_object('idea_id', NEW.idea_id, 'liker_id', NEW.user_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_idea_commented()
RETURNS TRIGGER AS $$
DECLARE
  idea_title TEXT;
  idea_author_id UUID;
  commenter_name TEXT;
BEGIN
  SELECT title, author_id INTO idea_title, idea_author_id
  FROM public.ideas WHERE id = NEW.idea_id;

  IF NEW.author_id = idea_author_id THEN
    RETURN NEW;
  END IF;

  SELECT name INTO commenter_name FROM public.users WHERE id = NEW.author_id;

  PERFORM create_notification(
    idea_author_id,
    'idea_commented',
    '아이디어에 새 댓글이 달렸습니다',
    format('%s님이 "%s" 아이디어에 댓글을 남겼습니다.', commenter_name, idea_title),
    format('/ideas/%s', NEW.idea_id),
    jsonb_build_object('idea_id', NEW.idea_id, 'comment_id', NEW.id, 'commenter_id', NEW.author_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_member_joined()
RETURNS TRIGGER AS $$
DECLARE
  project_title TEXT;
  project_owner_id UUID;
  member_name TEXT;
BEGIN
  SELECT title, owner_id INTO project_title, project_owner_id
  FROM public.projects WHERE id = NEW.project_id;

  SELECT name INTO member_name FROM public.users WHERE id = NEW.user_id;

  IF NEW.user_id = project_owner_id THEN
    RETURN NEW;
  END IF;

  PERFORM create_notification(
    project_owner_id,
    'member_joined',
    '새 팀원이 합류했습니다',
    format('%s님이 "%s" 프로젝트에 합류했습니다.', member_name, project_title),
    format('/projects/%s', NEW.project_id),
    jsonb_build_object('project_id', NEW.project_id, 'member_id', NEW.user_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. TRIGGERS
-- ============================================================

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_idea_comments_updated_at
  BEFORE UPDATE ON public.idea_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_headhunt_proposals_updated_at
  BEFORE UPDATE ON public.headhunt_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_comments_updated_at
  BEFORE UPDATE ON public.project_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notify_application_accepted
  AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION notify_application_accepted();

CREATE TRIGGER trigger_notify_application_rejected
  AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION notify_application_rejected();

CREATE TRIGGER trigger_notify_new_application
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION notify_new_application();

CREATE TRIGGER trigger_notify_idea_liked
  AFTER INSERT ON public.idea_likes
  FOR EACH ROW EXECUTE FUNCTION notify_idea_liked();

CREATE TRIGGER trigger_notify_idea_commented
  AFTER INSERT ON public.idea_comments
  FOR EACH ROW EXECUTE FUNCTION notify_idea_commented();

CREATE TRIGGER trigger_notify_member_joined
  AFTER INSERT ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION notify_member_joined();
