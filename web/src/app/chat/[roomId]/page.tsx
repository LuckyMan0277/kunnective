'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ChatRoom, Message } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ChatRoomPage({
  params,
}: {
  params: { roomId: string }
}) {
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadChatRoom()
    loadMessages()
  }, [params.roomId])

  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel(`room:${params.roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${params.roomId}`,
        },
        (payload) => {
          loadMessages() // Reload to get user info
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.roomId, supabase])

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Mark messages as read when viewing
    if (currentUserId) {
      markAsRead()
    }
  }, [currentUserId, params.roomId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const markAsRead = async () => {
    try {
      await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', params.roomId)
        .eq('user_id', currentUserId!)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const loadChatRoom = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUserId(user.id)

      // Check if user is a participant
      const { data: participantCheck } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('room_id', params.roomId)
        .eq('user_id', user.id)
        .single()

      if (!participantCheck) {
        router.push('/chat')
        return
      }

      // Get room details
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select(
          `
          *,
          project:projects(id, title)
        `
        )
        .eq('id', params.roomId)
        .single()

      if (roomError) throw roomError

      // Get participants
      const { data: participants } = await supabase
        .from('chat_participants')
        .select(
          `
          *,
          user:users!chat_participants_user_id_fkey(id, name, avatar_url, major)
        `
        )
        .eq('room_id', params.roomId)

      // For direct chats, find the other participant
      let otherParticipant
      if (roomData.type === 'direct') {
        otherParticipant = participants?.find((p) => p.user_id !== user.id)?.user
      }

      setRoom({
        ...roomData,
        participants,
        other_participant: otherParticipant,
      })
    } catch (error) {
      console.error('Error loading chat room:', error)
      router.push('/chat')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(
          `
          *,
          user:users!messages_user_id_fkey(id, name, avatar_url)
        `
        )
        .eq('room_id', params.roomId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !currentUserId) return

    setSending(true)
    try {
      const { error } = await supabase.from('messages').insert({
        room_id: params.roomId,
        user_id: currentUserId,
        content: newMessage.trim(),
        type: 'text',
      })

      if (error) throw error

      setNewMessage('')
      markAsRead()
    } catch (error: any) {
      alert(error.message || '메시지 전송 실패')
    } finally {
      setSending(false)
    }
  }

  const getRoomDisplayName = () => {
    if (!room) return ''
    if (room.type === 'direct' && room.other_participant) {
      return room.other_participant.name
    }
    if (room.type === 'project' && room.project) {
      return room.project.title
    }
    return room.name || '채팅방'
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateDivider = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return '오늘'
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return '어제'
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const shouldShowDateDivider = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true

    const currentDate = new Date(currentMsg.created_at).toDateString()
    const prevDate = new Date(prevMsg.created_at).toDateString()
    return currentDate !== prevDate
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  if (!room) {
    return null
  }

  return (
    <div className="container max-w-4xl py-4 h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/chat">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          {room.type === 'direct' && room.other_participant?.avatar_url && (
            <img
              src={room.other_participant.avatar_url}
              alt={room.other_participant.name}
              className="w-10 h-10 rounded-full"
            />
          )}

          <div>
            <h2 className="font-semibold">{getRoomDisplayName()}</h2>
            {room.type === 'direct' && room.other_participant?.major && (
              <p className="text-sm text-muted-foreground">
                {room.other_participant.major}
              </p>
            )}
            {room.type !== 'direct' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{room.participants?.length || 0}명</span>
              </div>
            )}
          </div>
        </div>

        <Badge variant="secondary" className="text-xs">
          {room.type === 'direct' ? '1:1' : room.type === 'project' ? '프로젝트' : '그룹'}
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>아직 메시지가 없습니다</p>
            <p className="text-sm mt-1">첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.user_id === currentUserId
            const showDateDivider = shouldShowDateDivider(
              message,
              messages[index - 1]
            )

            return (
              <div key={message.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {formatDateDivider(message.created_at)}
                    </div>
                  </div>
                )}

                <div
                  className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0">
                      {message.user?.avatar_url ? (
                        <img
                          src={message.user.avatar_url}
                          alt={message.user.name}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-xs">
                          {message.user?.name[0]}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}
                  >
                    {!isOwn && (
                      <span className="text-xs text-muted-foreground px-2">
                        {message.user?.name}
                      </span>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground px-2">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="pt-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="메시지를 입력하세요..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
