import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const isLoginPage = req.nextUrl.pathname === '/login'
  const isRootPage = req.nextUrl.pathname === '/'

  const token = req.cookies.get('sb-xiteushnuwzzehdfhfex-auth-token')?.value

  if (!token && !isLoginPage && !isRootPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|inventory.html).*)'],
}
