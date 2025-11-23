'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  Bookmark,
  Eye,
  Clock,
  Pencil,
  Trash2,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createClient } from '@/lib/supabase/client'
import { Idea, IdeaComment } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/lib/hooks/useToast'

export default function IdeaDetailPage({ params }: { params: { id: string } }) {
  const [idea, setIdea] = useState<Idea | null>(null)
  const [comments, setComments] = useState<IdeaComment[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentContent, setCommentContent] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadIdea()
    loadComments()
    checkUserStatus()
  }, [params.id])

  const loadIdea = async () => {
    try {
      // Increment view count
      await supabase.rpc('increment_idea_view_count', {
        idea_uuid: params.id,
      })

      const { data, error } = await supabase
        .from('ideas')
        .select(
          `
          *,
          user:users!ideas_user_id_fkey(id, name, avatar_url, major, year)
        `
        )
        .eq('id', params.id)
        .single()

      if (error) throw error

      // Get like count
      const { count: likes } = await supabase
        .from('idea_likes')
        .select('*', { count: 'exact', head: true })
        .eq('idea_id', params.id)

      setIdea(data)
      setLikeCount(likes || 0)
    } catch (error) {
      console.error('Error loading idea:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('idea_comments')
        .select(
          `
          *,
          user:users!idea_comments_user_id_fkey(id, name, avatar_url)
        `
        )
        .eq('idea_id', params.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const checkUserStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setCurrentUserId(user.id)

    // Check if liked
    const { data: likeData } = await supabase
      .from('idea_likes')
      .select('id')
      .eq('idea_id', params.id)
      .eq('user_id', user.id)
      .single()

    setIsLiked(!!likeData)

    // Check if bookmarked
    const { data: bookmarkData } = await supabase
      .from('idea_bookmarks')
      .select('id')
      .eq('idea_id', params.id)
      .eq('user_id', user.id)
      .single()

    setIsBookmarked(!!bookmarkData)
  }

  const handleLike = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    if (isLiked) {
      // Unlike
      await supabase
        .from('idea_likes')
        .delete()
        .eq('idea_id', params.id)
        .eq('user_id', user.id)
      setIsLiked(false)
      setLikeCount((prev) => prev - 1)
    } else {
      // Like
      await supabase.from('idea_likes').insert({
        idea_id: params.id,
        user_id: user.id,
      })
      setIsLiked(true)
      setLikeCount((prev) => prev + 1)
    }
  }

  const handleBookmark = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    if (isBookmarked) {
      // Remove bookmark
      await supabase
        .from('idea_bookmarks')
        .delete()
        .eq('idea_id', params.id)
        .eq('user_id', user.id)
      setIsBookmarked(false)
    } else {
      // Add bookmark
      await supabase.from('idea_bookmarks').insert({
        idea_id: params.id,
        user_id: user.id,
      })
      setIsBookmarked(true)
    }
  }

  const handleCommentSubmit = async () => {
    if (!commentContent.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setCommentSubmitting(true)
    try {
      const { error } = await supabase.from('idea_comments').insert({
        idea_id: params.id,
        user_id: user.id,
        content: commentContent,
      })

      if (error) throw error

      setCommentContent('')
      loadComments()
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setCommentSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 아이디어를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      router.push('/ideas')
    } catch (error: any) {
      console.error('Error deleting idea:', error)
      toast({
        variant: 'error',
        title: '삭제 실패',
        description: error.message || '삭제 중 오류가 발생했습니다',
      })
    }
  }

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

  const statusLabels = {
    recruiting: '팀원 모집중',
    in_progress: '진행중',
    completed: '완료',
    closed: '마감',
  }

  const statusColors = {
    recruiting: 'default',
    in_progress: 'secondary',
    completed: 'outline',
    closed: 'outline',
  } as const

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  if (!idea) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">
          <p className="text-muted-foreground">아이디어를 찾을 수 없습니다</p>
          <Button asChild className="mt-4">
            <Link href="/ideas">목록으로</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isAuthor = currentUserId === idea.user_id

  return (
    <div className="container max-w-4xl py-8">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/ideas">
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Link>
      </Button>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={statusColors[idea.status]}>
                  {statusLabels[idea.status]}
                </Badge>
                <Badge variant="secondary">{idea.category}</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-4">{idea.title}</h1>
            </div>
            {isAuthor && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/ideas/${idea.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {idea.user && (
              <div className="flex items-center gap-2">
                {idea.user.avatar_url && (
                  <img
                    src={idea.user.avatar_url}
                    alt={idea.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium text-foreground">
                    {idea.user.name}
                  </div>
                  {idea.user.major && (
                    <div className="text-xs">
                      {idea.user.major}
                      {idea.user.year && ` · ${idea.user.year}학년`}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(idea.created_at)}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {idea.view_count}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {idea.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {idea.tags.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">태그</h3>
              <div className="flex flex-wrap gap-2">
                {idea.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Required Roles */}
          {idea.required_roles.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">필요한 팀원</h3>
              <div className="flex flex-wrap gap-2">
                {idea.required_roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center gap-2 border-t pt-4">
          <Button
            variant={isLiked ? 'default' : 'outline'}
            size="sm"
            onClick={handleLike}
          >
            <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            좋아요 {likeCount}
          </Button>
          <Button
            variant={isBookmarked ? 'default' : 'outline'}
            size="sm"
            onClick={handleBookmark}
          >
            <Bookmark
              className={`mr-2 h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`}
            />
            북마크
          </Button>
        </CardFooter>
      </Card>

      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          댓글 {comments.length}
        </h2>

        {/* Comment Form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Textarea
              placeholder="댓글을 입력하세요..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="mb-2"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleCommentSubmit}
                disabled={!commentContent.trim() || commentSubmitting}
              >
                {commentSubmitting ? '작성 중...' : '댓글 작성'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
            </div>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {comment.user?.avatar_url && (
                        <img
                          src={comment.user.avatar_url}
                          alt={comment.user.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="font-medium">
                          {comment.user?.name || '알 수 없음'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{comment.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
