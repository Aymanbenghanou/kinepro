import Sidebar from '@/components/layout/Sidebar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import FeedbackNotificationBar from '@/components/layout/FeedbackNotificationBar'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { SidebarProvider } from '@/lib/sidebar-context'
import { auth } from '@/auth'
import Link from 'next/link'

function TrialBanner({ daysLeft, status }: { daysLeft: number | null; status: string }) {
  if (status === 'ACTIVE') return null
  if (status === 'SUSPENDED') {
    return (
      <div style={{
        background: '#7F1D1D', color: 'white',
        padding: '10px 20px', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        textAlign: 'center', flexWrap: 'wrap',
      }}>
        <span>🔒 Votre accès est suspendu. Veuillez contacter le support.</span>
        <Link href="/abonnement" style={{ color: '#FCA5A5', textDecoration: 'underline', fontWeight: 700 }}>
          Voir les offres →
        </Link>
      </div>
    )
  }

  if (daysLeft === null || daysLeft < 0) {
    return (
      <div style={{
        background: '#991B1B', color: 'white',
        padding: '10px 20px', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        flexWrap: 'wrap', textAlign: 'center',
      }}>
        <span>⚠️ Votre période d'essai est terminée. Certaines fonctionnalités sont limitées.</span>
        <Link href="/abonnement" style={{
          background: 'white', color: '#991B1B',
          padding: '4px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13,
          textDecoration: 'none',
        }}>
          Choisir un plan →
        </Link>
      </div>
    )
  }

  if (daysLeft <= 2) {
    return (
      <div style={{
        background: '#DC2626', color: 'white',
        padding: '10px 20px', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        flexWrap: 'wrap', textAlign: 'center',
      }}>
        <span>🚨 Plus que {daysLeft} jour{daysLeft > 1 ? 's' : ''} d'essai gratuit !</span>
        <Link href="/abonnement" style={{
          background: 'white', color: '#DC2626',
          padding: '4px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13,
          textDecoration: 'none',
        }}>
          S'abonner maintenant →
        </Link>
      </div>
    )
  }

  if (daysLeft <= 4) {
    return (
      <div style={{
        background: '#D97706', color: 'white',
        padding: '10px 20px', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        flexWrap: 'wrap', textAlign: 'center',
      }}>
        <span>⏳ Il vous reste {daysLeft} jours d'essai gratuit.</span>
        <Link href="/abonnement" style={{
          background: 'white', color: '#D97706',
          padding: '4px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13,
          textDecoration: 'none',
        }}>
          Voir les offres →
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      background: '#1D4ED8', color: 'white',
      padding: '8px 20px', fontSize: 13,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      flexWrap: 'wrap', textAlign: 'center',
    }}>
      <span>🎉 Essai gratuit — {daysLeft} jours restants. Aucune carte bancaire requise.</span>
      <Link href="/abonnement" style={{ color: '#BAE6FD', textDecoration: 'underline' }}>
        Voir les offres
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
  const status   = session?.user?.subscriptionStatus ?? 'TRIAL'
  const daysLeft = session?.user?.trialDaysLeft ?? null

  return (
    <SidebarProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TrialBanner daysLeft={daysLeft} status={status} />
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
