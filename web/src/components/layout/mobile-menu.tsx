'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Home, Lightbulb, Rocket, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/useAuth'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  const menuItems = [
    { href: '/', label: '홈', icon: Home },
    { href: '/ideas', label: '아이디어', icon: Lightbulb },
    { href: '/projects', label: '프로젝트', icon: Rocket },
    ...(user ? [{ href: '/chat', label: '채팅', icon: MessageSquare }] : []),
  ]

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Menu Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[280px] bg-background border-l shadow-2xl z-40 flex flex-col"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8 mt-14">
                  <span className="text-lg font-bold">메뉴</span>
                </div>

                <nav className="space-y-2">
                  {menuItems.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <div className="mt-8 pt-8 border-t space-y-3">
                  {user ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Button
                          variant="outline"
                          asChild
                          className="w-full"
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href="/profile">프로필</Link>
                        </Button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Button
                          variant="outline"
                          asChild
                          className="w-full"
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href="/login">로그인</Link>
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Button
                          asChild
                          className="w-full gradient-primary text-white border-0"
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href="/signup">회원가입</Link>
                        </Button>
                      </motion.div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
