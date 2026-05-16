import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from './auth.config'

const { auth } = NextAuth(authConfig)

export default auth(function middleware(req) {
  const session = req.auth
  const { pathname } = req.nextUrl

  // Public routes — no auth needed
  const publicPaths = ['/login', '/register']
  if (publicPaths.some(p => pathname.startsWith(p))) {
    // Redirect logged-in users away from auth pages
    if (session) {
      const dest = session.user.role === 'SUPER_ADMIN' ? '/super-admin' : '/dashboard'
      return NextResponse.redirect(new URL(dest, req.url))
    }
    return NextResponse.next()
  }

  // All other routes require auth
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Super admin guard
  if (pathname.startsWith('/super-admin') && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
