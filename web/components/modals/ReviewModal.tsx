'use client'

import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  revieweeId: string
  revieweeName: string
  projectId?: string
  onSuccess?: () => void
}

export default function ReviewModal({
  isOpen,
  onClose,
  revieweeId,
  revieweeName,
  projectId,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  if (!isOpen) return null

  async function handleSubmit() {
    if (rating === 0) {
      alert('평점을 선택해주세요')
      return
    }

    try {
      setSubmitting(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('로그인이 필요합니다')
        return
      }

      const { error } = await supabase.from('reviews').insert({
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        project_id: projectId || null,
        rating,
        comment: comment.trim() || null,
      })

      if (error) {
        if (error.code === '23505') {
          alert('이미 리뷰를 작성했습니다')
          return
        }
        throw error
      }

      // Update user's average rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', revieweeId)

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

        await supabase
          .from('users')
          .update({ rating: avgRating })
          .eq('id', revieweeId)
      }

      alert('리뷰가 작성되었습니다!')
      setRating(0)
      setComment('')
      onClose()
      onSuccess?.()
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('리뷰 작성에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">리뷰 작성</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            <span className="font-medium text-foreground">{revieweeName}</span>님과의 프로젝트는 어땠나요?
          </p>

          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm font-medium">
                {rating === 1 && '아쉬워요'}
                {rating === 2 && '별로예요'}
                {rating === 3 && '보통이에요'}
                {rating === 4 && '좋아요'}
                {rating === 5 && '최고예요!'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              상세 리뷰 (선택사항)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="함께한 프로젝트 경험을 공유해주세요..."
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? '작성 중...' : '리뷰 작성'}
          </button>
        </div>
      </div>
    </div>
  )
}
