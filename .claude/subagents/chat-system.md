# Chat System Subagent

## Role
실시간 채팅 및 메시징 시스템 구축 전문 에이전트

## Responsibilities
1. 1:1 메시징 시스템
2. 그룹 채팅 (프로젝트별)
3. 실시간 메시지 전송/수신
4. 읽음 표시
5. 채팅방 관리
6. 알림 연동

## Database Schema

```sql
-- chat_rooms 테이블
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL, -- direct, group
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_type CHECK (type IN ('direct', 'group')),
  CONSTRAINT group_has_project CHECK (type = 'direct' OR project_id IS NOT NULL)
);

-- chat_participants 테이블
CREATE TABLE chat_participants (
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  last_read_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- messages 테이블
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX idx_chat_rooms_project_id ON chat_rooms(project_id);

CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_room_id ON chat_participants(room_id);

CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- updated_at 트리거
CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- chat_rooms 정책
CREATE POLICY "Users can view own chat rooms"
  ON chat_rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE room_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chat rooms"
  ON chat_rooms FOR INSERT
  WITH CHECK (true);

-- chat_participants 정책
CREATE POLICY "Users can view participants in own rooms"
  ON chat_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp
      WHERE cp.room_id = room_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join chat rooms"
  ON chat_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own participant data"
  ON chat_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- messages 정책
CREATE POLICY "Users can view messages in own rooms"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE room_id = messages.room_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to own rooms"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE room_id = messages.room_id AND user_id = auth.uid()
    )
  );

-- 함수: 1:1 채팅방 찾기 또는 생성
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

-- 함수: 프로젝트 그룹 채팅방 생성
CREATE OR REPLACE FUNCTION create_project_room(proj_id UUID, room_name VARCHAR)
RETURNS UUID AS $$
DECLARE
  room UUID;
BEGIN
  -- 채팅방 생성
  INSERT INTO chat_rooms (type, project_id, name)
  VALUES ('group', proj_id, room_name)
  RETURNING id INTO room;

  -- 프로젝트 멤버들을 참여자로 추가
  INSERT INTO chat_participants (room_id, user_id)
  SELECT room, user_id FROM project_members WHERE project_id = proj_id;

  RETURN room;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 프로젝트 생성 시 자동으로 그룹 채팅방 생성
CREATE OR REPLACE FUNCTION auto_create_project_room()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_project_room(
    NEW.id,
    NEW.title || ' 팀 채팅'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_room_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_project_room();

-- 트리거: 프로젝트 멤버 추가 시 그룹 채팅방에 참여자로 추가
CREATE OR REPLACE FUNCTION add_member_to_room()
RETURNS TRIGGER AS $$
DECLARE
  room UUID;
BEGIN
  -- 프로젝트의 그룹 채팅방 찾기
  SELECT id INTO room FROM chat_rooms WHERE project_id = NEW.project_id AND type = 'group';

  IF room IS NOT NULL THEN
    INSERT INTO chat_participants (room_id, user_id)
    VALUES (room, NEW.user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER member_added_to_room
  AFTER INSERT ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION add_member_to_room();

-- 트리거: 메시지 전송 시 채팅방 updated_at 업데이트
CREATE OR REPLACE FUNCTION update_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms SET updated_at = NOW() WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_sent
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_room_timestamp();

-- 뷰: 채팅방 목록 (마지막 메시지 포함)
CREATE OR REPLACE VIEW chat_room_list AS
SELECT
  cr.id,
  cr.type,
  cr.project_id,
  cr.name,
  cr.created_at,
  cr.updated_at,
  (
    SELECT json_build_object(
      'id', m.id,
      'sender_id', m.sender_id,
      'content', m.content,
      'created_at', m.created_at
    )
    FROM messages m
    WHERE m.room_id = cr.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) AS last_message,
  (
    SELECT COUNT(*)::int
    FROM messages m
    JOIN chat_participants cp ON cp.room_id = cr.id
    WHERE m.room_id = cr.id
      AND m.created_at > cp.last_read_at
      AND cp.user_id = auth.uid()
  ) AS unread_count
FROM chat_rooms cr;
```

## TypeScript Types

