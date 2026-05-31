import NextAuth from 'next-auth'
import { NextResponse, userAgent } from 'next/server'
import { authConfig } from './auth.config'
import { UserRole } from '@prisma/client'

const { auth } = NextAuth(authConfig)

/** Desktop paths that have a /m/* mobile counterpart. */
const MOBILE_REDIRECTS: Record<string, string> = {
  '/dashboard':   '/m/dashboard',
  '/agenda':      '/m/agenda',
  '/patients':    '/m/patients',
  '/seances':     '/m/seances',
  '/facturation': '/m/facturation',
  '/whatsapp':    '/m/whatsapp',
}

export default auth(function middleware(req) {
  const session = req.auth
  const { pathname } = req.nextUrl
  const ua = userAgent(req)
  const isMobile = ua.device.type === 'mobile' || ua.device.type === 'tablet'

  // Root landing page — always public (no redirect even if logged in)
  if (pathname === '/') return NextResponse.next()

  // Fully open routes — no auth, no redirect even when logged in
  const openPaths = ['/cabinet', '/scan', '/booking', '/checkin', '/patient-public', '/feedback', '/legal', '/privacy', '/terms']
  if (openPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Auth-page routes — no auth needed, but redirect logged-in users away
  const authPaths = ['/login', '/register']
  if (authPaths.some(p => pathname.startsWith(p))) {
    if (session) {
      let dest: string
      if (session.user.role === UserRole.SUPER_ADMIN) dest = '/super-admin'
      else dest = isMobile ? '/m/dashboard' : '/dashboard'
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
  if (pathname.startsWith('/super-admin') && session.user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.redirect(new URL(isMobile ? '/m/dashboard' : '/dashboard', req.url))
  }

  // ── Mobile / desktop route routing ──────────────────────────────────────
  // Mobile users on a desktop route → bounce them to the /m/* equivalent.
  if (isMobile && session.user.role !== UserRole.SUPER_ADMIN) {
    if (MOBILE_REDIRECTS[pathname]) {
      return NextResponse.redirect(new URL(MOBILE_REDIRECTS[pathname], req.url))
    }
    if (pathname.startsWith('/patients/')) {
      return NextResponse.redirect(new URL(pathname.replace('/patients/', '/m/patients/'), req.url))
    }
  }

  // Desktop users on a /m/* mobile route → strip the /m prefix.
  if (!isMobile && pathname.startsWith('/m/')) {
    return NextResponse.redirect(new URL(pathname.replace(/^\/m/, ''), req.url))
  }

  // Expose le pathname au layout serveur (le mur d'essai y lit l'URL pour exempter
  // /compte et /abonnement). Le middleware NE fait PAS le check plan (pas de Prisma en edge).
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
