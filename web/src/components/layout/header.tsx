'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/auth/logout-button'
import { useAuth } from '@/lib/hooks/useAuth'

export function Header() {
  const { user, loading } = useAuth()

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
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {!loading && (
            <nav className="flex items-center space-x-2">
              {user ? (
                <>
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
