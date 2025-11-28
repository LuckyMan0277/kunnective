'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Star, Briefcase, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@kunnective/shared'

export default function TalentPage() {
  const [talents, setTalents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [availableOnly, setAvailableOnly] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const roles = [
    { value: 'all', label: '전체' },
    { value: '개발자', label: '개발자' },
    { value: '디자이너', label: '디자이너' },
    { value: '기획자', label: '기획자' },
    { value: 'PM', label: 'PM' },
    { value: '마케터', label: '마케터' },
  ]

  useEffect(() => {
    loadTalents()
  }, [roleFilter, availableOnly])

  async function loadTalents() {
    try {
      setLoading(true)

      let query = supabase
        .from('users')
        .select('*')
        .order('project_count', { ascending: false })
        .order('rating', { ascending: false })
        .limit(50)

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
      }

      if (availableOnly) {
        query = query.eq('available_for_projects', true)
      }

      if (searchQuery) {
        query = query.or(
          `username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`
        )
      }

      const { data, error } = await query

      if (error) throw error
      setTalents(data || [])
    } catch (error) {
      console.error('Error loading talents:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadTalents()
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">👥 인재 찾기</h1>
        <p className="text-muted-foreground">
          프로젝트에 함께할 인재를 찾아보세요
        </p>
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
              placeholder="이름 또는 사용자명으로 검색..."
              className="w-full pl-9 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            검색
          </button>
        </form>

        <div className="flex flex-wrap gap-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-accent">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <span>참여 가능한 사람만 보기</span>
          </label>
        </div>
      </div>

      {/* 인재 목록 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : talents.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {talents.map((talent) => (
            <div
              key={talent.id}
              onClick={() => router.push(`/talent/${talent.id}`)}
              className="p-6 border border-border rounded-lg hover:shadow-lg cursor-pointer transition"
            >
              {/* 프로필 헤더 */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {talent.avatar_url ? (
                    <img src={talent.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-primary">
                      {talent.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {talent.name || talent.username}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    @{talent.username}
                  </p>
                </div>
              </div>

              {/* 전공/학년 */}
              {talent.major && (
                <span className="inline-block px-3 py-1 bg-secondary rounded-full text-sm mb-3">
                  {talent.major} {talent.year && `· ${talent.year}`}
                </span>
              )}

              {/* 자기소개 */}
              {talent.bio && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {talent.bio}
                </p>
              )}

              {/* 스킬 */}
              {talent.skills && talent.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {talent.skills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-secondary/50 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                  {talent.skills.length > 3 && (
                    <span className="px-2 py-1 text-xs text-muted-foreground">
                      +{talent.skills.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* 통계 */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {talent.project_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {talent.rating.toFixed(1)}
                  </span>
                </div>
                {talent.available_for_projects && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    참여 가능
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
