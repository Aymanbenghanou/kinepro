'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

const PHOTO_URL =
  'https://res.cloudinary.com/djouneyaq/image/upload/v1778974291/cover-kinestherapie-sport-paris-institut-kinesitherapieV2.jpg_atyja5.webp'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #E2E8F0', borderRadius: 10,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
  color: '#0F172A', background: 'white',
}

type Step1 = { nom: string; ville: string; telephone: string; email: string }
type Step2 = { nom: string; prenom: string; email: string; password: string; confirm: string }

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [s1, setS1] = useState<Step1>({ nom: '', ville: '', telephone: '', email: '' })
  const [s2, setS2] = useState<Step2>({ nom: '', prenom: '', email: '', password: '', confirm: '' })

  function validateStep1(): string | null {
    if (!s1.nom.trim())       return 'Le nom du cabinet est requis'
    if (!s1.ville.trim())     return 'La ville est requise'
    if (!s1.email.trim())     return "L'email du cabinet est requis"
    if (!s1.telephone.trim()) return 'Le téléphone est requis'
    return null
  }

  function validateStep2(): string | null {
    if (!s2.prenom.trim()) return 'Le prénom est requis'
    if (!s2.nom.trim())    return 'Le nom est requis'
    if (!s2.email.trim())  return "L'email est requis"
    if (!s2.password)      return 'Le mot de passe est requis'
    if (s2.password.length < 8) return 'Le mot de passe doit avoir au moins 8 caractères'
    if (s2.password !== s2.confirm) return 'Les mots de passe ne correspondent pas'
    return null
  }

  function nextStep() {
    setError('')
    const err = validateStep1()
    if (err) { setError(err); return }
    if (!s2.email) setS2(s => ({ ...s, email: s1.email }))
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const err = validateStep2()
    if (err) { setError(err); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabinet: s1, admin: s2 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'inscription")

      const { signIn } = await import('next-auth/react')
      await signIn('credentials', {
        email: s2.email,
        password: s2.password,
        redirect: false,
      })
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur serveur')
    }
    setLoading(false)
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
              Démarrez votre cabinet<br />
              <span style={{ background: 'linear-gradient(90deg, #60A5FA, #4ADE80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                en 5 minutes.
              </span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.65, margin: '0 0 36px', maxWidth: 360 }}>
              Rejoignez les kinés marocains qui gèrent leur cabinet intelligemment avec KinéPro.
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '📅', text: 'Agenda et prise de RDV en ligne' },
                { icon: '💬', text: 'Rappels automatiques WhatsApp' },
                { icon: '⭐', text: 'Collecte d\'avis Google automatisée' },
              ].map(b => (
                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                    {b.icon}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{b.text}</span>
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
              <span style={{ color: 'white', fontSize: 20, fontWeight: 800 }}>K</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>Créer votre cabinet</h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>7 jours d'essai gratuit · Aucune carte bancaire</p>
          </div>

          {/* Desktop heading */}
          <div className="auth-desktop-heading" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>Créer votre cabinet</h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>7 jours d'essai gratuit · Aucune carte bancaire</p>
          </div>

          {/* Progress indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
            {[
              { n: 1, label: 'Cabinet' },
              { n: 2, label: 'Compte admin' },
            ].map((s, i) => (
              <div key={s.n} style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
                {i > 0 && (
                  <div style={{ position: 'absolute', left: 0, top: '50%', width: '100%', height: 2, background: step >= s.n ? '#2563EB' : '#E2E8F0', zIndex: 0, transform: 'translateY(-50%)' }} />
                )}
                <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: step > s.n ? '#2563EB' : step === s.n ? '#EFF6FF' : '#F8FAFC',
                    border: `2px solid ${step >= s.n ? '#2563EB' : '#E2E8F0'}`,
                    fontWeight: 700, fontSize: 14,
                  }}>
                    {step > s.n ? <Check size={14} color="white" /> : <span style={{ color: step === s.n ? '#2563EB' : '#94A3B8' }}>{s.n}</span>}
                  </div>
                  <span style={{ fontSize: 11, color: step === s.n ? '#2563EB' : '#94A3B8', fontWeight: step === s.n ? 600 : 400, marginTop: 4, whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#B91C1C', display: 'flex', gap: 8 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>🏥 Informations du cabinet</h3>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nom du cabinet *</label>
                <input value={s1.nom} onChange={e => setS1(s => ({ ...s, nom: e.target.value }))} placeholder="Cabinet Amrani - Kinésithérapie" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Ville *</label>
                <input value={s1.ville} onChange={e => setS1(s => ({ ...s, ville: e.target.value }))} placeholder="Casablanca" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Téléphone *</label>
                <input value={s1.telephone} onChange={e => setS1(s => ({ ...s, telephone: e.target.value }))} placeholder="0522-456-789" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email du cabinet *</label>
                <input type="email" value={s1.email} onChange={e => setS1(s => ({ ...s, email: e.target.value }))} placeholder="contact@cabinet.ma" style={inputStyle} />
              </div>
              <button onClick={nextStep}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 }}>
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>👤 Compte administrateur</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Prénom *</label>
                  <input value={s2.prenom} onChange={e => setS2(s => ({ ...s, prenom: e.target.value }))} placeholder="Ahmed" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nom *</label>
                  <input value={s2.nom} onChange={e => setS2(s => ({ ...s, nom: e.target.value }))} placeholder="Amrani" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email de connexion *</label>
                <input type="email" value={s2.email} onChange={e => setS2(s => ({ ...s, email: e.target.value }))} placeholder="ahmed@cabinet.ma" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Mot de passe *</label>
                <input type="password" value={s2.password} onChange={e => setS2(s => ({ ...s, password: e.target.value }))} placeholder="Min. 8 caractères" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Confirmer le mot de passe *</label>
                <input type="password" value={s2.confirm} onChange={e => setS2(s => ({ ...s, confirm: e.target.value }))} placeholder="Répétez le mot de passe" style={inputStyle} />
              </div>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 12, display: 'flex', gap: 10 }}>
                <span>🎉</span>
                <div style={{ fontSize: 13, color: '#166534' }}>
                  <strong>7 jours d'essai gratuit</strong> — Accès complet, sans engagement.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setStep(1); setError('') }}
                  style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 4, padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: 10, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#374151' }}>
                  <ChevronLeft size={16} /> Retour
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: '12px', background: loading ? '#93C5FD' : '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Création...' : 'Créer mon cabinet →'}
                </button>
              </div>
            </form>
          )}

          <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 20 }}>
            Déjà un compte ?{' '}
            <Link href="/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
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
          padding: 40px 32px;
          overflow-y: auto;
        }
        .auth-form-inner {
          width: 100%;
          max-width: 400px;
        }
        .auth-mobile-logo {
          display: none;
          text-align: center;
          margin-bottom: 24px;
        }
        .auth-desktop-heading {
          display: block;
        }
        @media (max-width: 768px) {
          .auth-photo-side {
            display: none;
          }
          .auth-form-side {
            flex: 1;
            padding: 32px 20px;
          }
          .auth-mobile-logo {
            display: block;
          }
          .auth-desktop-heading {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
