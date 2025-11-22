import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{' '}
            <span className="font-medium underline underline-offset-4">
              KU Students
            </span>
            . 건국대학교 아이디어 공유 플랫폼.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:underline underline-offset-4"
          >
            소개
          </Link>
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:underline underline-offset-4"
          >
            이용약관
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground hover:underline underline-offset-4"
          >
            개인정보처리방침
          </Link>
        </div>
      </div>
    </footer>
  )
}
