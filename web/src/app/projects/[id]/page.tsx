'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Calendar,
  Github,
  ExternalLink,
  ArrowLeft,
  UserPlus,
  Send,
  Settings,
  MessageCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Project, ProjectMember, ProjectApplication } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/lib/hooks/useToast'

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [applicationRole, setApplicationRole] = useState('')
  const [applicationMessage, setApplicationMessage] = useState('')
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadProject()
    loadMembers()
    checkUserStatus()
  }, [params.id])

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(
          `
          *,
          owner:users!projects_owner_id_fkey(id, name, avatar_url, major, year)
        `
        )
        .eq('id', params.id)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select(
          `
          *,
          user:users!project_members_user_id_fkey(id, name, avatar_url, major, skills)
        `
        )
        .eq('project_id', params.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  const checkUserStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setCurrentUserId(user.id)

    // Check if already applied
    const { data: applicationData } = await supabase
      .from('project_applications')
      .select('id, status')
      .eq('project_id', params.id)
      .eq('user_id', user.id)
      .single()

    setHasApplied(!!applicationData)

    // Check if already a member
    const { data: memberData } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', params.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    setIsMember(!!memberData)
  }

  const handleJoinChat = async () => {
    if (!currentUserId) {
      router.push('/login')
      return
    }

    try {
      // Check if project chat room exists
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('type', 'project')
        .eq('project_id', params.id)
        .single()

      if (existingRoom) {
        router.push(`/chat/${existingRoom.id}`)
        return
      }

      // Create project chat room
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name: project?.title,
          type: 'project',
          project_id: params.id,
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Add all project members as participants
      const memberIds = [
        project?.owner_id,
        ...(members?.map((m) => m.user_id) || []),
      ]

      const participants = memberIds.map((userId) => ({
        room_id: newRoom.id,
        user_id: userId,
        role: userId === project?.owner_id ? 'admin' : 'member',
      }))

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants)

      if (participantsError) throw participantsError

      router.push(`/chat/${newRoom.id}`)
    } catch (error: any) {
      toast({
        variant: 'error',
        title: '채팅방 생성 실패',
        description: error.message || '채팅방 생성 중 오류가 발생했습니다',
      })
    }
  }

  const handleApply = async () => {
    if (!currentUserId) {
      router.push('/login')
      return
    }

    if (!applicationRole.trim()) {
      toast({
        variant: 'warning',
        title: '입력 필요',
        description: '지원 역할을 입력해주세요',
      })
      return
    }

    setApplying(true)
    try {
      const { error } = await supabase.from('project_applications').insert({
        project_id: params.id,
        user_id: currentUserId,
        role: applicationRole,
        message: applicationMessage,
        status: 'pending',
      })

      if (error) throw error

      toast({
        variant: 'success',
        title: '지원 완료',
        description: '지원서가 성공적으로 제출되었습니다!',
      })
      setShowApplicationForm(false)
      setHasApplied(true)
      setApplicationRole('')
      setApplicationMessage('')
    } catch (error: any) {
      toast({
        variant: 'error',
        title: '지원 실패',
        description: error.message || '지원 중 오류가 발생했습니다',
      })
    } finally {
      setApplying(false)
    }
  }

  const statusLabels = {
    recruiting: '팀원 모집중',
    in_progress: '진행중',
    completed: '완료',
    on_hold: '보류',
  }

  const statusColors = {
    recruiting: 'default',
    in_progress: 'secondary',
    completed: 'outline',
    on_hold: 'outline',
  } as const

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="text-center">
          <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다</p>
          <Button asChild className="mt-4">
            <Link href="/projects">목록으로</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isOwner = currentUserId === project.owner_id
  const canApply =
    !isMember && !hasApplied && project.status === 'recruiting' && !isOwner

  return (
    <div className="container max-w-6xl py-8">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/projects">
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={statusColors[project.status]}>
                      {statusLabels[project.status]}
                    </Badge>
                    <Badge variant="secondary">{project.category}</Badge>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                </div>
                <div className="flex gap-2">
                  {(isOwner || isMember) && (
                    <Button variant="outline" size="sm" onClick={handleJoinChat}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      팀 채팅
                    </Button>
                  )}
                  {isOwner && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/projects/${project.id}/manage`}>
                        <Settings className="mr-2 h-4 w-4" />
                        관리
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Project Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {project.start_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(project.start_date)}
                    {project.end_date && ` ~ ${formatDate(project.end_date)}`}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {members.length}/{project.max_members} 멤버
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-medium mb-2">프로젝트 설명</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {project.description}
                </p>
              </div>

              {/* Tags */}
              {project.tags.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">기술 스택</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="flex gap-3">
                {project.github_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                )}
                {project.demo_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Demo
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          {canApply && (
            <Card>
              <CardHeader>
                <CardTitle>프로젝트 지원하기</CardTitle>
              </CardHeader>
              {!showApplicationForm ? (
                <CardContent>
                  <Button onClick={() => setShowApplicationForm(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    지원서 작성
                  </Button>
                </CardContent>
              ) : (
                <>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">지원 역할 *</Label>
                      <Input
                        id="role"
                        placeholder="예: 프론트엔드 개발자"
                        value={applicationRole}
                        onChange={(e) => setApplicationRole(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">지원 메시지</Label>
                      <Textarea
                        id="message"
                        placeholder="자기소개 및 지원 동기를 작성해주세요..."
                        value={applicationMessage}
                        onChange={(e) => setApplicationMessage(e.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowApplicationForm(false)}
                      className="flex-1"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleApply}
                      disabled={applying}
                      className="flex-1"
                    >
                      {applying ? '제출 중...' : '지원서 제출'}
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>
          )}

          {hasApplied && !isMember && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  이미 지원서를 제출했습니다. 결과를 기다려주세요.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Card */}
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 리더</CardTitle>
            </CardHeader>
            <CardContent>
              {project.owner && (
                <div className="flex items-center gap-3">
                  {project.owner.avatar_url && (
                    <img
                      src={project.owner.avatar_url}
                      alt={project.owner.name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-medium">{project.owner.name}</div>
                    {project.owner.major && (
                      <div className="text-sm text-muted-foreground">
                        {project.owner.major}
                        {project.owner.year && ` · ${project.owner.year}학년`}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members Card */}
          <Card>
            <CardHeader>
              <CardTitle>팀원 ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  아직 팀원이 없습니다
                </p>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-start gap-3">
                    {member.user?.avatar_url && (
                      <img
                        src={member.user.avatar_url}
                        alt={member.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {member.user?.name || '알 수 없음'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.role}
                      </div>
                      {member.user?.skills && member.user.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.user.skills.slice(0, 2).map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
