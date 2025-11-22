'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogoutButton } from '@/components/auth/logout-button'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const { user, loading } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadUnreadCount()

      // Subscribe to notification changes
      const channel = supabase
        .channel('notification-count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadUnreadCount()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const loadUnreadCount = async () => {
    if (!user) return

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">KU-Connect</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/ideas"
              className="transition-colors hover:text-foreground/80"
            >
              아이디어
            </Link>
            <Link
              href="/projects"
              className="transition-colors hover:text-foreground/80"
            >
              프로젝트
            </Link>
            {user && (
              <Link
                href="/chat"
                className="transition-colors hover:text-foreground/80"
              >
                채팅
              </Link>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {!loading && (
            <nav className="flex items-center space-x-2">
              {user ? (
                <>
                  <Button variant="ghost" size="icon" asChild className="relative">
                    <Link href="/notifications">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                      <span className="sr-only">알림</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/profile">프로필</Link>
                  </Button>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">로그인</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">회원가입</Link>
                  </Button>
                </>
              )}
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
