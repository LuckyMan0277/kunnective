-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
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

-- Indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- Row Level Security Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

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

-- Trigger: Notify when application is accepted
CREATE OR REPLACE FUNCTION notify_application_accepted()
RETURNS TRIGGER AS $$
DECLARE
  project_title TEXT;
  applicant_name TEXT;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Get project title
    SELECT title INTO project_title
    FROM public.projects
    WHERE id = NEW.project_id;

    -- Notify the applicant
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

CREATE TRIGGER trigger_notify_application_accepted
  AFTER UPDATE ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_accepted();

-- Trigger: Notify when application is rejected
CREATE OR REPLACE FUNCTION notify_application_rejected()
RETURNS TRIGGER AS $$
DECLARE
  project_title TEXT;
BEGIN
  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    SELECT title INTO project_title
    FROM public.projects
    WHERE id = NEW.project_id;

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

CREATE TRIGGER trigger_notify_application_rejected
  AFTER UPDATE ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_rejected();

-- Trigger: Notify project owner of new application
CREATE OR REPLACE FUNCTION notify_new_application()
RETURNS TRIGGER AS $$
DECLARE
  project_title TEXT;
  project_owner_id UUID;
  applicant_name TEXT;
BEGIN
  -- Get project info
  SELECT title, owner_id INTO project_title, project_owner_id
  FROM public.projects
  WHERE id = NEW.project_id;

  -- Get applicant name
  SELECT name INTO applicant_name
  FROM public.users
  WHERE id = NEW.user_id;

  -- Notify project owner
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

CREATE TRIGGER trigger_notify_new_application
  AFTER INSERT ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_application();

-- Trigger: Notify when idea is liked
CREATE OR REPLACE FUNCTION notify_idea_liked()
RETURNS TRIGGER AS $$
DECLARE
  idea_title TEXT;
  idea_author_id UUID;
  liker_name TEXT;
BEGIN
  -- Get idea info
  SELECT title, user_id INTO idea_title, idea_author_id
  FROM public.ideas
  WHERE id = NEW.idea_id;

  -- Don't notify if user likes their own idea
  IF NEW.user_id = idea_author_id THEN
    RETURN NEW;
  END IF;

  -- Get liker name
  SELECT name INTO liker_name
  FROM public.users
  WHERE id = NEW.user_id;

  -- Notify idea author
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

CREATE TRIGGER trigger_notify_idea_liked
  AFTER INSERT ON public.idea_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_idea_liked();

-- Trigger: Notify when idea is commented
CREATE OR REPLACE FUNCTION notify_idea_commented()
RETURNS TRIGGER AS $$
DECLARE
  idea_title TEXT;
  idea_author_id UUID;
  commenter_name TEXT;
BEGIN
  -- Get idea info
  SELECT title, user_id INTO idea_title, idea_author_id
  FROM public.ideas
  WHERE id = NEW.idea_id;

  -- Don't notify if user comments on their own idea
  IF NEW.user_id = idea_author_id THEN
    RETURN NEW;
  END IF;

  -- Get commenter name
  SELECT name INTO commenter_name
  FROM public.users
  WHERE id = NEW.user_id;

  -- Notify idea author
  PERFORM create_notification(
    idea_author_id,
    'idea_commented',
    '아이디어에 새 댓글이 달렸습니다',
    format('%s님이 "%s" 아이디어에 댓글을 남겼습니다.', commenter_name, idea_title),
    format('/ideas/%s', NEW.idea_id),
    jsonb_build_object('idea_id', NEW.idea_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_idea_commented
  AFTER INSERT ON public.idea_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_idea_commented();

-- Trigger: Notify when new member joins project
CREATE OR REPLACE FUNCTION notify_member_joined()
RETURNS TRIGGER AS $$
DECLARE
  project_title TEXT;
  project_owner_id UUID;
  member_name TEXT;
BEGIN
  -- Get project info
  SELECT title, owner_id INTO project_title, project_owner_id
  FROM public.projects
  WHERE id = NEW.project_id;

  -- Get member name
  SELECT name INTO member_name
  FROM public.users
  WHERE id = NEW.user_id;

  -- Don't notify if owner adds themselves
  IF NEW.user_id = project_owner_id THEN
    RETURN NEW;
  END IF;

  -- Notify project owner
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

CREATE TRIGGER trigger_notify_member_joined
  AFTER INSERT ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION notify_member_joined();
