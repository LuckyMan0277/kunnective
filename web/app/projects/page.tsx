'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, ThumbsUp, MessageCircle, Users, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import type { Project } from '@/types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'recruiting' | 'in_progress'>('recruiting')
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const supabase = createClient()

  const categories = ['Web', 'Mobile', 'AI/ML', 'Game', 'Design', '기타']

  useEffect(() => {
    loadProjects()
  }, [statusFilter, categoryFilter, sortBy])

  async function loadProjects() {
    try {
      setLoading(true)

      let query = supabase
        .from('projects')
        .select(`
          *,
          owner:users!projects_owner_id_fkey(id, username, name, avatar_url),
          positions(id, role, required_count, filled_count)
        `)
        .limit(50)

      if (statusFilter === 'recruiting') {
        query = query.eq('status', 'recruiting')
      } else if (statusFilter === 'in_progress') {
        query = query.eq('status', 'in_progress')
      } else {
        query = query.in('status', ['recruiting', 'in_progress'])
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      if (sortBy === 'latest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'popular') {
        query = query.order('likes_count', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadProjects()
  }

  if (loading) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-8">
        <div className="mb-8">
          <motion.div
            className="h-10 w-64 bg-muted rounded mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="h-6 w-96 bg-muted rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
              <div className="flex gap-2 mb-4">
                <div className="h-6 w-24 bg-muted rounded-full" />
                <div className="h-6 w-24 bg-muted rounded-full" />
              </div>
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
            <h1 className="text-3xl font-bold mb-2">🚀 프로젝트 팀 모집</h1>
            <p className="text-muted-foreground">
              함께할 프로젝트를 찾고 팀에 합류하세요
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              프로젝트 올리기
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
                placeholder="프로젝트 검색..."
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

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="recruiting">모집중만</option>
              <option value="in_progress">진행중만</option>
              <option value="all">전체</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">전체 카테고리</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <motion.button
              onClick={() => setSortBy('latest')}
              className={`px-4 py-2 rounded-lg ${
                sortBy === 'latest'
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
              className={`px-4 py-2 rounded-lg ${
                sortBy === 'popular'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:bg-accent'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              인기순
            </motion.button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>아직 프로젝트가 없습니다.</p>
            <p className="mt-2">첫 번째 프로젝트를 올려보세요!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link
                  href={`/projects/${project.id}`}
                  className="block p-6 border border-border rounded-lg hover:shadow-lg transition"
                >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold line-clamp-2 flex-1">
                    {project.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    project.status === 'recruiting'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {project.status === 'recruiting' ? '모집중' : '진행중'}
                  </span>
                </div>

                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* 모집 포지션 */}
                {project.positions && project.positions.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {project.positions.map((position: any) => (
                      <span
                        key={position.id}
                        className="px-3 py-1 text-sm bg-secondary rounded-full"
                      >
                        {position.role} {position.filled_count}/{position.required_count}
                      </span>
                    ))}
                  </div>
                )}

                {/* 기술 스택 */}
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {project.tech_stack.slice(0, 5).map((tech: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs border border-border rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {project.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {project.comments_count}
                    </span>
                  </div>
                  <span>
                    {project.owner?.username || '익명'}
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
