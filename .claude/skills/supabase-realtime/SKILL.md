---
name: supabase-realtime
description: "Supabase Realtime을 사용한 실시간 기능 구현을 돕습니다. 실시간 채팅, 알림, 데이터 동기화 등을 구축할 때 사용합니다. '실시간 채팅', 'WebSocket', '실시간 업데이트' 등의 요청에 활성화됩니다."
allowed-tools:
  - Read
  - Write
  - Edit
---

# Supabase Realtime 구현 스킬

Supabase Realtime을 사용하여 실시간 기능을 구현합니다.

## 주요 기능

### 1. Realtime 기본 설정

#### Supabase 대시보드 설정
1. Database > Replication > 실시간 구독할 테이블 선택
2. 테이블의 INSERT, UPDATE, DELETE 이벤트 활성화

#### 테이블 Realtime 활성화
```sql
-- 테이블에 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 2. 실시간 메시지 구독 (채팅)

```typescript
// lib/hooks/useRealtimeMessages.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types'

export function useRealtimeMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient()

  useEffect(() => {
    // 초기 메시지 로드
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data)
      }
    }

    fetchMessages()

    // 실시간 구독
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
        (payload) => {
          setMessages((current) => [...current, payload.new as Message])
        }
      )
      .subscribe()

    // 정리
    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  return messages
}
```

사용 예시:
```typescript
// app/chat/[roomId]/page.tsx
'use client'

import { useRealtimeMessages } from '@/lib/hooks/useRealtimeMessages'

export default function ChatRoom({ params }: { params: { roomId: string } }) {
  const messages = useRealtimeMessages(params.roomId)

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}
```

### 3. 실시간 알림 구독

```typescript
// lib/hooks/useRealtimeNotifications.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import { Notification } from '@/types'

