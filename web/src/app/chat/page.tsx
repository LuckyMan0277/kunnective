'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Plus, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ChatRoom } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadChatRooms()
  }, [])

  const loadChatRooms = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUserId(user.id)

      // Get all chat rooms where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id)

      if (participantError) throw participantError

      const roomIds = participantData.map((p) => p.room_id)

      if (roomIds.length === 0) {
        setRooms([])
        setLoading(false)
        return
      }

      // Get room details with last message
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select(
          `
          *,
          project:projects(id, title)
        `
        )
        .in('id', roomIds)
        .order('updated_at', { ascending: false })

      if (roomsError) throw roomsError

      // Get participants and last message for each room
      const roomsWithDetails = await Promise.all(
        (roomsData || []).map(async (room) => {
          // Get participants
          const { data: participants } = await supabase
            .from('chat_participants')
            .select(
              `
              *,
              user:users!chat_participants_user_id_fkey(id, name, avatar_url)
            `
            )
            .eq('room_id', room.id)

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select(
              `
              *,
              user:users!messages_user_id_fkey(id, name)
            `
            )
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Get unread count
          const participant = participants?.find((p) => p.user_id === user.id)
          const { data: unreadMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('room_id', room.id)
            .gt('created_at', participant?.last_read_at || new Date(0).toISOString())
            .neq('user_id', user.id)

          // For direct chats, find the other participant
          let otherParticipant
          if (room.type === 'direct') {
            otherParticipant = participants?.find((p) => p.user_id !== user.id)?.user
          }

          return {
            ...room,
            participants,
            last_message: lastMessage,
            unread_count: unreadMessages?.length || 0,
            other_participant: otherParticipant,
          }
        })
      )

      setRooms(roomsWithDetails)
    } catch (error) {
      console.error('Error loading chat rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.type === 'direct' && room.other_participant) {
      return room.other_participant.name
    }
    if (room.type === 'project' && room.project) {
      return room.project.title
    }
    return room.name || '이름 없는 채팅방'
  }

  const getRoomAvatar = (room: ChatRoom) => {
    if (room.type === 'direct' && room.other_participant?.avatar_url) {
      return room.other_participant.avatar_url
    }
    return null
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}일 전`
    }
    if (hours > 0) {
      return `${hours}시간 전`
    }
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes > 0) {
      return `${minutes}분 전`
    }
    return '방금 전'
  }

  const truncateMessage = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">채팅</h1>
          <p className="text-muted-foreground mt-1">
            팀원들과 대화를 나누세요
          </p>
        </div>
      </div>

      {/* Chat Rooms List */}
      <div className="space-y-2">
        {rooms.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <MessageCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
              <p className="mb-2">아직 채팅방이 없습니다</p>
              <p className="text-sm">
                프로젝트 팀원과 대화를 시작하거나 다른 사용자에게 메시지를
                보내보세요
              </p>
            </CardContent>
          </Card>
        ) : (
          rooms.map((room) => (
            <Link key={room.id} href={`/chat/${room.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      {getRoomAvatar(room) ? (
                        <img
                          src={getRoomAvatar(room)!}
                          alt={getRoomDisplayName(room)}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          {room.type === 'direct' ? (
                            <MessageCircle className="w-6 h-6 text-primary" />
                          ) : (
                            <Users className="w-6 h-6 text-primary" />
                          )}
                        </div>
                      )}
                      {room.unread_count! > 0 && (
                        <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {room.unread_count! > 9 ? '9+' : room.unread_count}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {getRoomDisplayName(room)}
                        </h3>
                        {room.last_message && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(room.last_message.created_at)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {room.type === 'direct'
                            ? '1:1'
                            : room.type === 'project'
                            ? '프로젝트'
                            : '그룹'}
                        </Badge>
                        {room.type === 'project' && (
                          <span className="text-xs text-muted-foreground">
                            {room.participants?.length || 0}명
                          </span>
                        )}
                      </div>

                      {room.last_message ? (
                        <p className="text-sm text-muted-foreground truncate">
                          {room.last_message.user_id === currentUserId
                            ? '나: '
                            : `${room.last_message.user?.name}: `}
                          {truncateMessage(room.last_message.content)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          메시지가 없습니다
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
