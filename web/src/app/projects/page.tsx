'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProjectCard } from '@/components/projects/project-card'

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

const statusFilters = [
  { value: 'all', label: '전체' },
  { value: 'recruiting', label: '모집중' },
  { value: 'in_progress', label: '진행중' },
  { value: 'completed', label: '완료' },
  { value: 'on_hold', label: '보류' },
]

const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'members', label: '팀원순' },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const supabase = createClient()

  useEffect(() => {
    loadProjects(true)
  }, [selectedCategory, selectedStatus, sortBy])

  const loadProjects = async (reset: boolean = false) => {
    try {
      setLoading(true)
      const currentPage = reset ? 0 : page
      const from = currentPage * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      let query = supabase
        .from('projects')
        .select(
          `
          *,
          owner:users!projects_owner_id_fkey(id, name, avatar_url),
          project_members(count)
        `,
          { count: 'exact' }
        )
        .range(from, to)

      // Filter by category
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      // Filter by status
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      // Search query
      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        )
      }

      // Sort
      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'members':
          query = query.order('created_at', { ascending: false })
          break
        case 'latest':
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error, count } = await query

      if (error) throw error

      // Transform data to include member count
      const projectsWithCounts: Project[] = (data || []).map((project: any) => ({
        ...project,
        member_count: Array.isArray(project.project_members)
          ? project.project_members.length
          : project.project_members?.[0]?.count || 0,
      }))

      if (reset) {
        setProjects(projectsWithCounts)
        setPage(1)
      } else {
        setProjects((prev) => [...prev, ...projectsWithCounts])
        setPage((prev) => prev + 1)
      }

      setHasMore(count ? from + projectsWithCounts.length < count : false)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadProjects(true)
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">프로젝트</h1>
          <p className="text-muted-foreground mt-1">
            진행 중인 프로젝트를 둘러보고 참여하세요
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            프로젝트 생성
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="프로젝트 검색..."
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

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
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

      {/* Projects Grid */}
      {loading && projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          로딩 중...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>아직 생성된 프로젝트가 없습니다.</p>
          <p className="mt-2">첫 번째 프로젝트를 시작해보세요!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => loadProjects(false)}
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
