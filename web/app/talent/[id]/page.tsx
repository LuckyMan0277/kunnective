'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Briefcase, Github, Linkedin, Globe, Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, Project, Position } from '@/types'
import ReviewModal from '@/components/modals/ReviewModal'

interface Review {
  id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  created_at: string
  reviewer?: UserProfile
}

export default function TalentDetailPage({ params }: { params: { id: string } }) {
  const [talent, setTalent] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedPosition, setSelectedPosition] = useState<string>('')
  const [proposalMessage, setProposalMessage] = useState('')
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadTalentProfile()
    checkCurrentUser()
  }, [params.id])

  useEffect(() => {
    if (selectedProject) {
      loadPositions()
    }
  }, [selectedProject])

  async function checkCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    if (user?.id) {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'recruiting')

      setMyProjects(data || [])
    }
  }

  async function loadTalentProfile() {
    try {
      setLoading(true)

      // Load talent profile
      const { data: talentData, error: talentError } = await supabase
        .from('users')
        .select('*')
        .eq('id', params.id)
        .single()

      if (talentError) throw talentError
      setTalent(talentData)

      // Load projects where this user participated
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', params.id)
        .order('created_at', { ascending: false })

      setProjects(projectsData || [])

      // Load reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:users!reviews_reviewer_id_fkey(*)
        `)
        .eq('reviewee_id', params.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setReviews(reviewsData || [])
    } catch (error) {
      console.error('Error loading talent profile:', error)
    } finally {
      setLoading(false)
    }
  }

  function renderStars(rating: number) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  async function loadPositions() {
    const { data } = await supabase
      .from('positions')
      .select('*')
      .eq('project_id', selectedProject)
      .eq('is_filled', false)

    setPositions(data || [])
  }

  async function handleSendProposal() {
    if (!currentUserId) {
      alert('로그인이 필요합니다')
      router.push('/auth/login')
      return
    }

    if (!selectedProject || !selectedPosition) {
      alert('프로젝트와 포지션을 선택해주세요')
      return
    }

    try {
      const { error } = await supabase
        .from('headhunt_proposals')
        .insert({
          project_id: selectedProject,
          position_id: selectedPosition,
          from_user_id: currentUserId,
          to_user_id: params.id,
          message: proposalMessage.trim() || null,
          status: 'pending',
        })

      if (error) {
        if (error.code === '23505') {
          alert('이미 제안을 보낸 포지션입니다')
          return
        }
        throw error
      }

      alert('제안이 전송되었습니다!')
      setShowProposalModal(false)
      setSelectedProject('')
      setSelectedPosition('')
      setProposalMessage('')
    } catch (error) {
      console.error('Error sending proposal:', error)
      alert('제안 전송에 실패했습니다')
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

  if (!talent) {
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
      {/* 뒤로 가기 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        뒤로 가기
      </button>

      <div className="bg-card border border-border rounded-lg p-8">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
              {talent.avatar_url ? (
                <img src={talent.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {talent.username[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {talent.name || talent.username}
              </h1>
              <p className="text-muted-foreground">@{talent.username}</p>
              {talent.major && (
                <span className="inline-block mt-2 px-3 py-1 bg-secondary rounded-full text-sm">
                  {talent.major} {talent.year && `· ${talent.year}`}
                </span>
              )}
            </div>
          </div>
          {currentUserId && currentUserId !== params.id && (
            <div className="flex gap-2">
              {myProjects.length > 0 && (
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  제안 보내기
                </button>
              )}
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-6 py-2 border border-border rounded-lg hover:bg-accent"
              >
                <Star className="w-4 h-4 inline mr-2" />
                리뷰 작성
              </button>
            </div>
          )}
        </div>

        {/* 자기소개 */}
        {talent.bio && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">📝 소개</h2>
            <p className="whitespace-pre-wrap">{talent.bio}</p>
          </div>
        )}

        {/* 스킬 */}
        {talent.skills && talent.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">💼 스킬</h2>
            <div className="flex flex-wrap gap-2">
              {talent.skills.map((skill, idx) => (
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
            {talent.portfolio_url && (
              <a
                href={talent.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Globe className="w-4 h-4" />
                Portfolio: {talent.portfolio_url}
              </a>
            )}
            {talent.github_url && (
              <a
                href={talent.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Github className="w-4 h-4" />
                GitHub: {talent.github_url}
              </a>
            )}
            {talent.linkedin_url && (
              <a
                href={talent.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn: {talent.linkedin_url}
              </a>
            )}
          </div>
        </div>

        {/* 프로젝트 참여 가능 여부 */}
        <div className="mb-8 p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">프로젝트 참여 가능 여부</span>
            <span className={`px-3 py-1 rounded-full ${
              talent.available_for_projects
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {talent.available_for_projects ? '✅ 가능' : '❌ 불가능'}
            </span>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-secondary/50 rounded-lg text-center">
            <p className="text-2xl font-bold">{talent.project_count}</p>
            <p className="text-sm text-muted-foreground">참여한 프로젝트</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg text-center">
            <p className="text-2xl font-bold">{talent.rating.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">평균 평점</p>
          </div>
        </div>

        {/* 프로젝트 히스토리 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📚 프로젝트 히스토리</h2>
          {projects.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              아직 프로젝트가 없습니다
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
                    <span className={`px-2 py-1 text-xs rounded ${
                      project.status === 'recruiting'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status === 'recruiting' ? '모집중' :
                       project.status === 'in_progress' ? '진행중' : '완료'}
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

        {/* 받은 리뷰 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">⭐ 받은 리뷰</h2>
            <span className="text-sm text-muted-foreground">
              총 {reviews.length}개
            </span>
          </div>
          {reviews.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              아직 받은 리뷰가 없습니다
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border border-border rounded-lg"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {review.reviewer?.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">
                          {review.reviewer?.name || review.reviewer?.username}
                        </h4>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm pl-11 whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        revieweeId={params.id}
        revieweeName={talent?.name || talent?.username || ''}
        onSuccess={loadTalentProfile}
      />

      {/* 제안 모달 */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">헤드헌팅 제안 보내기</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  프로젝트 선택
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value)
                    setSelectedPosition('')
                  }}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">프로젝트를 선택하세요</option>
                  {myProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProject && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    포지션 선택
                  </label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">포지션을 선택하세요</option>
                    {positions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.role} ({position.filled_count}/{position.required_count})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  메시지 (선택사항)
                </label>
                <textarea
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  placeholder="제안 메시지를 입력하세요..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowProposalModal(false)
                  setSelectedProject('')
                  setSelectedPosition('')
                  setProposalMessage('')
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent"
              >
                취소
              </button>
              <button
                onClick={handleSendProposal}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                제안 보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
