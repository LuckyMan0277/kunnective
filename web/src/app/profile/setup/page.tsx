'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { profileSchema, type ProfileFormData } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function ProfileSetupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [supabase])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      skills: [],
      interests: [],
    },
  })

  const skills = watch('skills')
  const interests = watch('interests')

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      if (!skills.includes(skillInput.trim())) {
        setValue('skills', [...skills, skillInput.trim()])
      }
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setValue(
      'skills',
      skills.filter((s) => s !== skill)
    )
  }

  const addInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && interestInput.trim()) {
      e.preventDefault()
      if (!interests.includes(interestInput.trim())) {
        setValue('interests', [...interests, interestInput.trim()])
      }
      setInterestInput('')
    }
  }

  const removeInterest = (interest: string) => {
    setValue(
      'interests',
      interests.filter((i) => i !== interest)
    )
  }

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true)
    setError(null)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('로그인이 필요합니다')
        setLoading(false)
        return
      }

      // Insert profile
      const { error: insertError } = await supabase.from('users').insert({
        id: user.id,
        email: user.email!,
        name: data.name,
        major: data.major || null,
        year: data.year || null,
        bio: data.bio || null,
        skills: data.skills,
        interests: data.interests,
        portfolio_url: data.portfolio_url || null,
        github_url: data.github_url || null,
      })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      // Redirect to profile page
      router.push('/profile')
      router.refresh()
    } catch (err) {
      setError('프로필 생성 중 오류가 발생했습니다')
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>프로필 생성</CardTitle>
          <CardDescription>
            나를 소개할 프로필을 작성해주세요. 프로젝트 팀원을 찾는데 도움이
            됩니다.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Avatar Upload */}
            {userId && <AvatarUpload userId={userId} />}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                placeholder="홍길동"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Major */}
            <div className="space-y-2">
              <Label htmlFor="major">전공</Label>
              <Input
                id="major"
                placeholder="컴퓨터공학부"
                {...register('major')}
              />
              {errors.major && (
                <p className="text-sm text-destructive">{errors.major.message}</p>
              )}
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">학년</Label>
              <Controller
                name="year"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    id="year"
                    type="number"
                    min={1}
                    max={4}
                    placeholder="3"
                    value={value || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      onChange(val ? parseInt(val) : undefined)
                    }}
                  />
                )}
              />
              {errors.year && (
                <p className="text-sm text-destructive">{errors.year.message}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">자기소개</Label>
              <Textarea
                id="bio"
                placeholder="간단한 자기소개를 작성해주세요 (최대 500자)"
                className="min-h-[120px]"
                {...register('bio')}
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label htmlFor="skills">기술 스택</Label>
              <Input
                id="skills"
                placeholder="기술 입력 후 Enter (예: React, TypeScript)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={addSkill}
              />
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <Label htmlFor="interests">관심 분야</Label>
              <Input
                id="interests"
                placeholder="관심 분야 입력 후 Enter (예: 웹 개발, AI)"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={addInterest}
              />
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="gap-1">
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Portfolio URL */}
            <div className="space-y-2">
              <Label htmlFor="portfolio_url">포트폴리오 URL</Label>
              <Input
                id="portfolio_url"
                type="url"
                placeholder="https://myportfolio.com"
                {...register('portfolio_url')}
              />
              {errors.portfolio_url && (
                <p className="text-sm text-destructive">
                  {errors.portfolio_url.message}
                </p>
              )}
            </div>

            {/* GitHub URL */}
            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                type="url"
                placeholder="https://github.com/username"
                {...register('github_url')}
              />
              {errors.github_url && (
                <p className="text-sm text-destructive">
                  {errors.github_url.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '생성 중...' : '프로필 생성'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
