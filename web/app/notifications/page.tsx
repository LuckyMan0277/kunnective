'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Mail, UserPlus, MessageSquare, ThumbsUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
  }, [filter])

  async function loadNotifications() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

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

  async function markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      )
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'application':
        return <UserPlus className="w-5 h-5 text-blue-600" />
      case 'proposal':
        return <Mail className="w-5 h-5 text-purple-600" />
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-green-600" />
      case 'like':
        return <ThumbsUp className="w-5 h-5 text-pink-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification.id)

    if (notification.link_url) {
      router.push(notification.link_url)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">🔔 알림</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent"
            >
              <CheckCheck className="w-4 h-4" />
              모두 읽음으로 표시
            </button>
          )}
        </div>
        <p className="text-muted-foreground">
          {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '모든 알림을 확인했습니다'}
        </p>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border hover:bg-accent'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'unread'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border hover:bg-accent'
          }`}
        >
          읽지 않음
        </button>
      </div>

      {/* 알림 목록 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>알림이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 border border-border rounded-lg cursor-pointer transition hover:shadow-md ${
                !notification.is_read ? 'bg-blue-50/50' : 'bg-card'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className={`${!notification.is_read ? 'font-semibold' : ''}`}>
                    {notification.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
