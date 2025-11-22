'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Mail, ExternalLink, Github } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // Profile doesn't exist, redirect to setup
        if (error.code === 'PGRST116') {
          router.push('/profile/setup')
          return
        }
      }

      setProfile(data)
      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">내 프로필</h1>
        <Button asChild>
          <Link href="/profile/edit">
            <Pencil className="mr-2 h-4 w-4" />
            프로필 수정
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader className="flex flex-row items-start gap-4">
            {/* Avatar */}
            {profile.avatar_url && (
              <div className="w-20 h-20 rounded-full border-2 border-border overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <CardTitle>{profile.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {profile.email}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.major && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  전공:
                </span>{' '}
                <span className="text-sm">{profile.major}</span>
                {profile.year && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({profile.year}학년)
                  </span>
                )}
              </div>
            )}

            {profile.bio && (
              <div>
                <span className="text-sm font-medium text-muted-foreground block mb-2">
                  자기소개
                </span>
                <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Links */}
            <div className="flex gap-3">
              {profile.portfolio_url && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    포트폴리오
                  </a>
                </Button>
              )}
              {profile.github_url && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        {profile.skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>기술 스택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interests */}
        {profile.interests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>관심 분야</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <Badge key={interest} variant="outline">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
