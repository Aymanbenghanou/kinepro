import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'

export const metadata: Metadata = {
  title: 'KinéPro - Gestion de Cabinet',
  description: 'Logiciel de gestion pour cabinets de kinésithérapie',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  return (
    <html lang="fr">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
