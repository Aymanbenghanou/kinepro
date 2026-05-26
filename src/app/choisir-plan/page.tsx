'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

type Cycle = 'monthly' | 'annual'

const STARTER_FEATURES = [
  'Dossiers patients', 'Agenda', 'Séances', 'Facturation',
  'Rappels WhatsApp', 'Réservation en ligne', 'Rapports',
]
const PRO_EXTRA = ["Programmes d'exercices IA", 'Upload de documents']

const plans = [
  { name: 'Starter', tagline: "L'essentiel pour gérer votre cabinet", monthly: 299, annual: 2990, recommended: false, included: STARTER_FEATURES, locked: PRO_EXTRA },
  { name: 'Pro',     tagline: 'Pour les cabinets qui veulent aller plus loin', monthly: 499, annual: 4990, recommended: true, included: [...STARTER_FEATURES, ...PRO_EXTRA], locked: [] },
]

function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function ChoisirPlanPage() {
  const router = useRouter()
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Choix d'un plan → crée une DemandeAbonnement "en_attente" puis redirige vers /abonnement.
  async function choisir(planName: string) {
    setSubmitting(planName); setError(null)
    try {
      const res = await fetch('/api/abonnement/demande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName.toLowerCase(), billingCycle: cycle }),
      })
      if (!res.ok) throw new Error()
      router.push('/abonnement')   // on garde submitting actif pendant la navigation
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
      setSubmitting(null)
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px' }}>
      <div style={{ width: '100%', maxWidth: 880 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, background: '#2563EB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>K</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1E3A5F' }}>KinéPro</span>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: '#0F172A', margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Votre essai gratuit est terminé
          </h1>
          <p style={{ fontSize: 16, color: '#64748B', margin: 0 }}>Choisissez un plan pour continuer.</p>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', background: '#EFF6FF', borderRadius: 999, padding: 4 }}>
            {(['monthly', 'annual'] as Cycle[]).map(c => (
              <button key={c} onClick={() => setCycle(c)} style={{
                border: 'none', cursor: 'pointer', padding: '8px 20px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                background: cycle === c ? '#2563EB' : 'transparent', color: cycle === c ? 'white' : '#64748B', transition: 'all 0.2s ease',
              }}>
                {c === 'monthly' ? 'Mensuel' : 'Annuel'}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', background: '#DCFCE7', borderRadius: 999, padding: '4px 10px', opacity: cycle === 'annual' ? 1 : 0.55, transition: 'opacity 0.2s ease' }}>
            2 mois offerts
          </span>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 12, padding: '12px 16px', fontSize: 14, textAlign: 'center', marginBottom: 24, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Cards */}
        <div className="cp-grid">
          {plans.map(plan => {
            const reco = plan.recommended
            const priceLabel = cycle === 'monthly' ? `${fmt(plan.monthly)} DH / mois` : `${fmt(plan.annual)} DH / an`
            return (
              <div key={plan.name} style={{
                background: 'white', borderRadius: 20, padding: '32px 28px',
                border: reco ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
                boxShadow: reco ? '0 16px 48px rgba(37,99,235,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
                position: 'relative',
              }}>
                {reco && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#2563EB', color: 'white', borderRadius: 999, padding: '4px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}>
                    Recommandé
                  </div>
                )}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748B', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.5px' }}>{priceLabel}</span>
                  {cycle === 'annual' && (
                    <span style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>2 mois offerts</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 22px' }}>{plan.tagline}</p>
                <div style={{ height: 1, background: '#F1F5F9', marginBottom: 20 }} />
                <ul style={{ listStyle: 'none', margin: '0 0 28px', padding: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {plan.included.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: '#16A34A', fontWeight: 800 }}>✓</span>
                      {f}
                    </li>
                  ))}
                  {plan.locked.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#94A3B8' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 800 }}>🔒</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => choisir(plan.name)} disabled={submitting !== null} style={{
                  display: 'block', width: '100%', textAlign: 'center',
                  cursor: submitting !== null ? 'not-allowed' : 'pointer',
                  padding: '13px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: reco ? '#2563EB' : 'white', color: reco ? 'white' : '#2563EB',
                  border: reco ? '2px solid #2563EB' : '2px solid #DBEAFE', transition: 'opacity 0.15s',
                  opacity: submitting !== null && submitting !== plan.name ? 0.6 : 1,
                }}>
                  {submitting === plan.name ? 'Envoi…' : `Choisir ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Logout — un utilisateur muré peut toujours se déconnecter */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 14, textDecoration: 'underline' }}>
            Se déconnecter
          </button>
        </div>
      </div>

      <style>{`
        .cp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; align-items: start; }
        @media (max-width: 768px) { .cp-grid { grid-template-columns: 1fr; gap: 28px; max-width: 380px; margin: 0 auto; } }
      `}</style>
    </div>
  )
}
