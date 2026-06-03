import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { getAppConfig } from '@/lib/app-config'
import { AppConfigProvider } from '@/components/providers/AppConfigProvider'
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration'

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
  const [session, appConfig] = await Promise.all([auth(), getAppConfig()])
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KinéPro" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <SessionProvider session={session}>
          <AppConfigProvider value={{ supportWhatsapp: appConfig.supportWhatsapp }}>
            <ServiceWorkerRegistration />
            {children}
          </AppConfigProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
