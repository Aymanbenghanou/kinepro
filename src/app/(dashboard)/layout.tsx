import Sidebar from '@/components/layout/Sidebar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import FeedbackNotificationBar from '@/components/layout/FeedbackNotificationBar'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { SidebarProvider } from '@/lib/sidebar-context'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getPlanState, getTrialDaysLeft } from '@/lib/plan'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'

// Routes accessibles même « muré » (essai expiré) : facturation d'abonnement,
// compte, et la page de choix de plan (hors (dashboard)).
const WALL_EXEMPT_PREFIXES = ['/abonnement', '/compte']

// Bandeau fin de compte à rebours d'essai (cabinets "trialing" uniquement).
function TrialBanner({ daysLeft }: { daysLeft: number }) {
  return (
    <div style={{
      background: '#2563EB', color: 'white',
      padding: '8px 20px', fontSize: 13, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      flexWrap: 'wrap', textAlign: 'center',
    }}>
      <span>🎉 Essai gratuit — {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}</span>
      <Link href="/choisir-plan" style={{
        background: 'white', color: '#2563EB',
        padding: '3px 12px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none',
      }}>
        Choisir un plan
      </Link>
    </div>
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // État d'abonnement basé sur les champs billing du Cabinet (cf. src/lib/plan.ts).
  let trialDaysLeft: number | null = null
  if (session?.user?.cabinetId) {
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: session.user.cabinetId },
      select: { plan: true, planStatus: true, trialEndsAt: true, createdAt: true },
    })
    if (cabinet) {
      const state = getPlanState(cabinet)
      // Mur : essai expiré → /choisir-plan, SAUF sur /compte et /abonnement (le
      // pathname vient du header posé par le middleware) pour qu'un utilisateur
      // muré puisse gérer son compte / son abonnement et se déconnecter.
      const pathname = (await headers()).get('x-pathname') ?? ''
      const exempt = WALL_EXEMPT_PREFIXES.some(p => pathname.startsWith(p))
      if (state === 'trial_expired' && !exempt) redirect('/choisir-plan')
      if (state === 'trialing') trialDaysLeft = getTrialDaysLeft(cabinet.trialEndsAt)
    }
  }

  return (
    <SidebarProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {trialDaysLeft !== null && <TrialBanner daysLeft={trialDaysLeft} />}
        <FeedbackNotificationBar />
        <div className="flex flex-1" style={{ position: 'relative' }}>
          <Sidebar />
          <div className="main-content flex-1">
            {children}
          </div>
        </div>
      </div>
      <MobileBottomNav />
      <InstallPrompt />
    </SidebarProvider>
  )
}
