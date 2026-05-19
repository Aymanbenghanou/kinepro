'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt:     () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY     = 'pwa_banner_dismissed'
const DISMISS_DAYS    = 7
const SHOW_DELAY_MS   = 5_000

// ─── iOS Share icon SVG ───────────────────────────────────────────────────────
function ShareIcon() {
  return (
    <svg
      width="17" height="17" viewBox="0 0 24 24"
      fill="none" stroke="#2563EB" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', marginBottom: 2 }}
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  )
}

// ─── KinéPro "K" icon ─────────────────────────────────────────────────────────
function KIcon() {
  return (
    <div style={{
      width: 52, height: 52, borderRadius: 14, flexShrink: 0,
      background: 'linear-gradient(135deg, #1E3A5F 0%, #1D4ED8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(30,58,95,0.25)',
    }}>
      <span style={{ color: 'white', fontSize: 26, fontWeight: 800, fontFamily: 'Georgia, serif', lineHeight: 1 }}>K</span>
    </div>
  )
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible]               = useState(false)
  const [isIOS, setIsIOS]                   = useState(false)

  useEffect(() => {
    const ua         = navigator.userAgent
    const standalone = window.matchMedia('(display-mode: standalone)').matches
                    || (window.navigator as any).standalone === true

    // Must not already be installed
    if (standalone) return

    // Mobile only
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
    if (!isMobile) return

    // Check 7-day dismiss
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const since = Date.now() - parseInt(dismissed, 10)
      if (since < DISMISS_DAYS * 24 * 60 * 60 * 1000) return
    }

    const ios    = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    const safari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua)

    setIsIOS(ios)

    if (ios && safari) {
      // iOS Safari: show instructions after delay (no beforeinstallprompt support)
      const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
      return () => clearTimeout(t)
    } else {
      // Android / other browsers: wait for native prompt event
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setTimeout(() => setVisible(true), SHOW_DELAY_MS)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  if (!visible) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setVisible(false)
    setDeferredPrompt(null)
  }

  // ─── iOS Safari banner ───────────────────────────────────────────────────────
  if (isIOS) {
    return (
      <>
        <style>{`
          @keyframes kp-slide-up {
            from { transform: translateY(110%); }
            to   { transform: translateY(0); }
          }
        `}</style>
        <div style={{
          position:      'fixed',
          bottom:        0,
          left:          0,
          right:         0,
          zIndex:        9999,
          background:    'white',
          borderRadius:  '20px 20px 0 0',
          boxShadow:     '0 -6px 40px rgba(0,0,0,0.18)',
          padding:       '10px 20px 36px',
          animation:     'kp-slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display:       'flex',
          flexDirection: 'column',
          gap:           14,
        }}>
          {/* Handle */}
          <div style={{ width: 36, height: 4, background: '#CBD5E1', borderRadius: 2, margin: '0 auto 2px' }} />

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <KIcon />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#0F172A' }}>
                Installez KinéPro
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
                sur votre écran d'accueil
              </p>
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Fermer"
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: '#F1F5F9', border: 'none',
                cursor: 'pointer', color: '#64748B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 600, flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Steps */}
          <div style={{
            background:   '#EFF6FF',
            border:       '1px solid #BFDBFE',
            borderRadius: 12,
            padding:      '14px 16px',
            display:      'flex',
            flexDirection: 'column',
            gap:          10,
          }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1D4ED8', letterSpacing: '0.05em' }}>
              COMMENT INSTALLER
            </p>

            {/* Step 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: '#2563EB', color: 'white',
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>1</div>
              <p style={{ margin: 0, fontSize: 14, color: '#1E3A5F', lineHeight: 1.4 }}>
                Appuyez sur <ShareIcon /> <strong>Partager</strong> en bas de l'écran
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: '#2563EB', color: 'white',
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>2</div>
              <p style={{ margin: 0, fontSize: 14, color: '#1E3A5F', lineHeight: 1.4 }}>
                Puis appuyez sur{' '}
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 16 }}>➕</span> Sur l'écran d'accueil
                </strong>
              </p>
            </div>
          </div>

          {/* Arrow pointing down to the share icon */}
          <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
            ↓ Le bouton Partager se trouve dans la barre Safari en bas ↓
          </p>
        </div>
      </>
    )
  }

  // ─── Android / non-iOS banner ─────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes kp-slide-up {
          from { transform: translateY(110%); }
          to   { transform: translateY(0); }
        }
      `}</style>
      <div style={{
        position:      'fixed',
        bottom:        0,
        left:          0,
        right:         0,
        zIndex:        9999,
        background:    'white',
        borderRadius:  '20px 20px 0 0',
        boxShadow:     '0 -6px 40px rgba(0,0,0,0.18)',
        padding:       '10px 20px 36px',
        animation:     'kp-slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display:       'flex',
        flexDirection: 'column',
        gap:           16,
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: '#CBD5E1', borderRadius: 2, margin: '0 auto 2px' }} />

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <KIcon />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#0F172A' }}>
              Installez KinéPro
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
              Accès rapide depuis l'écran d'accueil
            </p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Fermer"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: '#F1F5F9', border: 'none',
              cursor: 'pointer', color: '#64748B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 600, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { icon: '⚡', text: 'Lancement instantané — sans navigateur' },
            { icon: '🔔', text: 'Notifications feedback & RDV en temps réel' },
            { icon: '📱', text: 'Interface native, plein écran' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, minWidth: 20 }}>{icon}</span>
              <span style={{ fontSize: 13, color: '#374151' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleInstall}
          style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(90deg, #1D4ED8 0%, #2563EB 100%)',
            color: 'white', border: 'none', borderRadius: 12,
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
          }}
        >
          📲 Installer l'application
        </button>
      </div>
    </>
  )
}
