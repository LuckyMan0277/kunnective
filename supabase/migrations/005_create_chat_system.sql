-- Chat Rooms Table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200),
  type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group', 'project')),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Participants Table
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_chat_rooms_project_id ON public.chat_rooms(project_id);
CREATE INDEX idx_chat_participants_room_id ON public.chat_participants(room_id);
CREATE INDEX idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX idx_messages_room_id ON public.messages(room_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_chat_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_rooms
  SET updated_at = NOW()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_room_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_room_timestamp();

-- Row Level Security Policies

-- Chat Rooms: Users can see rooms they're participants of
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (
    id IN (
      SELECT room_id FROM public.chat_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chat rooms"
  ON public.chat_rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Room admins can update chat rooms"
  ON public.chat_rooms FOR UPDATE
  USING (
    id IN (
      SELECT room_id FROM public.chat_participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Chat Participants: Users can see participants in their rooms
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants in their rooms"
  ON public.chat_participants FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM public.chat_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Room admins can add participants"
  ON public.chat_participants FOR INSERT
  WITH CHECK (
    room_id IN (
      SELECT room_id FROM public.chat_participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can update their own participation"
  ON public.chat_participants FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Room admins can remove participants"
  ON public.chat_participants FOR DELETE
  USING (
    room_id IN (
      SELECT room_id FROM public.chat_participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR user_id = auth.uid()
  );

-- Messages: Users can see messages in their rooms
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their rooms"
  ON public.messages FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM public.chat_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their rooms"
  ON public.messages FOR INSERT
  WITH CHECK (
    room_id IN (
      SELECT room_id FROM public.chat_participants
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING (user_id = auth.uid());

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(room_id UUID, user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  last_read TIMESTAMP WITH TIME ZONE;
  unread_count INTEGER;
BEGIN
  SELECT last_read_at INTO last_read
  FROM public.chat_participants
  WHERE chat_participants.room_id = get_unread_count.room_id
    AND chat_participants.user_id = get_unread_count.user_id;

  SELECT COUNT(*) INTO unread_count
  FROM public.messages
  WHERE messages.room_id = get_unread_count.room_id
    AND messages.created_at > last_read
    AND messages.user_id != get_unread_count.user_id;

  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
