'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Lightbulb, Rocket, Users, Bell, User, LogOut, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUnreadCount(session.user.id)
      } else {
        setUnreadCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      loadUnreadCount(user.id)
    }
  }

  async function loadUnreadCount(userId: string) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setUnreadCount(count || 0)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition">
            Kunnective
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/ideas"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive('/ideas') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              아이디어
            </Link>
            <Link
              href="/projects"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive('/projects') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <Rocket className="w-4 h-4" />
              팀 모집
            </Link>
            <Link
              href="/talent"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isActive('/talent') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <Users className="w-4 h-4" />
              인재 찾기
            </Link>
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/notifications"
                  className="p-2 hover:bg-accent rounded-lg relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className="p-2 hover:bg-accent rounded-lg"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 hover:bg-accent rounded-lg"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-accent rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-2">
              <Link
                href="/ideas"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isActive('/ideas') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Lightbulb className="w-4 h-4" />
                아이디어
              </Link>
              <Link
                href="/projects"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isActive('/projects') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Rocket className="w-4 h-4" />
                팀 모집
              </Link>
              <Link
                href="/talent"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isActive('/talent') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="w-4 h-4" />
                인재 찾기
              </Link>
              <div className="border-t border-border my-2"></div>
              {user ? (
                <>
                  <Link
                    href="/notifications"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-lg relative"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bell className="w-4 h-4" />
                    알림
                    {unreadCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    프로필
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-lg text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 hover:bg-accent rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    회원가입
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
