'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, ThumbsUp, MessageCircle, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import type { Idea } from '@kunnective/shared'

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'views'>('latest')
  const supabase = createClient()

  useEffect(() => {
    loadIdeas()
  }, [sortBy])

  async function loadIdeas() {
    try {
      setLoading(true)

      let query = supabase
        .from('ideas')
        .select(`
          *,
          author:users!ideas_author_id_fkey(id, username, name, avatar_url)
        `)
        .eq('status', 'active')
        .limit(50)

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'popular') {
        query = query.order('likes_count', { ascending: false })
      } else if (sortBy === 'views') {
        query = query.order('view_count', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error
      setIdeas(data || [])
    } catch (error) {
      console.error('Error loading ideas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadIdeas()
  }

  if (loading) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-8">
        <div className="mb-8">
          <motion.div
            className="h-10 w-48 bg-muted rounded mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="h-6 w-96 bg-muted rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className="p-6 border border-border rounded-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            >
              <div className="h-6 w-3/4 bg-muted rounded mb-3" />
              <div className="h-4 w-full bg-muted rounded mb-2" />
              <div className="h-4 w-full bg-muted rounded mb-2" />
              <div className="h-4 w-2/3 bg-muted rounded mb-4" />
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="h-4 w-12 bg-muted rounded" />
                  <div className="h-4 w-12 bg-muted rounded" />
                </div>
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">💡 아이디어</h1>
            <p className="text-muted-foreground">
              다양한 아이디어를 둘러보고 공감하세요
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/ideas/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              아이디어 올리기
            </Link>
          </motion.div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="아이디어 검색..."
                className="w-full pl-9 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <motion.button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              검색
            </motion.button>
          </form>

          <div className="flex gap-2">
            <motion.button
              onClick={() => setSortBy('latest')}
              className={`px-4 py-2 rounded-lg ${sortBy === 'latest'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border hover:bg-accent'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              최신순
            </motion.button>
            <motion.button
              onClick={() => setSortBy('popular')}
              className={`px-4 py-2 rounded-lg ${sortBy === 'popular'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border hover:bg-accent'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              인기순
            </motion.button>
            <motion.button
              onClick={() => setSortBy('views')}
              className={`px-4 py-2 rounded-lg ${sortBy === 'views'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border hover:bg-accent'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              조회순
            </motion.button>
          </div>
        </div>

        {ideas.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>아직 아이디어가 없습니다.</p>
            <p className="mt-2">첫 번째 아이디어를 올려보세요!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea, index) => (
              <motion.div
                key={idea.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="h-full"
              >
                <Link
                  href={`/ideas/${idea.id}`}
                  className="flex flex-col h-full p-6 border border-border rounded-lg hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-semibold mb-3 line-clamp-2">
                    {idea.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                    {idea.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {idea.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {idea.comments_count}
                      </span>
                    </div>
                    <span>
                      {idea.author?.username || '익명'}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
