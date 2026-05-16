'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

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
    if (!s1.email.trim())     return 'L\'email du cabinet est requis'
    if (!s1.telephone.trim()) return 'Le téléphone est requis'
    return null
  }

  function validateStep2(): string | null {
    if (!s2.prenom.trim()) return 'Le prénom est requis'
    if (!s2.nom.trim())    return 'Le nom est requis'
    if (!s2.email.trim())  return 'L\'email est requis'
    if (!s2.password)      return 'Le mot de passe est requis'
    if (s2.password.length < 8) return 'Le mot de passe doit avoir au moins 8 caractères'
    if (s2.password !== s2.confirm) return 'Les mots de passe ne correspondent pas'
    return null
  }

  function nextStep() {
    setError('')
    const err = validateStep1()
    if (err) { setError(err); return }
    // Pre-fill admin email from cabinet email
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
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'inscription')

      // Auto-login
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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #EFF6FF 100%)',
      padding: '24px 16px',
    }}>
      <div style={{ width: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, background: '#2563EB', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}>
            <span style={{ color: 'white', fontSize: 20, fontWeight: 800 }}>K</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>Créer votre cabinet</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>7 jours d'essai gratuit · Aucune carte bancaire</p>
        </div>

        {/* Progress */}
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

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0' }}>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#B91C1C', display: 'flex', gap: 8 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>🏥 Informations du cabinet</h2>
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
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 4 }}>
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>👤 Compte administrateur</h2>
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
              {/* Trial notice */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 12, display: 'flex', gap: 10 }}>
                <span>🎉</span>
                <div style={{ fontSize: 13, color: '#166534' }}>
                  <strong>7 jours d'essai gratuit</strong> — Accès complet à toutes les fonctionnalités, sans engagement.
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
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748B', marginTop: 16 }}>
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
