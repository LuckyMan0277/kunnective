-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'in_progress', 'completed', 'on_hold')),
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  github_url VARCHAR(500),
  demo_url VARCHAR(500),
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project members table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create project applications table
CREATE TABLE IF NOT EXISTS public.project_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create scout invitations table
CREATE TABLE IF NOT EXISTS public.project_scouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, receiver_id)
);

-- Create project required roles table
CREATE TABLE IF NOT EXISTS public.project_required_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role_name VARCHAR(100) NOT NULL,
  count INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_idea_id ON public.projects(idea_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_project_id ON public.project_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_user_id ON public.project_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_status ON public.project_applications(status);
CREATE INDEX IF NOT EXISTS idx_project_scouts_project_id ON public.project_scouts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_scouts_receiver_id ON public.project_scouts(receiver_id);
CREATE INDEX IF NOT EXISTS idx_project_scouts_status ON public.project_scouts(status);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_scouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_required_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Projects are viewable by everyone"
  ON public.projects FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners can update their projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Project owners can delete their projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for project members
CREATE POLICY "Project members are viewable by everyone"
  ON public.project_members FOR SELECT
  USING (true);

CREATE POLICY "Project owners can add members"
  ON public.project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update members"
  ON public.project_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can leave projects"
  ON public.project_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- RLS Policies for applications
CREATE POLICY "Users can view applications for their projects"
  ON public.project_applications FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can apply to projects"
  ON public.project_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project owners can update applications"
  ON public.project_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own applications"
  ON public.project_applications FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for scouts
CREATE POLICY "Users can view scouts sent to them"
  ON public.project_scouts FOR SELECT
  USING (
    receiver_id = auth.uid() OR
    sender_id = auth.uid()
  );

CREATE POLICY "Project members can send scouts"
  ON public.project_scouts FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND
      (p.owner_id = auth.uid() OR
       EXISTS (
         SELECT 1 FROM public.project_members pm
         WHERE pm.project_id = p.id AND pm.user_id = auth.uid() AND pm.status = 'active'
       ))
    )
  );

CREATE POLICY "Scout receivers can update scouts"
  ON public.project_scouts FOR UPDATE
  USING (receiver_id = auth.uid());

CREATE POLICY "Scout senders can delete scouts"
  ON public.project_scouts FOR DELETE
  USING (sender_id = auth.uid());

-- RLS Policies for required roles
CREATE POLICY "Required roles are viewable by everyone"
  ON public.project_required_roles FOR SELECT
  USING (true);

CREATE POLICY "Project owners can manage required roles"
  ON public.project_required_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_applications_updated_at
  BEFORE UPDATE ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_scouts_updated_at
  BEFORE UPDATE ON public.project_scouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
