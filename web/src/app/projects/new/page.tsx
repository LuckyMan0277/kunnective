'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { projectSchema, type ProjectFormData } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const categories = [
  { value: 'web', label: '웹 개발' },
  { value: 'mobile', label: '모바일 앱' },
  { value: 'ai', label: 'AI/ML' },
  { value: 'game', label: '게임' },
  { value: 'hardware', label: '하드웨어/IoT' },
  { value: 'design', label: '디자인' },
  { value: 'other', label: '기타' },
]

const statusOptions = [
  { value: 'recruiting', label: '팀원 모집중' },
  { value: 'in_progress', label: '진행중' },
  { value: 'completed', label: '완료' },
  { value: 'on_hold', label: '보류' },
]

export default function NewProjectPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const ideaId = searchParams.get('ideaId')
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      tags: [],
      status: 'recruiting',
      max_members: 10,
    },
  })

  const tags = watch('tags')

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setValue('tags', [...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setValue(
      'tags',
      tags.filter((t) => t !== tag)
    )
  }

  const onSubmit = async (data: ProjectFormData) => {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: project, error: insertError } = await supabase
        .from('projects')
        .insert({
          owner_id: user.id,
          idea_id: ideaId || null,
          title: data.title,
          description: data.description,
          category: data.category,
          tags: data.tags,
          status: data.status,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          github_url: data.github_url || null,
          demo_url: data.demo_url || null,
          max_members: data.max_members,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Add owner as first member
      await supabase.from('project_members').insert({
        project_id: project.id,
        user_id: user.id,
        role: 'Owner',
        status: 'active',
      })

      router.push(`/projects/${project.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || '프로젝트 생성 중 오류가 발생했습니다')
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>새 프로젝트 생성</CardTitle>
          <CardDescription>
            {ideaId
              ? '아이디어를 바탕으로 프로젝트를 시작하세요'
              : '새로운 프로젝트를 시작하고 팀원을 모집하세요'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">프로젝트 제목 *</Label>
              <Input
                id="title"
                placeholder="프로젝트 제목을 입력하세요"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-sm text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">상태</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">프로젝트 설명 *</Label>
              <Textarea
                id="description"
                placeholder="프로젝트에 대해 자세히 설명해주세요..."
                className="min-h-[150px]"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">시작 날짜</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">종료 날짜</Label>
                <Input id="end_date" type="date" {...register('end_date')} />
              </div>
            </div>

            {/* URLs */}
            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                type="url"
                placeholder="https://github.com/username/repo"
                {...register('github_url')}
              />
              {errors.github_url && (
                <p className="text-sm text-destructive">
                  {errors.github_url.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="demo_url">데모 URL</Label>
              <Input
                id="demo_url"
                type="url"
                placeholder="https://demo.example.com"
                {...register('demo_url')}
              />
              {errors.demo_url && (
                <p className="text-sm text-destructive">
                  {errors.demo_url.message}
                </p>
              )}
            </div>

            {/* Max Members */}
            <div className="space-y-2">
              <Label htmlFor="max_members">최대 팀원 수</Label>
              <Controller
                name="max_members"
                control={control}
                render={({ field }) => (
                  <Input
                    id="max_members"
                    type="number"
                    min={2}
                    max={50}
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                )}
              />
              {errors.max_members && (
                <p className="text-sm text-destructive">
                  {errors.max_members.message}
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">태그</Label>
              <Input
                id="tags"
                placeholder="태그 입력 후 Enter (예: React, TypeScript)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? '생성 중...' : '프로젝트 생성'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
