'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ideaSchema, type IdeaFormData } from '@/lib/validation'
import { Idea } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { MarkdownEditor } from '@/components/ideas/markdown-editor'

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
  { value: 'closed', label: '마감' },
]

export default function EditIdeaPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [roleInput, setRoleInput] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<IdeaFormData>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      tags: [],
      required_roles: [],
    },
  })

  const tags = watch('tags')
  const requiredRoles = watch('required_roles')

  useEffect(() => {
    loadIdea()
  }, [params.id])

  const loadIdea = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      const idea = data as Idea

      // Check if user is the author
      if (idea.user_id !== user.id) {
        router.push(`/ideas/${params.id}`)
        return
      }

      // Set form values
      reset({
        title: idea.title,
        content: idea.content,
        category: idea.category,
        tags: idea.tags || [],
        status: idea.status,
        required_roles: idea.required_roles || [],
      })

      setInitializing(false)
    } catch (error) {
      console.error('Error loading idea:', error)
      router.push('/ideas')
    }
  }

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

  const addRole = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && roleInput.trim()) {
      e.preventDefault()
      if (!requiredRoles.includes(roleInput.trim())) {
        setValue('required_roles', [...requiredRoles, roleInput.trim()])
      }
      setRoleInput('')
    }
  }

  const removeRole = (role: string) => {
    setValue(
      'required_roles',
      requiredRoles.filter((r) => r !== role)
    )
  }

  const onSubmit = async (data: IdeaFormData) => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('ideas')
        .update({
          title: data.title,
          content: data.content,
          category: data.category,
          tags: data.tags,
          status: data.status,
          required_roles: data.required_roles,
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      router.push(`/ideas/${params.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || '아이디어 수정 중 오류가 발생했습니다')
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>아이디어 수정</CardTitle>
          <CardDescription>
            아이디어 내용을 수정할 수 있습니다
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
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                placeholder="프로젝트 아이디어 제목을 입력하세요"
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

            {/* Content (Markdown) */}
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <MarkdownEditor
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.content?.message}
                />
              )}
            />

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

            {/* Required Roles */}
            <div className="space-y-2">
              <Label htmlFor="required_roles">필요한 팀원 역할</Label>
              <Input
                id="required_roles"
                placeholder="역할 입력 후 Enter (예: 프론트엔드 개발자)"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={addRole}
              />
              {requiredRoles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {requiredRoles.map((role) => (
                    <Badge key={role} variant="outline" className="gap-1">
                      {role}
                      <button
                        type="button"
                        onClick={() => removeRole(role)}
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
              {loading ? '저장 중...' : '저장'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
