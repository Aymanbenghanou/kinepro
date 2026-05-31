import { NextResponse, type NextRequest, userAgent } from 'next/server'
import { getToken } from 'next-auth/jwt'

// NOTE Edge Runtime — pas d'import depuis '@prisma/client' ni de NextAuth(authConfig).
// Instancier NextAuth dans le middleware embarque ~1 MB de machinerie (providers
// OAuth, JWE, etc.) → rejet Vercel Hobby. On lit le JWT directement avec getToken,
// qui est tree-shakable et ne tire que le décodeur JWT. Source de vérité du rôle =
// enum Prisma au niveau DB ; la comparaison string ici est runtime-identique.
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'

/** Desktop paths that have a /m/* mobile counterpart. */
const MOBILE_REDIRECTS: Record<string, string> = {
  '/dashboard':   '/m/dashboard',
  '/agenda':      '/m/agenda',
  '/patients':    '/m/patients',
  '/seances':     '/m/seances',
  '/facturation': '/m/facturation',
  '/whatsapp':    '/m/whatsapp',
}

export default async function middleware(req: NextRequest) {
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

  // Decode JWT cookie directement — pas d'instance NextAuth (cf. note en tête).
  // getToken essaie AUTH_SECRET puis NEXTAUTH_SECRET en fallback.
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  })
  const role = token?.role as string | undefined

  // Auth-page routes — no auth needed, but redirect logged-in users away
  const authPaths = ['/login', '/register']
  if (authPaths.some(p => pathname.startsWith(p))) {
    if (token) {
      const dest = role === SUPER_ADMIN_ROLE
        ? '/super-admin'
        : (isMobile ? '/m/dashboard' : '/dashboard')
      return NextResponse.redirect(new URL(dest, req.url))
    }
    return NextResponse.next()
  }

  // All other routes require auth
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Super admin guard
  if (pathname.startsWith('/super-admin') && role !== SUPER_ADMIN_ROLE) {
    return NextResponse.redirect(new URL(isMobile ? '/m/dashboard' : '/dashboard', req.url))
  }

  // ── Mobile / desktop route routing ──────────────────────────────────────
  // Mobile users on a desktop route → bounce them to the /m/* equivalent.
  if (isMobile && role !== SUPER_ADMIN_ROLE) {
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
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