export function useRealtimeNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    // 초기 알림 로드
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      }
    }

    fetchNotifications()

    // 실시간 구독
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((current) => [newNotif, ...current])
          setUnreadCount((count) => count + 1)

          // 브라우저 알림 (선택적)
          if (Notification.permission === 'granted') {
            new Notification(newNotif.title, {
              body: newNotif.content,
              icon: '/icon.png',
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification
          setNotifications((current) =>
            current.map((n) => (n.id === updated.id ? updated : n))
          )
          if (updated.is_read) {
            setUnreadCount((count) => Math.max(0, count - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
  }

  return { notifications, unreadCount, markAsRead }
}
```

### 4. Presence (온라인 상태)

```typescript
// lib/hooks/usePresence.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

interface UserPresence {
  user_id: string
  online_at: string
}

export function usePresence(roomId: string) {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const channel = supabase.channel(`presence:${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.values(state).flat() as UserPresence[]
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('New users joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Users left:', leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, user, supabase])

  return onlineUsers
}
```

사용 예시:
```typescript
export default function ChatRoom({ roomId }: { roomId: string }) {
  const onlineUsers = usePresence(roomId)

  return (
    <div>
      <div>온라인: {onlineUsers.length}명</div>
      {/* ... */}
    </div>
  )
}
```

### 5. Broadcast (브로드캐스트)

```typescript
// "typing..." 표시 구현
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export function useTypingIndicator(roomId: string) {
  const { user } = useAuth()
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const channel = supabase.channel(`typing:${roomId}`)

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setTypingUsers((current) => {
            if (!current.includes(payload.user_id)) {
              return [...current, payload.user_id]
            }
            return current
          })

          // 3초 후 제거
          setTimeout(() => {
            setTypingUsers((current) =>
              current.filter((id) => id !== payload.user_id)
            )
          }, 3000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, user, supabase])

  const sendTyping = async () => {
    const channel = supabase.channel(`typing:${roomId}`)
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user?.id },
    })
  }

  return { typingUsers, sendTyping }
}
```

사용 예시:
```typescript
const { typingUsers, sendTyping } = useTypingIndicator(roomId)

<input
  onChange={(e) => {
    sendTyping()
    // ... 메시지 입력 처리
  }}
/>

{typingUsers.length > 0 && <div>상대방이 입력 중...</div>}
```

### 6. 낙관적 업데이트 (Optimistic Updates)

```typescript
// lib/hooks/useLike.ts
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useLike(initialLiked: boolean, initialCount: number) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(initialCount)
  const supabase = createClient()

  const toggleLike = async (postId: string) => {
    // 낙관적 업데이트 (즉시 UI 변경)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikesCount((count) => (newLiked ? count + 1 : count - 1))

    try {
      if (newLiked) {
        await supabase.from('post_likes').insert({ post_id: postId })
      } else {
        await supabase.from('post_likes').delete().eq('post_id', postId)
      }
    } catch (error) {
      // 실패 시 롤백
      setIsLiked(!newLiked)
      setLikesCount((count) => (newLiked ? count - 1 : count + 1))
      console.error('Failed to toggle like:', error)
    }
  }

  return { isLiked, likesCount, toggleLike }
}
```

### 7. 실시간 데이터 동기화

```typescript
// lib/hooks/useRealtimeTable.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeTable<T>(
  table: string,
  filter?: { column: string; value: any }
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // 초기 데이터 로드
    const fetchData = async () => {
      let query = supabase.from(table).select('*')

      if (filter) {
        query = query.eq(filter.column, filter.value)
      }

      const { data: initialData } = await query
      if (initialData) {
        setData(initialData as T[])
      }
      setLoading(false)
    }

    fetchData()

    // 실시간 구독
    const channel = supabase
      .channel(`table:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData((current) => [...current, payload.new as T])
          } else if (payload.eventType === 'UPDATE') {
            setData((current) =>
              current.map((item: any) =>
                item.id === payload.new.id ? (payload.new as T) : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setData((current) =>
              current.filter((item: any) => item.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter?.column, filter?.value, supabase])

  return { data, loading }
}
```

사용 예시:
```typescript
// 특정 프로젝트의 팀원을 실시간으로 표시
const { data: members } = useRealtimeTable('project_members', {
  column: 'project_id',
  value: projectId,
})
```

### 8. 연결 상태 모니터링

```typescript
// lib/hooks/useRealtimeConnection.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('system')
      .on('system', { event: '*' }, (payload) => {
        if (payload.status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (payload.status === 'CLOSED') {
          setIsConnected(false)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return isConnected
}
```

## 베스트 프랙티스

### 1. 항상 정리(cleanup) 수행
```typescript
useEffect(() => {
  const channel = supabase.channel('my-channel')
  // ... 구독 설정

  return () => {
    supabase.removeChannel(channel)  // 필수!
  }
}, [])
```

### 2. 필터 사용
```typescript
// ❌ 나쁜 예: 모든 메시지를 받은 후 필터링
.on('postgres_changes', { event: 'INSERT', table: 'messages' }, callback)

// ✅ 좋은 예: 서버에서 필터링
.on(
  'postgres_changes',
  {
    event: 'INSERT',
    table: 'messages',
    filter: `room_id=eq.${roomId}`,
  },
  callback
)
```

### 3. 채널 재사용
```typescript
// 같은 채널을 여러 번 구독하지 말고 하나의 채널에 여러 이벤트 등록
const channel = supabase.channel('my-channel')
  .on('postgres_changes', { ... }, callback1)
  .on('presence', { ... }, callback2)
  .on('broadcast', { ... }, callback3)
  .subscribe()
```

### 4. 에러 처리
```typescript
.subscribe((status, err) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected!')
  }
  if (status === 'CHANNEL_ERROR') {
    console.error('Error:', err)
  }
  if (status === 'TIMED_OUT') {
    console.error('Connection timed out')
  }
})
```

## 사용 시나리오

이 스킬은 다음 요청에 활성화됩니다:

- "실시간 채팅을 구현해줘"
- "실시간 알림 시스템을 만들어줘"
- "WebSocket으로 데이터 동기화 해줘"
- "온라인 사용자 표시를 추가해줘"
- "typing indicator를 구현해줘"

## 체크리스트

- [ ] 테이블 Realtime 활성화
- [ ] Realtime 구독 코드 작성
- [ ] cleanup 함수 추가
- [ ] 에러 처리 추가
- [ ] 낙관적 업데이트 구현 (선택)
- [ ] 연결 상태 모니터링 (선택)

## 참고 자료

- [Supabase Realtime 문서](https://supabase.com/docs/guides/realtime)
- [Realtime Quickstart](https://supabase.com/docs/guides/realtime/quickstart)
- [Presence 가이드](https://supabase.com/docs/guides/realtime/presence)
