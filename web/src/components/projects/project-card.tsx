import Link from 'next/link'
import { Users, Clock, Calendar } from 'lucide-react'
import { Project } from '@/types'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
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

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2">
              {project.title}
            </h3>
            <Badge variant={statusColors[project.status]}>
              {statusLabels[project.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {project.owner && (
              <div className="flex items-center gap-1">
                {project.owner.avatar_url && (
                  <img
                    src={project.owner.avatar_url}
                    alt={project.owner.name}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span>{project.owner.name}</span>
              </div>
            )}
            <span>•</span>
            <Badge variant="secondary" className="text-xs">
              {project.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {truncateText(project.description)}
          </p>
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {project.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {project.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{project.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>
              {project.member_count || 0}/{project.max_members}
            </span>
          </div>
          {project.start_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(project.start_date)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="w-4 h-4" />
            <span>{formatDate(project.created_at)}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