파일: `shared/types/chat.ts`
```typescript
export interface ChatRoom {
  id: string;
  type: 'direct' | 'group';
  project_id: string | null;
  name: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  participants?: ChatParticipant[];
  last_message?: Message;
  unread_count?: number;
  other_user?: {
    // direct 채팅인 경우
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export interface ChatParticipant {
  room_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  user?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export interface SendMessageData {
  content: string;
}
```

## Validation Schemas

파일: `shared/utils/validation.ts` (추가)
```typescript
export const messageSchema = z.object({
  content: z
    .string()
    .min(1, '메시지를 입력하세요')
    .max(2000, '메시지는 2000자를 초과할 수 없습니다'),
});
```

## API Functions

파일: `web/lib/api/chat.ts`
```typescript
import { createClient } from '@/lib/supabase/client';
import { ChatRoom, Message } from '@/shared/types/chat';

// 내 채팅방 목록
export async function getChatRooms(): Promise<ChatRoom[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 참여 중인 채팅방 가져오기
  const { data: participantData, error: participantError } = await supabase
    .from('chat_participants')
    .select('room_id')
    .eq('user_id', user.id);

  if (participantError) throw participantError;

  const roomIds = participantData.map((p) => p.room_id);

  if (roomIds.length === 0) return [];

  // 채팅방 정보 가져오기
  const { data, error } = await supabase
    .from('chat_rooms')
    .select(
      `
      *,
      participants:chat_participants (
        *,
        user:users (
          id,
          name,
          avatar_url
        )
      )
    `
    )
    .in('id', roomIds)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  const rooms = data as ChatRoom[];

  // 각 채팅방의 마지막 메시지 및 읽지 않은 메시지 수 가져오기
  await Promise.all(
    rooms.map(async (room) => {
      // 마지막 메시지
      const { data: lastMessage } = await supabase
        .from('messages')
        .select(
          `
          *,
          sender:users!sender_id (
            id,
            name,
            avatar_url
          )
        `
        )
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      room.last_message = lastMessage as Message;

      // 읽지 않은 메시지 수
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('last_read_at')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .single();

      if (participant) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id)
          .gt('created_at', participant.last_read_at)
          .neq('sender_id', user.id);

        room.unread_count = count || 0;
      }

      // direct 채팅인 경우 상대방 정보
      if (room.type === 'direct' && room.participants) {
        const otherUser = room.participants.find((p) => p.user_id !== user.id);
        if (otherUser?.user) {
          room.other_user = otherUser.user;
        }
      }
    })
  );

  return rooms;
}

// 1:1 채팅방 가져오기 또는 생성
export async function getOrCreateDirectRoom(otherUserId: string): Promise<ChatRoom> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // RPC 함수 호출
  const { data: roomId, error } = await supabase.rpc('get_or_create_direct_room', {
    user1_id: user.id,
    user2_id: otherUserId,
  });

  if (error) throw error;

  // 채팅방 정보 가져오기
  const { data: room, error: roomError } = await supabase
    .from('chat_rooms')
    .select(
      `
      *,
      participants:chat_participants (
        *,
        user:users (
          id,
          name,
          avatar_url
        )
      )
    `
    )
    .eq('id', roomId)
    .single();

  if (roomError) throw roomError;

  const chatRoom = room as ChatRoom;

  // 상대방 정보 설정
  const otherUser = chatRoom.participants?.find((p) => p.user_id === otherUserId);
  if (otherUser?.user) {
    chatRoom.other_user = otherUser.user;
  }

  return chatRoom;
}

// 채팅방 메시지 목록
export async function getMessages(roomId: string, limit: number = 50): Promise<Message[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('messages')
    .select(
      `
      *,
      sender:users!sender_id (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).reverse() as Message[];
}

// 메시지 전송
export async function sendMessage(roomId: string, content: string): Promise<Message> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      sender_id: user.id,
      content,
    })
    .select(
      `
      *,
      sender:users!sender_id (
        id,
        name,
        avatar_url
      )
    `
    )
    .single();

  if (error) throw error;

  return data as Message;
}

// 읽음 표시 업데이트
export async function markAsRead(roomId: string): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('chat_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', user.id);

  if (error) throw error;
}

