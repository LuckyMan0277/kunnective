import Link from 'next/link'
import { Heart, MessageCircle, Eye, Clock } from 'lucide-react'
import { Idea } from '@/types'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface IdeaCardProps {
  idea: Idea
}

export function IdeaCard({ idea }: IdeaCardProps) {
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}분 전`
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`
    } else if (diffDays < 7) {
      return `${diffDays}일 전`
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }
  }

  // Truncate content
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  return (
    <Link href={`/ideas/${idea.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2">{idea.title}</h3>
            <Badge variant={statusColors[idea.status]}>
              {statusLabels[idea.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {idea.user && (
              <div className="flex items-center gap-1">
                {idea.user.avatar_url && (
                  <img
                    src={idea.user.avatar_url}
                    alt={idea.user.name}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span>{idea.user.name}</span>
              </div>
            )}
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(idea.created_at)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {truncateContent(idea.content)}
          </p>
          {idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {idea.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {idea.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{idea.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>{idea.like_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{idea.comment_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{idea.view_count}</span>
          </div>
          {idea.category && (
            <>
              <span>•</span>
              <Badge variant="secondary" className="text-xs">
                {idea.category}
              </Badge>
            </>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}
