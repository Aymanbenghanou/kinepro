'use client'

import dynamic from 'next/dynamic'
import Topbar from '@/components/layout/Topbar'

// PWA push notifications — composant client-only (utilise window/serviceWorker).
const NotificationSettings = dynamic(
  () => import('@/components/pwa/NotificationSettings'),
  { ssr: false }
)

export default function NotificationsPage() {
  return (
    <div>
      <Topbar title="Notifications" subtitle="Alertes en temps réel sur cet appareil" />
      <div style={{ padding: '24px 28px' }}>
        <div style={{ maxWidth: 620 }}>
          <div style={{
            background: 'white', border: '1px solid #E2E8F0',
            borderLeft: '4px solid #7C3AED', borderRadius: 12, padding: 28,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#F5F3FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 18 }}>🔔</span>
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Notifications Push
              </h2>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
              Recevez des alertes en temps réel sur cet appareil — même quand le navigateur est fermé.
            </p>
            <NotificationSettings />
          </div>

          {/* PWA install info */}
          <div style={{
            marginTop: 16, background: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: 12, padding: 20,
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8', margin: '0 0 8px' }}>
              📱 Installer KinéPro comme application
            </p>
            <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>
              Sur mobile : ouvrez ce site dans votre navigateur, appuyez sur le menu puis
              <strong> « Ajouter à l'écran d'accueil »</strong>. Vous obtiendrez une icône native
              et les notifications fonctionneront en arrière-plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
