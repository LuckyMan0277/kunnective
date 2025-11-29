'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewIdeaPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('IT/Programming')
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('로그인이 필요합니다')
        router.push('/auth/login')
        return
      }

      const { error } = await supabase
        .from('ideas')
        .insert({
          author_id: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          tags: keywords.split(',').map(k => k.trim()).filter(k => k),
          status: 'active',
        })

      if (error) throw error

      router.push('/ideas')
      router.refresh()
    } catch (error) {
      console.error('Error creating idea:', error)
      alert('아이디어 작성 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">아이디어 올리기</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            제목 *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="아이디어 제목을 입력하세요"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            required
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            설명 *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="아이디어에 대해 자유롭게 설명해주세요"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[200px]"
            required
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-border rounded-lg hover:bg-accent"
            disabled={loading}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '작성 중...' : '아이디어 올리기'}
          </button>
        </div>
      </form>
    </div>
  )
}
