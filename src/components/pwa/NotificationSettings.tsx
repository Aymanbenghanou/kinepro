'use client'

import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from({ length: rawData.length }, (_, i) => rawData.charCodeAt(i))
}

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export default function NotificationSettings() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [swReady, setSwReady]       = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PermissionState)

    navigator.serviceWorker.ready.then(async (reg) => {
      setSwReady(true)
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    })
  }, [])

  const enableNotifications = async () => {
    setLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result as PermissionState)

      if (result !== 'granted') {
        setLoading(false)
        return
      }

      const reg    = await navigator.serviceWorker.ready
      const vapid  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      const sub    = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapid).buffer as ArrayBuffer,
      })

      await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(sub),
      })

      setSubscribed(true)

      // Send a test welcome notification
      await fetch('/api/push/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title: '✅ Notifications activées',
          body:  'Vous recevrez désormais les alertes KinéPro en temps réel.',
          tag:   'welcome',
          data:  { url: '/dashboard' },
        }),
      })
    } catch (err) {
      console.error('[NotificationSettings] enable failed', err)
    }
    setLoading(false)
  }

  const disableNotifications = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method:  'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      console.error('[NotificationSettings] disable failed', err)
    }
    setLoading(false)
  }

  const notifTypes = [
    { key: 'feedback',  emoji: '⭐', label: 'Feedbacks prêts à envoyer',     desc: "20 min après la fin d'une séance" },
    { key: 'rdv',       emoji: '📅', label: 'Nouveaux rendez-vous',           desc: 'Quand un RDV est confirmé' },
    { key: 'trial',     emoji: '⚠️', label: "Rappel fin d'essai gratuit",    desc: '3 jours avant expiration' },
    { key: 'summary',   emoji: '📋', label: 'Résumé quotidien',               desc: 'Chaque matin à 7h00' },
  ]

  if (permission === 'unsupported') {
    return (
      <div style={{ padding: '16px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#92400E' }}>
          ⚠️ Les notifications push ne sont pas supportées par votre navigateur.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Main toggle */}
      <div style={{
        background: subscribed ? '#F0FDF4' : '#F8FAFC',
        border: `1px solid ${subscribed ? '#BBF7D0' : '#E2E8F0'}`,
        borderRadius: 12, padding: '18px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ fontWeight: 600, color: '#0F172A', fontSize: 14, margin: 0 }}>
            {subscribed ? '🔔 Notifications activées' : '🔕 Notifications désactivées'}
          </p>
          <p style={{ color: '#64748B', fontSize: 12, margin: '3px 0 0' }}>
            {subscribed
              ? 'Vous recevez les alertes en temps réel sur cet appareil'
              : 'Activez pour recevoir les alertes feedback, RDV et résumé quotidien'}
          </p>
        </div>
        <button
          onClick={subscribed ? disableNotifications : enableNotifications}
          disabled={loading || !swReady || permission === 'denied'}
          style={{
            padding: '8px 18px',
            background: subscribed ? '#FEE2E2' : '#2563EB',
            color: subscribed ? '#DC2626' : 'white',
            border: 'none', borderRadius: 8,
            fontWeight: 600, fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            opacity: (!swReady || permission === 'denied') ? 0.5 : 1,
          }}
        >
          {loading ? '...' : subscribed ? 'Désactiver' : 'Activer'}
        </button>
      </div>

      {/* Denied warning */}
      {permission === 'denied' && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#DC2626' }}>
            🚫 Les notifications sont bloquées dans votre navigateur. Allez dans les paramètres du navigateur pour les réactiver.
          </p>
        </div>
      )}

      {/* Per-type list (display only — all driven by the main toggle for now) */}
      {subscribed && (
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#64748B' }}>TYPES DE NOTIFICATIONS</p>
          </div>
          {notifTypes.map((t, i) => (
            <div key={t.key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px',
              borderBottom: i < notifTypes.length - 1 ? '1px solid #F1F5F9' : 'none',
            }}>
              <span style={{ fontSize: 20, minWidth: 28 }}>{t.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#0F172A' }}>{t.label}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>{t.desc}</p>
              </div>
              <div style={{ width: 36, height: 20, background: '#2563EB', borderRadius: 999, position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', right: 2, top: 2, width: 16, height: 16, background: 'white', borderRadius: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
