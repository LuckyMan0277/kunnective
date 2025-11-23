import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container flex flex-col items-center gap-4 py-12 md:py-24 lg:py-32 px-4">
        <div className="flex max-w-[980px] flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-bold leading-tight tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl lg:leading-[1.1]">
            건국대생들의 아이디어가
            <br className="hidden sm:inline" />
            프로젝트로 실현됩니다
          </h1>
          <p className="max-w-[750px] text-base text-muted-foreground sm:text-lg md:text-xl px-4">
            아이디어를 공유하고, 함께할 팀원을 찾고, 프로젝트를 시작하세요.
            Kunnective에서 당신의 꿈을 현실로 만드세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/signup">시작하기</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/ideas">아이디어 둘러보기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-12 md:py-16 lg:py-24 px-4">
        <div className="mx-auto grid max-w-5xl gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>아이디어 공유</CardTitle>
              <CardDescription>
                당신의 아이디어를 자유롭게 공유하고 피드백을 받으세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                마크다운 에디터로 구체적인 아이디어를 작성하고, 태그와 카테고리로 분류하여 공유할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>팀원 매칭</CardTitle>
              <CardDescription>
                필요한 역할과 기술 스택으로 최적의 팀원을 찾으세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                프로젝트에 지원하거나 스카웃 제안을 받아 함께할 팀원을 쉽게 찾을 수 있습니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>실시간 협업</CardTitle>
              <CardDescription>
                팀원들과 실시간으로 소통하며 프로젝트를 진행하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                1:1 채팅과 프로젝트 그룹 채팅으로 언제든지 팀원들과 소통할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
          <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            지금 바로 시작하세요
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            건국대 이메일로 가입하고 당신의 아이디어를 현실로 만들어보세요.
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">무료로 시작하기</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