// 실시간 메시지 구독
export function subscribeToMessages(roomId: string, callback: (message: Message) => void) {
  const supabase = createClient();

  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        // 발신자 정보 가져오기
        const { data: sender } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .eq('id', payload.new.sender_id)
          .single();

        const message: Message = {
          ...(payload.new as Message),
          sender,
        };

        callback(message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

## Custom Hooks

파일: `web/lib/hooks/useChat.ts`
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatRoom } from '@/shared/types/chat';
import { getChatRooms } from '@/lib/api/chat';

export function useChatRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getChatRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return { rooms, loading, refetch: fetchRooms };
}
```

파일: `web/lib/hooks/useMessages.ts`
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/shared/types/chat';
import { getMessages, sendMessage, markAsRead, subscribeToMessages } from '@/lib/api/chat';

export function useMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMessages(roomId);
      setMessages(data);
      await markAsRead(roomId);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 실시간 메시지 구독
  useEffect(() => {
    const unsubscribe = subscribeToMessages(roomId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      markAsRead(roomId);
    });

    return unsubscribe;
  }, [roomId]);

  const send = useCallback(
    async (content: string) => {
      try {
        const message = await sendMessage(roomId, content);
        // 실시간 구독으로 추가되므로 여기서는 추가하지 않음
        return message;
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      }
    },
    [roomId]
  );

  return { messages, loading, sendMessage: send };
}
```

## UI Components

### Required Packages
```bash
pnpm add date-fns
```

### 1. 채팅 목록 페이지
파일: `web/app/(main)/chat/page.tsx`

주요 기능:
- 채팅방 목록
- 마지막 메시지 미리보기
- 읽지 않은 메시지 배지
- 상대방 정보 (direct) / 프로젝트 이름 (group)
- 시간 표시 (상대 시간)

### 2. 채팅방 페이지
파일: `web/app/(main)/chat/[roomId]/page.tsx`

주요 기능:
- 메시지 목록 (스크롤 가능)
- 실시간 메시지 수신
- 메시지 입력창
- 전송 버튼
- 상대방 정보 헤더
- 자동 스크롤 (새 메시지 시)

### 3. 메시지 컴포넌트
파일: `web/components/chat/MessageBubble.tsx`

표시 정보:
- 메시지 내용
- 발신자 이름 (그룹 채팅)
- 시간
- 본인/상대방 구분 (UI)

### 4. 채팅방 카드 컴포넌트
파일: `web/components/chat/ChatRoomCard.tsx`

표시 정보:
- 상대방 아바타 / 프로젝트 아이콘
- 채팅방 이름
- 마지막 메시지
- 시간
- 읽지 않은 메시지 배지

### 5. 메시지 입력 컴포넌트
파일: `web/components/chat/MessageInput.tsx`

주요 기능:
- 텍스트 입력
- Enter 키로 전송
- Shift+Enter로 줄바꿈
- 전송 버튼
- 빈 메시지 전송 방지

## Tasks

### Phase 1: Database Setup
- [ ] chat_rooms, chat_participants, messages 테이블 생성
- [ ] RLS 정책 설정
- [ ] 트리거 및 함수 생성
- [ ] 뷰 생성

### Phase 2: API Layer
- [ ] 채팅방 API
- [ ] 메시지 API
- [ ] 실시간 구독 설정

### Phase 3: UI Components
- [ ] MessageBubble 컴포넌트
- [ ] ChatRoomCard 컴포넌트
- [ ] MessageInput 컴포넌트

### Phase 4: Pages
- [ ] 채팅 목록 페이지
- [ ] 채팅방 페이지

### Phase 5: Features
- [ ] 실시간 메시지 전송/수신
- [ ] 읽음 표시
- [ ] 알림 연동

### Phase 6: Polish
- [ ] 자동 스크롤
- [ ] 로딩 상태
- [ ] 빈 상태 UI
- [ ] 반응형 디자인

## Success Criteria
- [ ] 1:1 채팅 정상 작동
- [ ] 그룹 채팅 정상 작동
- [ ] 실시간 메시지 전송/수신
- [ ] 읽음 표시 정상 작동
- [ ] 읽지 않은 메시지 카운트 정확
- [ ] 반응형 UI

## Notes
- Supabase Realtime을 사용한 실시간 메시지
- WebSocket 연결 관리 주의
- 메시지 페이지네이션 (무한 스크롤)
- 프로젝트 생성 시 자동으로 그룹 채팅방 생성
- 팀원 추가 시 자동으로 채팅방 참여
