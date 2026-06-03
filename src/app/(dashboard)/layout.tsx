import Sidebar from '@/components/layout/Sidebar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import FeedbackNotificationBar from '@/components/layout/FeedbackNotificationBar'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { SidebarProvider } from '@/lib/sidebar-context'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { CabinetPlanStatus } from '@prisma/client'
import { getPlanState, getTrialDaysLeft } from '@/lib/plan'
import { buildContactCtaUrl } from '@/lib/contact-cta'
import { getAppConfig } from '@/lib/app-config'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

// Routes accessibles même « muré » (essai expiré, suspendu) : abonnement (passive) et compte.
const WALL_EXEMPT_PREFIXES = ['/abonnement', '/compte']

// Bandeau fin d'essai (cabinets "trialing" uniquement).
// Bleu en temps normal, orange si ≤ 3 jours restants.
// Pas de bouton "S'abonner" (modèle high-touch) — contact WhatsApp à la place.
function TrialBanner({ daysLeft, contactUrl }: { daysLeft: number; contactUrl: string }) {
  const urgent = daysLeft <= 3
  return (
    <div style={{
      background: urgent ? '#EA580C' : '#2563EB', color: 'white',
      padding: '8px 20px', fontSize: 13, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      flexWrap: 'wrap', textAlign: 'center',
    }}>
      <span>
        {urgent ? '⏰' : '🎉'} Essai gratuit — {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
      </span>
      <a href={contactUrl} target="_blank" rel="noopener noreferrer" style={{
        background: 'white', color: urgent ? '#EA580C' : '#2563EB',
        padding: '3px 12px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none',
      }}>
        💬 Contactez-nous
      </a>
    </div>
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  let trialDaysLeft: number | null = null
  if (session?.user?.cabinetId) {
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: session.user.cabinetId },
      select: { plan: true, planStatus: true, trialEndsAt: true, createdAt: true },
    })
    if (cabinet) {
      const pathname = (await headers()).get('x-pathname') ?? ''
      const exempt = WALL_EXEMPT_PREFIXES.some(p => pathname.startsWith(p))

      // Mur 1 : cabinet suspendu → /abonnement (lecture seule, infos de contact)
      if (cabinet.planStatus === CabinetPlanStatus.suspended && !exempt) {
        redirect('/abonnement')
      }

      // Mur 2 : essai expiré → /abonnement (anciennement /choisir-plan, supprimé)
      const state = getPlanState(cabinet)
      if (state === 'trial_expired' && !exempt) redirect('/abonnement')
      if (state === 'trialing') trialDaysLeft = getTrialDaysLeft(cabinet.trialEndsAt)
    }
  }

  const contactUrl = buildContactCtaUrl((await getAppConfig()).supportWhatsapp)

  return (
    <SidebarProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {trialDaysLeft !== null && <TrialBanner daysLeft={trialDaysLeft} contactUrl={contactUrl} />}
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
