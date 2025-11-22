'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Check,
  CheckCheck,
  Heart,
  MessageSquare,
  Users,
  UserPlus,
  Mail,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filter])

  const loadNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter === 'unread') {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.link_url) {
      router.push(notification.link_url)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application_accepted':
      case 'scout_accepted':
        return <Check className="w-5 h-5 text-green-500" />
      case 'application_rejected':
      case 'scout_rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'new_application':
      case 'project_invite':
        return <Mail className="w-5 h-5 text-blue-500" />
      case 'scout_received':
        return <UserPlus className="w-5 h-5 text-purple-500" />
      case 'idea_liked':
        return <Heart className="w-5 h-5 text-pink-500" />
      case 'idea_commented':
        return <MessageSquare className="w-5 h-5 text-orange-500" />
      case 'member_joined':
      case 'member_left':
        return <Users className="w-5 h-5 text-indigo-500" />
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 7) {
      return date.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
      })
    }
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

  const unreadCount = notifications.filter((n) => !n.is_read).length

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
          <h1 className="text-3xl font-bold">알림</h1>
          <p className="text-muted-foreground mt-1">
            새로운 활동을 확인하세요
          </p>
        </div>
      </div>

      {/* Filter & Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            전체
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            읽지 않음 {unreadCount > 0 && `(${unreadCount})`}
          </Button>
        </div>

        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            모두 읽음으로 표시
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
              <p className="mb-2">
                {filter === 'unread'
                  ? '읽지 않은 알림이 없습니다'
                  : '아직 알림이 없습니다'}
              </p>
              <p className="text-sm">
                활동을 시작하면 여기에 알림이 표시됩니다
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-colors ${
                notification.is_read
                  ? 'hover:bg-accent/50'
                  : 'bg-accent/30 hover:bg-accent/50'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-medium text-sm">
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <Badge
                          variant="default"
                          className="ml-auto flex-shrink-0 h-2 w-2 p-0 rounded-full"
                        >
                          <span className="sr-only">읽지 않음</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
