'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Idea } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IdeaCard } from '@/components/ideas/idea-card'

const ITEMS_PER_PAGE = 12

const categories = [
  { value: 'all', label: '전체' },
  { value: 'web', label: '웹 개발' },
  { value: 'mobile', label: '모바일 앱' },
  { value: 'ai', label: 'AI/ML' },
  { value: 'game', label: '게임' },
  { value: 'hardware', label: '하드웨어/IoT' },
  { value: 'design', label: '디자인' },
  { value: 'other', label: '기타' },
]

const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'views', label: '조회순' },
  { value: 'comments', label: '댓글순' },
]

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const supabase = createClient()

  useEffect(() => {
    loadIdeas(true)
  }, [selectedCategory, sortBy])

  const loadIdeas = async (reset: boolean = false) => {
    try {
      setLoading(true)
      const currentPage = reset ? 0 : page
      const from = currentPage * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      let query = supabase
        .from('ideas')
        .select(
          `
          *,
          user:users!ideas_user_id_fkey(id, name, avatar_url),
          idea_likes(count),
          idea_comments(count)
        `,
          { count: 'exact' }
        )
        .range(from, to)

      // Filter by category
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      // Search query
      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`
        )
      }

      // Sort
      switch (sortBy) {
        case 'popular':
          // This is a simplified version - ideally you'd have a likes count column
          query = query.order('created_at', { ascending: false })
          break
        case 'views':
          query = query.order('view_count', { ascending: false })
          break
        case 'comments':
          query = query.order('created_at', { ascending: false })
          break
        case 'latest':
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error, count } = await query

      if (error) throw error

      // Transform data to include counts
      const ideasWithCounts: Idea[] = (data || []).map((idea: any) => ({
        ...idea,
        like_count: Array.isArray(idea.idea_likes)
          ? idea.idea_likes.length
          : idea.idea_likes?.[0]?.count || 0,
        comment_count: Array.isArray(idea.idea_comments)
          ? idea.idea_comments.length
          : idea.idea_comments?.[0]?.count || 0,
      }))

      if (reset) {
        setIdeas(ideasWithCounts)
        setPage(1)
      } else {
        setIdeas((prev) => [...prev, ...ideasWithCounts])
        setPage((prev) => prev + 1)
      }

      setHasMore(count ? from + ideasWithCounts.length < count : false)
    } catch (error) {
      console.error('Error loading ideas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadIdeas(true)
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">아이디어</h1>
          <p className="text-muted-foreground mt-1">
            다양한 프로젝트 아이디어를 둘러보고 팀원을 모집하세요
          </p>
        </div>
        <Button asChild>
          <Link href="/ideas/new">
            <Plus className="mr-2 h-4 w-4" />
            아이디어 작성
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="아이디어 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">검색</Button>
        </form>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ideas Grid */}
      {loading && ideas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          로딩 중...
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>아직 작성된 아이디어가 없습니다.</p>
          <p className="mt-2">첫 번째 아이디어를 작성해보세요!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => loadIdeas(false)}
                disabled={loading}
              >
                {loading ? '로딩 중...' : '더 보기'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
