'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function MarkdownEditor({ value, onChange, error }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>내용 (Markdown 지원)</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? '편집' : '미리보기'}
        </Button>
      </div>

      {showPreview ? (
        <div className="min-h-[300px] p-4 border rounded-md prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {value || '*내용을 입력하세요*'}
          </ReactMarkdown>
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="프로젝트 아이디어를 자세히 작성해주세요...

## 프로젝트 개요
프로젝트에 대한 간단한 설명을 작성하세요.

## 기대 효과
이 프로젝트를 통해 얻을 수 있는 것들을 작성하세요.

## 필요한 팀원
- 예: 프론트엔드 개발자 (React)
- 예: 백엔드 개발자 (Node.js)
- 예: 디자이너 (UI/UX)

## 기타
추가로 전달하고 싶은 내용을 작성하세요."
          className="min-h-[300px] font-mono text-sm"
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="text-xs text-muted-foreground">
        Markdown 문법을 사용할 수 있습니다. (제목, 목록, 링크, 코드 블록 등)
      </div>
    </div>
  )
}
