'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function VerifiedPage() {
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUserName(user.user_metadata?.username || user.email?.split('@')[0] || '사용자')
        setLoading(false)
      } else {
        // If no user, redirect to login
        router.push('/auth/login')
      }
    }

    checkUser()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">인증 확인 중...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        className="max-w-md w-full text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold mb-4">
            환영합니다, {userName}님!
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            이메일 인증이 완료되었습니다
          </p>
          <p className="text-muted-foreground mb-8">
            이제 Kunnective의 모든 기능을 사용하실 수 있습니다
          </p>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/profile/setup"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90"
            >
              프로필 설정하기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 border border-border rounded-lg font-semibold hover:bg-accent"
            >
              나중에 설정하기
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-8 p-4 bg-muted rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-sm text-muted-foreground">
            💡 <strong>팁:</strong> 프로필을 완성하고 관심사를 추가하면 더 적합한 프로젝트를 추천받을 수 있습니다
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
