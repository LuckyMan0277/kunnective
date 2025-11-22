'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string
  onUploadComplete?: (url: string) => void
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  onUploadComplete,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    currentAvatarUrl
  )
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setError(null)
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다')
        setUploading(false)
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('파일 크기는 2MB 이하여야 합니다')
        setUploading(false)
        return
      }

      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      setAvatarUrl(publicUrl)

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      onUploadComplete?.(publicUrl)
    } catch (error: any) {
      setError(error.message || '업로드 중 오류가 발생했습니다')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    try {
      setError(null)
      setUploading(true)

      // Update user profile to remove avatar
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(undefined)
      onUploadComplete?.('')
    } catch (error: any) {
      setError(error.message || '삭제 중 오류가 발생했습니다')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Label>프로필 사진</Label>

      <div className="flex items-center gap-4">
        {/* Avatar Preview */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Upload/Remove Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '업로드 중...' : '사진 업로드'}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="mr-2 h-4 w-4" />
              사진 제거
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            최대 2MB, JPG/PNG
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
