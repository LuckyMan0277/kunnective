import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const supabase = await createClient()

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to success page after email verification
      return NextResponse.redirect(new URL('/auth/verified', requestUrl.origin))
    }
  }

  // If there's an error, redirect to login with error message
  return NextResponse.redirect(new URL('/auth/login?error=verification_failed', requestUrl.origin))
}
