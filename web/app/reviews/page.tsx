'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'

interface Review {
  id: string
  reviewer_id: string
  reviewee_id: string
  project_id?: string
  rating: number
  comment?: string
  created_at: string
  reviewer?: UserProfile
  reviewee?: UserProfile
}

export default function ReviewsPage() {
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([])
  const [givenReviews, setGivenReviews] = useState<Review[]>([])
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadReviews()
  }, [])

  async function loadReviews() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Load received reviews
      const { data: received } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:users!reviews_reviewer_id_fkey(*)
        `)
        .eq('reviewee_id', user.id)
        .order('created_at', { ascending: false })

      setReceivedReviews(received || [])

      // Load given reviews
      const { data: given } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewee:users!reviews_reviewee_id_fkey(*)
        `)
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false })

      setGivenReviews(given || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
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

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">⭐ 리뷰</h1>
        <p className="text-muted-foreground">
          받은 리뷰와 작성한 리뷰를 확인하세요
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'received'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          받은 리뷰 ({receivedReviews.length})
        </button>
        <button
          onClick={() => setActiveTab('given')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'given'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          작성한 리뷰 ({givenReviews.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'received' ? (
            receivedReviews.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p>아직 받은 리뷰가 없습니다</p>
              </div>
            ) : (
              receivedReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-6 border border-border rounded-lg hover:shadow-md transition"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary">
                        {review.reviewer?.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">
                          {review.reviewer?.name || review.reviewer?.username}
                        </h3>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm whitespace-pre-wrap pl-14">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            )
          ) : (
            givenReviews.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p>아직 작성한 리뷰가 없습니다</p>
              </div>
            ) : (
              givenReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-6 border border-border rounded-lg hover:shadow-md transition"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary">
                        {review.reviewee?.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">
                          {review.reviewee?.name || review.reviewee?.username}
                        </h3>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm whitespace-pre-wrap pl-14">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            )
          )}
        </div>
      )}
    </div>
  )
}
