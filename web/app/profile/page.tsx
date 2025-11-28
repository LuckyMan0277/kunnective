'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Github, Linkedin, Globe, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, Project } from '@kunnective/shared'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // 내가 올린 프로젝트 로드
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      setProjects(projectsData || [])
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-muted-foreground">프로필을 찾을 수 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card border border-border rounded-lg p-8">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {profile.username[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {profile.name || profile.username}
              </h1>
              <p className="text-muted-foreground">@{profile.username}</p>
              {profile.major && (
                <span className="inline-block mt-2 px-3 py-1 bg-secondary rounded-full text-sm">
                  {profile.major} {profile.year && `· ${profile.year}`}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/profile/edit')}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent"
          >
            <Edit className="w-4 h-4" />
            프로필 수정
          </button>
        </div>

        {/* 자기소개 */}
        {profile.bio && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">📝 소개</h2>
            <p className="whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {/* 스킬 */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">💼 스킬</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-secondary rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 링크 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">🔗 링크</h2>
          <div className="space-y-2">
            {profile.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Globe className="w-4 h-4" />
                Portfolio: {profile.portfolio_url}
              </a>
            )}
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Github className="w-4 h-4" />
                GitHub: {profile.github_url}
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn: {profile.linkedin_url}
              </a>
            )}
          </div>
        </div>

        {/* 프로젝트 참여 가능 여부 */}
        <div className="mb-8 p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">프로젝트 참여 가능 여부</span>
            <span className={`px-3 py-1 rounded-full ${profile.available_for_projects
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
              }`}>
              {profile.available_for_projects ? '✅ 가능' : '❌ 불가능'}
            </span>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-secondary/50 rounded-lg text-center">
            <p className="text-2xl font-bold">{profile.project_count}</p>
            <p className="text-sm text-muted-foreground">참여한 프로젝트</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg text-center">
            <p className="text-2xl font-bold">{profile.rating.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">평균 평점</p>
          </div>
        </div>

        {/* 내가 올린 프로젝트 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">내가 올린 프로젝트</h2>
          {projects.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              아직 올린 프로젝트가 없습니다
            </p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="p-4 border border-border rounded-lg hover:shadow-lg cursor-pointer transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{project.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${project.status === 'recruiting'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                      }`}>
                      {project.status === 'recruiting' ? '모집중' : '진행중'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
