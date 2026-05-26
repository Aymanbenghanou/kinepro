import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { requireCabinetPlan } from '@/lib/plan-server'
import MobileBottomNav from '@/components/mobile/MobileBottomNav'

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

  // Même mur que le desktop : essai expiré → /choisir-plan (exemptés / essai / actif passent).
  const { state } = await requireCabinetPlan()
  if (state === 'trial_expired') redirect('/choisir-plan')

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
