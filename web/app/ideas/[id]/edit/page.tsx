'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EditIdeaPage() {
    const params = useParams()
    const id = params?.id as string
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (id) {
            loadIdea()
        }
    }, [id])

    async function loadIdea() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert('로그인이 필요합니다')
                router.push('/auth/login')
                return
            }

            const { data, error } = await supabase
                .from('ideas')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            if (!data) throw new Error('Idea not found')

            if (data.author_id !== user.id) {
                alert('수정 권한이 없습니다')
                router.push('/ideas')
                return
            }

            setTitle(data.title)
            setDescription(data.description)
        } catch (error) {
            console.error('Error loading idea:', error)
            alert('아이디어를 불러오는 중 오류가 발생했습니다')
            router.push('/ideas')
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim() || !description.trim()) return

        try {
            setSaving(true)

            const { error } = await supabase
                .from('ideas')
                .update({
                    title: title.trim(),
                    description: description.trim(),
                })
                .eq('id', id)

            if (error) throw error

            router.push(`/ideas/${id}`)
            router.refresh()
        } catch (error) {
            console.error('Error updating idea:', error)
            alert('아이디어 수정 중 오류가 발생했습니다')
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
            <h1 className="text-3xl font-bold mb-8">아이디어 수정하기</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2">
                        제목 *
                    </label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="아이디어 제목을 입력하세요"
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                        maxLength={200}
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                        설명 *
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="아이디어에 대해 자유롭게 설명해주세요"
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[200px]"
                        required
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 border border-border rounded-lg hover:bg-accent"
                        disabled={saving}
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? '저장 중...' : '수정 완료'}
                    </button>
                </div>
            </form>
        </div>
    )
}
