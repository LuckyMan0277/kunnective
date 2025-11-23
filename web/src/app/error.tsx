'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error boundary caught:', error)
  }, [error])

  return (
    <div className="container max-w-2xl py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <CardTitle>문제가 발생했습니다</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            죄송합니다. 페이지를 로드하는 중에 오류가 발생했습니다.
          </p>
          <details className="bg-muted p-4 rounded-md">
            <summary className="cursor-pointer font-medium mb-2">
              기술적 세부 정보
            </summary>
            <pre className="text-sm overflow-auto">
              {error.message}
            </pre>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </details>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset}>다시 시도</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            홈으로 이동
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
