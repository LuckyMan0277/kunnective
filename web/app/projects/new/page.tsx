'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Position {
  role: string
  required_count: number
  description: string
}

function NewProjectForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [techStack, setTechStack] = useState<string[]>([])
  const [techInput, setTechInput] = useState('')
  const [positions, setPositions] = useState<Position[]>([
    { role: '', required_count: 1, description: '' }
  ])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const sourceIdeaId = searchParams.get('source_idea_id')
  const supabase = createClient()

  useEffect(() => {
    if (sourceIdeaId) {
      loadSourceIdea()
    }
  }, [sourceIdeaId])

  async function loadSourceIdea() {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('title, description')
        .eq('id', sourceIdeaId)
        .single()

      if (error) throw error
      if (data) {
        setTitle(data.title)
        setDescription(data.description)
      }
    } catch (error) {
      console.error('Error loading source idea:', error)
    }
  }

  function addTech() {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()])
      setTechInput('')
    }
  }

  function removeTech(tech: string) {
    setTechStack(techStack.filter(t => t !== tech))
  }

  function addPosition() {
    setPositions([...positions, { role: '', required_count: 1, description: '' }])
  }

  function removePosition(index: number) {
    setPositions(positions.filter((_, i) => i !== index))
  }

  function updatePosition(index: number, field: keyof Position, value: any) {
    const updated = [...positions]
    updated[index] = { ...updated[index], [field]: value }
    setPositions(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    const validPositions = positions.filter(p => p.role.trim())
    if (validPositions.length === 0) {
      alert('최소 1개의 포지션을 입력해주세요')
      return
    }

    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('로그인이 필요합니다')
        router.push('/auth/login')
        return
      }

      // 프로젝트 생성
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          owner_id: user.id,
          title: title.trim(),
          description: description.trim(),
          duration: duration || null,
          tech_stack: techStack,
          status: 'recruiting',
          source_idea_id: sourceIdeaId || null,
        })
        .select()
        .single()

      if (projectError) throw projectError

      // 포지션 생성
      const positionsToInsert = validPositions.map(p => ({
        project_id: project.id,
        role: p.role.trim(),
        required_count: p.required_count,
        description: p.description.trim() || null,
      }))

      const { error: positionsError } = await supabase
        .from('positions')
        .insert(positionsToInsert)

      if (positionsError) throw positionsError

      // 아이디어 상태 업데이트 (프로젝트로 전환됨)
      if (sourceIdeaId) {
        await supabase
          .from('ideas')
          .update({
            status: 'converted_to_project',
            converted_project_id: project.id
          })
          .eq('id', sourceIdeaId)
      }

      router.push('/projects')
      router.refresh()
    } catch (error) {
      console.error('Error creating project:', error)
      alert('프로젝트 작성 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">프로젝트 팀 모집하기</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            프로젝트 제목 *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="프로젝트 제목을 입력하세요"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            프로젝트 설명 *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="프로젝트에 대해 자세히 설명해주세요"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[200px]"
            required
          />
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium mb-2">
            예상 기간
          </label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">선택하세요</option>
            <option value="1개월">1개월</option>
            <option value="3개월">3개월</option>
            <option value="6개월">6개월</option>
            <option value="1년">1년</option>
            <option value="미정">미정</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            기술 스택
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
              placeholder="예: React, TypeScript"
              className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={addTech}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
            >
              추가
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-secondary rounded-full flex items-center gap-2"
              >
                {tech}
                <button type="button" onClick={() => removeTech(tech)}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            모집 포지션 *
          </label>
          {positions.map((position, idx) => (
            <div key={idx} className="p-4 border border-border rounded-lg mb-4">
              <div className="flex gap-4 mb-3">
                <input
                  type="text"
                  value={position.role}
                  onChange={(e) => updatePosition(idx, 'role', e.target.value)}
                  placeholder="포지션 (예: 프론트엔드 개발자)"
                  className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
                <input
                  type="number"
                  value={position.required_count}
                  onChange={(e) => updatePosition(idx, 'required_count', parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-20 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {positions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePosition(idx)}
                    className="px-3 text-destructive"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <textarea
                value={position.description}
                onChange={(e) => updatePosition(idx, 'description', e.target.value)}
                placeholder="포지션 설명 (선택)"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                rows={2}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addPosition}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent"
          >
            <Plus className="w-4 h-4" />
            포지션 추가
          </button>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-border rounded-lg hover:bg-accent"
            disabled={loading}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '작성 중...' : '프로젝트 올리기'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewProjectForm />
    </Suspense>
  )
}
