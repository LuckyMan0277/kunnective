'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@kunnective/shared'

export default function ProfileEditPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [availableForProjects, setAvailableForProjects] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [mbti, setMbti] = useState('')
  const [doubleMajor, setDoubleMajor] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [contactPreference, setContactPreference] = useState<'chat' | 'kakao' | 'email'>('chat')
  const [links, setLinks] = useState<{ type: string; url: string }[]>([])
  const [values, setValues] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setUsername(data.username)
      setName(data.name || '')
      setBio(data.bio || '')
      setSkills(data.skills || [])
      setPortfolioUrl(data.portfolio_url || '')
      setGithubUrl(data.github_url || '')
      setLinkedinUrl(data.linkedin_url || '')
      setAvailableForProjects(data.available_for_projects)
      setAvatarUrl(data.avatar_url || '')
      setMbti(data.mbti || '')
      setDoubleMajor(data.double_major || '')
      setStatusMessage(data.status_message || '')
      setContactPreference(data.contact_preference || 'chat')
      setLinks(data.links || [])
      setValues(data.values || '')
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('파일 크기는 2MB 이하여야 합니다')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다')
        return
      }

      setUploading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(data.publicUrl)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('이미지 업로드에 실패했습니다')
    } finally {
      setUploading(false)
    }
  }

  function handleAddSkill() {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setSkillInput('')
    }
  }

  function handleRemoveSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill))
  }

  async function handleSave() {
    try {
      setSaving(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('users')
        .update({
          username,
          name: name.trim() || null,
          bio: bio.trim() || null,
          skills,
          portfolio_url: portfolioUrl.trim() || null,
          github_url: githubUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          available_for_projects: availableForProjects,
          avatar_url: avatarUrl || null,
          mbti: mbti || null,
          double_major: doubleMajor || null,
          status_message: statusMessage || null,
          contact_preference: contactPreference,
          links,
          values: values.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      alert('프로필이 저장되었습니다')
      router.push('/profile')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('프로필 저장에 실패했습니다')
    } finally {
      setSaving(false)
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

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        뒤로 가기
      </button>

      <div className="bg-card border border-border rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6">프로필 수정</h1>

        <div className="space-y-6">
          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium mb-2">프로필 사진</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {username[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <label className="px-4 py-2 border border-border rounded-lg hover:bg-accent cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {uploading ? '업로드 중...' : '이미지 업로드'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  최대 2MB, JPG, PNG, GIF
                </p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-2">사용자명</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="실명 또는 닉네임"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-2">자기소개</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="자신을 소개해주세요"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
            />
          </div>

          {/* Status Message */}
          <div>
            <label className="block text-sm font-medium mb-2">상태 메시지</label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="현재 상태를 알려주세요 (예: 팀 구하는 중 🔥)"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* MBTI */}
            <div>
              <label className="block text-sm font-medium mb-2">MBTI</label>
              <select
                value={mbti}
                onChange={(e) => setMbti(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                <option value="">선택안함</option>
                {['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Double Major */}
            <div>
              <label className="block text-sm font-medium mb-2">복수/부전공</label>
              <input
                type="text"
                value={doubleMajor}
                onChange={(e) => setDoubleMajor(e.target.value)}
                placeholder="복수/부전공 입력"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Contact Preference */}
          <div>
            <label className="block text-sm font-medium mb-2">선호 연락 수단</label>
            <div className="flex gap-4">
              {[
                { value: 'chat', label: '앱 내 채팅' },
                { value: 'kakao', label: '카카오톡' },
                { value: 'email', label: '이메일' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contactPreference"
                    value={option.value}
                    checked={contactPreference === option.value}
                    onChange={(e) => setContactPreference(e.target.value as any)}
                    className="w-4 h-4 text-primary"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <label className="block text-sm font-medium mb-2">링크</label>
            <div className="space-y-2 mb-2">
              {links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={link.type}
                    onChange={(e) => {
                      const newLinks = [...links]
                      newLinks[index].type = e.target.value
                      setLinks(newLinks)
                    }}
                    className="w-32 px-3 py-2 border border-border rounded-lg bg-background"
                  >
                    <option value="blog">블로그</option>
                    <option value="behance">Behance</option>
                    <option value="notion">Notion</option>
                    <option value="other">기타</option>
                  </select>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...links]
                      newLinks[index].url = e.target.value
                      setLinks(newLinks)
                    }}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 border border-border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, i) => i !== index))}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLinks([...links, { type: 'blog', url: '' }])}
              className="text-sm text-primary hover:underline"
            >
              + 링크 추가
            </button>
          </div>

          {/* Values */}
          <div>
            <label className="block text-sm font-medium mb-2">가치관 (Values)</label>
            <textarea
              value={values}
              onChange={(e) => setValues(e.target.value)}
              placeholder="어떤 가치를 중요하게 생각하시나요? (예: 성장, 재미, 임팩트, 워라밸)"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
            />
          </div>

          {/* Skills (Renamed to Tools/Keywords) */}
          <div>
            <label className="block text-sm font-medium mb-2">사용 도구 / 키워드</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
                placeholder="도구, 기술, 관심 키워드 입력 (예: React, Figma, 영상편집)"
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-secondary rounded-full flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Portfolio URL */}
          <div>
            <label className="block text-sm font-medium mb-2">포트폴리오 URL</label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* GitHub URL */}
          <div>
            <label className="block text-sm font-medium mb-2">GitHub URL</label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* LinkedIn URL */}
          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Available for Projects */}
          <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
            <input
              type="checkbox"
              id="available"
              checked={availableForProjects}
              onChange={(e) => setAvailableForProjects(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="available" className="font-medium cursor-pointer">
              프로젝트 참여 가능
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-accent disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
