'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

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
        // Could be 2FA needed — try to determine
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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #EFF6FF 100%)',
    }}>
      <div style={{ width: 420, padding: '0 16px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: '#2563EB', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}>
            <span style={{ color: 'white', fontSize: 24, fontWeight: 800 }}>K</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>KinéPro</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>Logiciel de gestion de cabinet</p>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
            {step === 'totp' ? 'Vérification 2FA' : 'Connexion'}
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 24px' }}>
            {step === 'totp'
              ? 'Entrez le code de votre application d\'authentification'
              : 'Accédez à votre espace de gestion'}
          </p>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#B91C1C', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                padding: '12px', background: loading ? '#93C5FD' : '#2563EB',
                color: 'white', border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4, transition: 'background 0.2s',
              }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', margin: '20px 0 0' }}>
            Pas encore de compte ?{' '}
            <Link href="/register" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
              Créer un cabinet
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 20 }}>
          © 2026 KinéPro · Logiciel de gestion de cabinet
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #EFF6FF 100%)' }}><div style={{ color: '#64748B' }}>Chargement...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}
