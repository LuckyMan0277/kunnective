'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { validateKonkukEmail, validatePassword } from '@kunnective/shared'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 건국대학교 이메일 검증
      const emailValidation = validateKonkukEmail(email)
      if (!emailValidation.isValid) {
        setError(emailValidation.message || '유효하지 않은 이메일입니다.')
        setLoading(false)
        return
      }

      // 비밀번호 강도 검증
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.isValid) {
        setError(passwordValidation.message || '유효하지 않은 비밀번호입니다.')
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.')
        setLoading(false)
        return
      }

      // 사용자명 검증
      if (!username || username.length < 2) {
        setError('사용자명은 최소 2자 이상이어야 합니다.')
        setLoading(false)
        return
      }

      // 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            name: name || username,
          },
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('회원가입에 실패했습니다')
      }

      // 이메일 확인 안내
      // Note: 프로필은 이메일 인증 후 데이터베이스 트리거가 자동으로 생성합니다
      setSuccess(true)
    } catch (error: any) {
      setError(error.message || '회원가입에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          className="max-w-md w-full text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">이메일을 확인해주세요</h1>
            <p className="text-muted-foreground">
              {email}로 인증 링크를 보냈습니다.
              <br />
              이메일을 확인하고 링크를 클릭하여 가입을 완료해주세요.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="text-primary hover:underline"
          >
            로그인 페이지로 이동
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">회원가입</h1>
          <p className="text-muted-foreground">
            건국대학교 학생 전용 플랫폼입니다
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              이메일 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@konkuk.ac.kr"
                className="w-full pl-9 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              @konkuk.ac.kr 또는 @kku.ac.kr 이메일만 가입 가능합니다.
            </p>
          </div>

          {/* 사용자명 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              사용자명 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="영문, 숫자, 한글 사용 가능"
                className="w-full pl-9 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          {/* 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              이름 (선택)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="실명 또는 닉네임"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="최소 8자, 대소문자, 숫자, 특수문자 포함"
                className="w-full pl-9 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              8자 이상, 대소문자, 숫자, 특수문자(!@#$%^&* 등) 각 1개 이상 포함
            </p>
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력해주세요"
                className="w-full pl-9 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <motion.div
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {/* 회원가입 버튼 */}
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? '가입 중...' : '회원가입'}
          </motion.button>
        </form>

        {/* 로그인 링크 */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            로그인
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
