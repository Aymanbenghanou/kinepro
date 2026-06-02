import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/auth'
import { requireCabinetPlan } from '@/lib/plan-server'
import { CabinetPlanStatus } from '@prisma/client'
import MobileBottomNav from '@/components/mobile/MobileBottomNav'

// Routes mobiles accessibles même « muré » (suspendu ou essai expiré) :
// la page d'abonnement passive et l'éventuel /m/compte.
const MOBILE_WALL_EXEMPT_PREFIXES = ['/m/abonnement', '/m/compte']

/**
 * Mobile route-group layout (/m/*).
 *
 * Renders a clean shell: no sidebar, no desktop chrome — just the
 * content area with bottom padding for the fixed bottom nav.
 * Each page is responsible for its own MobileTopbar (it varies per page).
 */
export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Même mur que le desktop, en restant dans le contexte mobile (/m/abonnement)
  // pour éviter la boucle UA-detection. Exempte /m/abonnement et /m/compte.
  const pathname = (await headers()).get('x-pathname') ?? ''
  const exempt = MOBILE_WALL_EXEMPT_PREFIXES.some(p => pathname.startsWith(p))
  if (!exempt) {
    const { cabinet, state } = await requireCabinetPlan()
    if (cabinet?.planStatus === CabinetPlanStatus.suspended) redirect('/m/abonnement')
    if (state === 'trial_expired') redirect('/m/abonnement')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F8FAFC',
      paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
      maxWidth: '100vw',
      overflowX: 'hidden',
    }}>
      {children}
      <MobileBottomNav />
    </div>
  )
}
