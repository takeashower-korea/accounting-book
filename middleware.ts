import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname === '/login'
  const isRootPage = req.nextUrl.pathname === '/'
  const isPublicFile = req.nextUrl.pathname.includes('.')

  if (isLoginPage || isRootPage || isPublicFile) {
    return NextResponse.next()
  }

  const authCookie = req.cookies.get('sb-access-token') ||
    req.cookies.getAll().find(c => c.name.includes('auth-token'))

  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|inventory.html).*)'],
}