'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ThumbsUp, MessageCircle, Share2, Edit, Trash2, Users, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Project, Position, ProjectComment, Application } from '@/types'

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [comments, setComments] = useState<ProjectComment[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [applicationMessage, setApplicationMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProject()
    loadComments()
    checkAuth()
  }, [params.id])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      checkIfLiked(user.id)
      loadMyApplications(user.id)
    }
  }

  async function checkIfLiked(userId: string) {
    const { data } = await supabase
      .from('project_likes')
      .select('id')
      .eq('project_id', params.id)
      .eq('user_id', userId)
      .single()

    setIsLiked(!!data)
  }

  async function loadMyApplications(userId: string) {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('project_id', params.id)
      .eq('user_id', userId)

    setApplications(data || [])
  }

  async function loadProject() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          owner:users!projects_owner_id_fkey(id, username, name, avatar_url),
          positions(*)
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      setProject(data)
      setPositions(data.positions || [])
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadComments() {
    try {
      const { data, error } = await supabase
        .from('project_comments')
        .select(`
          *,
          author:users!project_comments_author_id_fkey(id, username, name, avatar_url)
        `)
        .eq('project_id', params.id)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  async function handleLike() {
    if (!currentUserId) {
      alert('로그인이 필요합니다')
      router.push('/auth/login')
      return
    }

    try {
      if (isLiked) {
        await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', params.id)
          .eq('user_id', currentUserId)

        setProject(prev => prev ? { ...prev, likes_count: prev.likes_count - 1 } : null)
        setIsLiked(false)
      } else {
        await supabase
          .from('project_likes')
          .insert({ project_id: params.id, user_id: currentUserId })

        setProject(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null)
        setIsLiked(true)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  async function handleComment() {
    if (!currentUserId) {
      alert('로그인이 필요합니다')
      router.push('/auth/login')
      return
    }

    if (!newComment.trim()) return

    try {
      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: params.id,
          author_id: currentUserId,
          content: newComment.trim(),
        })

      if (error) throw error

      setNewComment('')
      loadComments()
      setProject(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null)
    } catch (error) {
      console.error('Error posting comment:', error)
    }
  }

  async function handleApply(position: Position) {
    if (!currentUserId) {
      alert('로그인이 필요합니다')
      router.push('/auth/login')
      return
    }

    setSelectedPosition(position)
    setShowApplicationModal(true)
  }

  async function submitApplication() {
    if (!currentUserId || !selectedPosition) return

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          project_id: params.id,
          position_id: selectedPosition.id,
          user_id: currentUserId,
          message: applicationMessage.trim() || null,
          status: 'pending',
        })

      if (error) throw error

      alert('지원이 완료되었습니다!')
      setShowApplicationModal(false)
      setApplicationMessage('')
      loadMyApplications(currentUserId)
    } catch (error: any) {
      console.error('Error submitting application:', error)
      if (error.code === '23505') {
        alert('이미 지원한 포지션입니다')
      } else {
        alert('지원 중 오류가 발생했습니다')
      }
    }
  }

  async function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      router.push('/projects')
      router.refresh()
    } catch (error) {
      console.error('Error deleting project:', error)
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

  if (!project) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다</p>
          <Link href="/projects" className="text-primary hover:underline mt-4 inline-block">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const hasApplied = (positionId: string) => {
    return applications.some(app => app.position_id === positionId)
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        목록으로
      </Link>

      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{project.title}</h1>
            <span className={`inline-block px-3 py-1 text-sm rounded ${
              project.status === 'recruiting'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {project.status === 'recruiting' ? '모집중' : '진행중'}
            </span>
          </div>
          {currentUserId === project.owner_id && (
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/projects/${project.id}/edit`)}
                className="p-2 hover:bg-accent rounded-lg"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          <span>by @{project.owner?.username || '익명'}</span>
          <span>•</span>
          <span>{new Date(project.created_at).toLocaleDateString('ko-KR')}</span>
        </div>

        {/* 프로젝트 설명 */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">📋 프로젝트 설명</h2>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-lg">{project.description}</p>
          </div>
        </div>

        {/* 모집 포지션 */}
        {positions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">👥 모집 포지션</h2>
            <div className="space-y-4">
              {positions.map((position) => (
                <div key={position.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{position.role}</h3>
                      <span className="px-3 py-1 bg-secondary rounded-full text-sm">
                        {position.filled_count}/{position.required_count}명
                      </span>
                      {position.filled_count >= position.required_count && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          모집완료
                        </span>
                      )}
                    </div>
                    {currentUserId && currentUserId !== project.owner_id && (
                      <button
                        onClick={() => handleApply(position)}
                        disabled={hasApplied(position.id) || position.filled_count >= position.required_count}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {hasApplied(position.id) ? '지원완료' : '참여하기'}
                      </button>
                    )}
                  </div>
                  {position.description && (
                    <p className="text-muted-foreground">{position.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 기술 스택 */}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">🛠 기술 스택</h2>
            <div className="flex flex-wrap gap-2">
              {project.tech_stack.map((tech, idx) => (
                <span key={idx} className="px-3 py-1 bg-secondary rounded-full">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 예상 기간 */}
        {project.duration && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">⏱ 예상 기간</h2>
            <p className="text-lg">{project.duration}</p>
          </div>
        )}

        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              isLiked ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{project.likes_count}</span>
          </button>
          <span className="flex items-center gap-2 px-4 py-2">
            <MessageCircle className="w-4 h-4" />
            <span>{project.comments_count}</span>
          </span>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent ml-auto">
            <Share2 className="w-4 h-4" />
            공유
          </button>
        </div>

        {/* 댓글 섹션 */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">댓글 {comments.length}개</h2>

          {currentUserId && (
            <div className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성하세요..."
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  댓글 작성
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">@{comment.author?.username}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>

          {comments.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
            </p>
          )}
        </div>
      </div>

      {/* 지원 모달 */}
      {showApplicationModal && selectedPosition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              {selectedPosition.role} 포지션 지원
            </h3>
            <textarea
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              placeholder="간단한 지원 메시지를 작성해주세요 (선택사항)"
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowApplicationModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent"
              >
                취소
              </button>
              <button
                onClick={submitApplication}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                지원하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
