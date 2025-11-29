'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ThumbsUp, MessageCircle, Share2, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Idea, IdeaComment } from '@kunnective/shared'

export default function IdeaDetailPage({ params }: { params: { id: string } }) {
  const [idea, setIdea] = useState<Idea | null>(null)
  const [comments, setComments] = useState<IdeaComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadIdea()
    loadComments()
    checkAuth()
  }, [params.id])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      checkIfLiked(user.id)
    }
  }

  async function checkIfLiked(userId: string) {
    const { data } = await supabase
      .from('idea_likes')
      .select('id')
      .eq('idea_id', params.id)
      .eq('user_id', userId)
      .single()

    setIsLiked(!!data)
  }

  async function loadIdea() {
    try {
      console.log('Loading idea with ID:', params.id)
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          author:users!ideas_author_id_fkey(id, username, name, avatar_url)
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Supabase error loading idea:', error)
        throw error
      }
      if (!data) {
        console.error('No data returned for idea:', params.id)
      }
      setIdea(data)
    } catch (error) {
      console.error('Error loading idea:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadComments() {
    try {
      const { data, error } = await supabase
        .from('idea_comments')
        .select(`
          *,
          author:users!idea_comments_author_id_fkey(id, username, name, avatar_url)
        `)
        .eq('idea_id', params.id)
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
          .from('idea_likes')
          .delete()
          .eq('idea_id', params.id)
          .eq('user_id', currentUserId)

        setIdea(prev => prev ? { ...prev, likes_count: prev.likes_count - 1 } : null)
        setIsLiked(false)
      } else {
        await supabase
          .from('idea_likes')
          .insert({ idea_id: params.id, user_id: currentUserId })

        setIdea(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null)
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
        .from('idea_comments')
        .insert({
          idea_id: params.id,
          author_id: currentUserId,
          content: newComment.trim(),
        })

      if (error) throw error

      setNewComment('')
      loadComments()
      setIdea(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null)
    } catch (error) {
      console.error('Error posting comment:', error)
    }
  }

  async function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      router.push('/ideas')
      router.refresh()
    } catch (error) {
      console.error('Error deleting idea:', error)
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

  if (!idea) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-muted-foreground">아이디어를 찾을 수 없습니다</p>
          <Link href="/ideas" className="text-primary hover:underline mt-4 inline-block">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/ideas" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        목록으로
      </Link>

      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold flex-1">{idea.title}</h1>
          {currentUserId === idea.author_id && (
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/ideas/${idea.id}/edit`)}
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

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span>by @{idea.author?.username || '익명'}</span>
          <span>•</span>
          <span>{new Date(idea.created_at).toLocaleDateString('ko-KR')}</span>
        </div>

        <div className="prose max-w-none mb-8">
          <p className="whitespace-pre-wrap">{idea.description}</p>
        </div>

        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isLiked ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'
              }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{idea.likes_count}</span>
          </button>
          <span className="flex items-center gap-2 px-4 py-2">
            <MessageCircle className="w-4 h-4" />
            <span>{idea.comments_count}</span>
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
    </div>
  )
}
