import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title:       'KinéPro - Gestion de Cabinet',
  description: 'Logiciel de gestion pour cabinets de kinésithérapie',
  appleWebApp: {
    capable:        true,
    title:          'KinéPro',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563EB',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Resolve user's preferred language (defaults to 'fr')
  let lang: 'fr' | 'ar' = 'fr'
  if (session?.user?.id) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { preferredLang: true },
      })
      if (u?.preferredLang === 'ar') lang = 'ar'
    } catch {}
  }
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={lang} dir={dir}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KinéPro" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap"
        />
      </head>
      <body>
        <SessionProvider session={session}>
          <ServiceWorkerRegistration />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
