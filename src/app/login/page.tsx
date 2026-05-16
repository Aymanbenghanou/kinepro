'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PHOTO_URL =
  'https://res.cloudinary.com/djouneyaq/image/upload/v1778974291/cover-kinestherapie-sport-paris-institut-kinesitherapieV2.jpg_atyja5.webp'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get('callbackUrl') || '/dashboard'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [totp,     setTotp]     = useState('')
  const [step,     setStep]     = useState<'credentials' | 'totp'>('credentials')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      totp: step === 'totp' ? totp : '',
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      if (result.error === 'CredentialsSignin' && step === 'credentials') {
        setError('Email ou mot de passe incorrect.')
      } else if (step === 'totp') {
        setError('Code 2FA invalide. Réessayez.')
      } else {
        setError('Erreur de connexion. Vérifiez vos identifiants.')
      }
      return
    }

    if (result?.ok) {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <div className="auth-split-layout">

      {/* ── Left side: photo + overlay + branding ── */}
      <div className="auth-photo-side">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PHOTO_URL} alt="" aria-hidden="true" className="auth-photo-img" />
        <div className="auth-photo-overlay" />

        <div className="auth-photo-content">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 44, height: 44, background: 'white', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
              <span style={{ color: '#1E3A5F', fontSize: 20, fontWeight: 900 }}>K</span>
            </div>
            <span style={{ color: 'white', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>KinéPro</span>
          </div>

          {/* Tagline */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ color: 'white', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, lineHeight: 1.2, margin: '0 0 16px', letterSpacing: '-0.5px' }}>
              La gestion de cabinet<br />
              <span style={{ background: 'linear-gradient(90deg, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                pensée pour les kinés.
              </span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.65, margin: '0 0 36px', maxWidth: 360 }}>
              Patients, agenda, WhatsApp, facturation et Google Avis — tout en un.
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '✓', text: '7 jours gratuits — aucune carte bancaire' },
                { icon: '✓', text: 'Support en français et en arabe' },
                { icon: '✓', text: 'Données hébergées en sécurité' },
              ].map(b => (
                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#4ADE80', fontSize: 12, fontWeight: 800 }}>{b.icon}</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 48 }}>
            © 2026 KinéPro · Logiciel de gestion de cabinet
          </p>
        </div>
      </div>

      {/* ── Right side: form ── */}
      <div className="auth-form-side">
        <div className="auth-form-inner">

          {/* Mobile-only logo */}
          <div className="auth-mobile-logo">
            <div style={{ width: 48, height: 48, background: '#2563EB', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}>
              <span style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>K</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>KinéPro</h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Logiciel de gestion de cabinet</p>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
              {step === 'totp' ? 'Vérification 2FA' : 'Connexion'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              {step === 'totp'
                ? "Entrez le code de votre application d'authentification"
                : 'Accédez à votre espace de gestion'}
            </p>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#B91C1C', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {step === 'credentials' ? (
              <>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="votre@email.com"
                    autoComplete="email"
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.borderColor = '#2563EB')}
                    onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.borderColor = '#2563EB')}
                    onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
                  />
                </div>
              </>
            ) : (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Code 2FA (6 chiffres)</label>
                <input
                  type="text"
                  value={totp}
                  onChange={e => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="123456"
                  maxLength={6}
                  autoFocus
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 20, letterSpacing: 8, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#2563EB')}
                  onBlur={e => (e.target.style.borderColor = '#E2E8F0')}
                />
                <button type="button" onClick={() => { setStep('credentials'); setError('') }}
                  style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontSize: 13, marginTop: 8, padding: 0 }}>
                  ← Retour
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '13px', background: loading ? '#93C5FD' : '#2563EB',
                color: 'white', border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4, transition: 'background 0.2s',
              }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', margin: '24px 0 0' }}>
            Pas encore de compte ?{' '}
            <Link href="/register" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
              Créer un cabinet
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-split-layout {
          display: flex;
          min-height: 100vh;
        }
        .auth-photo-side {
          position: relative;
          flex: 0 0 60%;
          overflow: hidden;
        }
        .auth-photo-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        .auth-photo-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 31, 61, 0.75);
        }
        .auth-photo-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 48px 56px;
        }
        .auth-form-side {
          flex: 0 0 40%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
          overflow-y: auto;
        }
        .auth-form-inner {
          width: 100%;
          max-width: 380px;
        }
        .auth-mobile-logo {
          display: none;
          text-align: center;
          margin-bottom: 32px;
        }
        @media (max-width: 768px) {
          .auth-photo-side {
            display: none;
          }
          .auth-form-side {
            flex: 1;
            padding: 40px 20px;
          }
          .auth-mobile-logo {
            display: block;
          }
        }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ color: '#64748B' }}>Chargement...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
