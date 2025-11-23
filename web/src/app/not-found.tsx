import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container max-w-2xl py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
            <CardTitle>페이지를 찾을 수 없습니다</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            요청하신 페이지를 찾을 수 없습니다. 주소가 잘못되었거나 페이지가 삭제되었을 수 있습니다.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/">홈으로 이동</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
