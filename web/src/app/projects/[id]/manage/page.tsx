'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, X, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Project, ProjectApplication } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ProjectManagePage({
  params,
}: {
  params: { id: string }
}) {
  const [project, setProject] = useState<Project | null>(null)
  const [applications, setApplications] = useState<ProjectApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProject()
    loadApplications()
  }, [params.id, filter])

  const loadProject = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      // Check if user is owner
      if (data.owner_id !== user.id) {
        router.push(`/projects/${params.id}`)
        return
      }

      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }

  const loadApplications = async () => {
    try {
      let query = supabase
        .from('project_applications')
        .select(
          `
          *,
          user:users!project_applications_user_id_fkey(
            id, name, avatar_url, major, year, skills, bio
          )
        `
        )
        .eq('project_id', params.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
    }
  }

  const handleApplication = async (
    applicationId: string,
    userId: string,
    role: string,
    status: 'accepted' | 'rejected'
  ) => {
    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('project_applications')
        .update({ status })
        .eq('id', applicationId)

      if (updateError) throw updateError

      // If accepted, add as project member
      if (status === 'accepted') {
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            project_id: params.id,
            user_id: userId,
            role: role,
            status: 'active',
          })

        if (memberError) throw memberError
      }

      loadApplications()
      alert(status === 'accepted' ? '지원자를 수락했습니다!' : '지원서를 거절했습니다.')
    } catch (error: any) {
      alert(error.message || '처리 중 오류가 발생했습니다')
    }
  }

  const statusLabels = {
    pending: '대기중',
    accepted: '수락됨',
    rejected: '거절됨',
  }

  const statusColors = {
    pending: 'default',
    accepted: 'secondary',
    rejected: 'outline',
  } as const

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="container max-w-4xl py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link href={`/projects/${params.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          프로젝트로 돌아가기
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">지원서 관리</h1>
        <p className="text-muted-foreground mt-1">{project.title}</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-medium">상태:</span>
        <Select
          value={filter}
          onValueChange={(value: any) => setFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="pending">대기중</SelectItem>
            <SelectItem value="accepted">수락됨</SelectItem>
            <SelectItem value="rejected">거절됨</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {applications.length}개의 지원서
        </span>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {filter === 'all'
                ? '아직 지원서가 없습니다'
                : `${statusLabels[filter]} 지원서가 없습니다`}
            </CardContent>
          </Card>
        ) : (
          applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {application.user?.avatar_url && (
                      <img
                        src={application.user.avatar_url}
                        alt={application.user.name}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {application.user?.name || '알 수 없음'}
                      </CardTitle>
                      <CardDescription>
                        {application.user?.major && (
                          <>
                            {application.user.major}
                            {application.user.year &&
                              ` · ${application.user.year}학년`}
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={statusColors[application.status]}>
                    {statusLabels[application.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium">지원 역할: </span>
                  <Badge variant="secondary">{application.role}</Badge>
                </div>

                {application.user?.skills &&
                  application.user.skills.length > 0 && (
                    <div>
                      <span className="text-sm font-medium block mb-2">
                        보유 기술:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {application.user.skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {application.user?.bio && (
                  <div>
                    <span className="text-sm font-medium block mb-1">
                      자기소개:
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {application.user.bio}
                    </p>
                  </div>
                )}

                {application.message && (
                  <div>
                    <span className="text-sm font-medium block mb-1">
                      지원 메시지:
                    </span>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.message}
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  지원 일시: {formatDate(application.created_at)}
                </div>

                {application.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        handleApplication(
                          application.id,
                          application.user_id,
                          application.role,
                          'accepted'
                        )
                      }
                    >
                      <Check className="mr-2 h-4 w-4" />
                      수락
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleApplication(
                          application.id,
                          application.user_id,
                          application.role,
                          'rejected'
                        )
                      }
                    >
                      <X className="mr-2 h-4 w-4" />
                      거절
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
