'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Briefcase, Code, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ProfileSetupPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [bio, setBio] = useState('')
  const [major, setMajor] = useState('')
  const [year, setYear] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [availableForProjects, setAvailableForProjects] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const commonSkills = [
    // 프로그래밍
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Rust', 'Go',
    // 프론트엔드
    'React', 'Next.js', 'Vue.js', 'Svelte', 'Tailwind CSS',
    // 백엔드
    'Node.js', 'Django', 'FastAPI', 'Spring', 'Express',
    // 디자인
    'Figma', 'Photoshop', 'Illustrator', 'After Effects', 'Premiere Pro',
    // 3D & 게임
    'Blender', 'Unity', 'Unreal Engine', 'Cinema 4D',
    // 데이터 & AI
    'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
    // 기타
    'AWS', 'Docker', 'Git', '영상 편집', '사진', '글쓰기'
  ]

  const projectInterests = [
    // 기술
    'Web 개발', 'Mobile 앱', 'AI/ML', '게임 개발', 'VR/AR',
    // 디자인 & 예술
    'UI/UX 디자인', '그래픽 디자인', '영상 제작', '애니메이션', '음악 제작',
    // 데이터 & 분석
    '데이터 분석', '데이터 시각화', '머신러닝',
    // 비즈니스
    '창업', '마케팅', '브랜딩', '콘텐츠 제작',
    // 연구 & 학술
    '학술 연구', '논문 작성', '실험',
    // 사회 & 문화
    '사회 공헌', '교육', '미디어', '예술 프로젝트',
    // 기타
    '블록체인', '사이버 보안', 'IoT', '기타'
  ]

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserId(user.id)

      // Check if profile already exists and has data
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setBio(profile.bio || '')
        setMajor(profile.major || '')
        setYear(profile.year || '')
        setSkills(profile.skills || [])
        setAvailableForProjects(profile.available_for_projects ?? true)
      }

      setLoading(false)
    }

    loadUser()
  }, [supabase, router])

  function addSkill(skill: string) {
    const trimmedSkill = skill.trim()
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill])
      setSkillInput('')
    }
  }

  function removeSkill(skillToRemove: string) {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  function toggleInterest(interest: string) {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest))
    } else {
      setInterests([...interests, interest])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          bio,
          major,
          year,
          skills,
          available_for_projects: availableForProjects,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Redirect to home after successful profile setup
      router.push('/')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      alert('프로필 저장에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">프로필 설정</h1>
            <p className="text-muted-foreground">
              나를 소개하고 관심사를 공유하세요. 개발, 디자인, 예술, 연구, 창업 등 무엇이든 가능합니다.
            </p>
            <p className="text-sm text-primary mt-2">
              💡 Kunnective는 자율성을 지향합니다 - 역할 제한 없이 누구든 무엇이든 할 수 있습니다
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 자기소개 */}
            <div>
              <label htmlFor="bio" className="flex items-center gap-2 text-sm font-medium mb-2">
                <User className="w-4 h-4" />
                자기소개
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="간단한 자기소개를 작성해주세요..."
                rows={4}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* 전공 */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="major" className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Briefcase className="w-4 h-4" />
                  전공
                </label>
                <input
                  id="major"
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="예: 컴퓨터공학과"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium mb-2">
                  학년
                </label>
                <select
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">선택하세요</option>
                  <option value="1학년">1학년</option>
                  <option value="2학년">2학년</option>
                  <option value="3학년">3학년</option>
                  <option value="4학년">4학년</option>
                  <option value="대학원생">대학원생</option>
                </select>
              </div>
            </div>

            {/* 기술 스택 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Code className="w-4 h-4" />
                기술 스택
              </label>

              {/* 추가된 스킬 */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {skills.map((skill) => (
                    <motion.span
                      key={skill}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-red-300"
                      >
                        ×
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}

              {/* 커스텀 입력 */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill(skillInput)
                    }
                  }}
                  placeholder="기술을 입력하고 Enter를 누르세요"
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <motion.button
                  type="button"
                  onClick={() => addSkill(skillInput)}
                  className="px-4 py-2 bg-secondary rounded-lg hover:opacity-80"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  추가
                </motion.button>
              </div>

              {/* 추천 스킬 */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">추천 기술 (클릭하여 추가)</p>
                <div className="flex flex-wrap gap-2">
                  {commonSkills
                    .filter(skill => !skills.includes(skill))
                    .map((skill) => (
                      <motion.button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="px-3 py-1 border border-border rounded-full text-sm hover:bg-accent"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        + {skill}
                      </motion.button>
                    ))}
                </div>
              </div>
            </div>

            {/* 관심 분야 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                관심 프로젝트 분야 (여러 개 선택 가능)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                기술, 예술, 비즈니스, 연구 등 모든 분야를 포함합니다
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {projectInterests.map((interest) => (
                  <motion.button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-2 rounded-lg border transition text-sm ${
                      interests.includes(interest)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {interest}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 프로젝트 참여 가능 여부 */}
            <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
              <input
                type="checkbox"
                id="available"
                checked={availableForProjects}
                onChange={(e) => setAvailableForProjects(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="available" className="text-sm cursor-pointer">
                프로젝트 제안 받기 (다른 사용자가 나를 프로젝트에 초대할 수 있습니다)
              </label>
            </div>

            {/* 제출 버튼 */}
            <div className="flex gap-3 pt-4">
              <motion.button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: saving ? 1 : 0.98 }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    저장하고 시작하기
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-border rounded-lg hover:bg-accent"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                나중에
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
