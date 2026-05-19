'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'kinepro-pwa-install-dismissed'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS]                   = useState(false)
  const [isStandalone, setIsStandalone]     = useState(false)
  const [visible, setVisible]               = useState(false)
  const [isMobile, setIsMobile]             = useState(false)

  useEffect(() => {
    const ua         = navigator.userAgent
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
    const mobile     = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
    const ios        = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream

    setIsStandalone(standalone)
    setIsMobile(mobile)
    setIsIOS(ios)

    // Don't show if already installed or dismissed recently
    if (standalone) return
    if (sessionStorage.getItem(DISMISS_KEY)) return

    // For non-iOS: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (mobile) {
        // Show after 30s delay on mobile
        setTimeout(() => setVisible(true), 30_000)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)

    // For iOS mobile: show after 30s
    if (ios && mobile) {
      setTimeout(() => setVisible(true), 30_000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visible || isStandalone || !isMobile) return null

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setVisible(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  return (
    <div style={{
      position:     'fixed',
      bottom:       0,
      left:         0,
      right:        0,
      zIndex:       9999,
      background:   'white',
      borderRadius: '16px 16px 0 0',
      boxShadow:    '0 -8px 32px rgba(0,0,0,0.15)',
      padding:      '20px 20px 32px',
      display:      'flex',
      flexDirection: 'column',
      gap:          16,
      animation:    'slideUp 0.3s ease-out',
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Handle bar */}
      <div style={{ width: 40, height: 4, background: '#E2E8F0', borderRadius: 2, margin: '0 auto' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/icons/icon-72x72.png" alt="KinéPro" width={48} height={48} style={{ borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, color: '#0F172A', fontSize: 16, margin: 0 }}>Installez KinéPro</p>
          <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>Accès rapide depuis votre écran d'accueil</p>
        </div>
        <button onClick={handleDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, fontSize: 18, lineHeight: 1 }}>
          ✕
        </button>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: '⚡', text: 'Accès instantané — pas de navigateur' },
          { icon: '🔔', text: 'Notifications push en temps réel' },
          { icon: '📱', text: 'Expérience native sur mobile' },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 13, color: '#374151' }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {isIOS ? (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ fontSize: 13, color: '#1D4ED8', margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
            Appuyez sur{' '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, verticalAlign: 'middle' }}>
              {/* iOS Share icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </span>
            {' '}puis <strong>"Sur l'écran d'accueil"</strong>
          </p>
        </div>
      ) : (
        <button onClick={handleInstall}
          style={{
            width: '100%', padding: '13px',
            background: '#2563EB', color: 'white',
            border: 'none', borderRadius: 10,
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          📲 Installer l'application
        </button>
      )}
    </div>
  )
}
