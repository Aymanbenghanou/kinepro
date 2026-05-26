'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setTimeout(() => setVisible(true), delay)
    }, { threshold: 0.12 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [delay])
  return { ref, visible }
}

type Cycle = 'monthly' | 'annual'

const STARTER_FEATURES = [
  'Dossiers patients', 'Agenda', 'Séances', 'Facturation',
  'Rappels WhatsApp', 'Réservation en ligne', 'Rapports',
]
const PRO_EXTRA = ["Programmes d'exercices IA", 'Upload de documents']

const plans = [
  {
    name: 'Starter',
    tagline: "L'essentiel pour gérer votre cabinet",
    monthly: 299,
    annual: 2990,
    recommended: false,
    included: STARTER_FEATURES,
    locked: PRO_EXTRA,
  },
  {
    name: 'Pro',
    tagline: 'Pour les cabinets qui veulent aller plus loin',
    monthly: 499,
    annual: 4990,
    recommended: true,
    included: [...STARTER_FEATURES, ...PRO_EXTRA],
    locked: [],
  },
]

function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function PriceCard({ plan, cycle, index }: { plan: typeof plans[0]; cycle: Cycle; index: number }) {
  const { ref, visible } = useReveal(index * 100)
  const reco = plan.recommended
  const priceLabel = cycle === 'monthly'
    ? `${fmt(plan.monthly)} DH / mois`
    : `${fmt(plan.annual)} DH / an`

  return (
    <div ref={ref} style={{
      background: 'white',
      borderRadius: 20,
      padding: '32px 28px',
      border: reco ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
      boxShadow: reco ? '0 16px 48px rgba(37,99,235,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
      position: 'relative',
      opacity: visible ? 1 : 0,
      transform: visible ? (reco ? 'translateY(-8px)' : 'translateY(0)') : 'translateY(24px)',
      transition: 'all 0.5s ease',
    }}>
      {reco && (
        <div style={{
          position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
          background: '#2563EB', color: 'white', borderRadius: 999,
          padding: '4px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
        }}>
          Recommandé
        </div>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748B', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>
        {plan.name}
      </h3>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 34, fontWeight: 900, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.5px' }}>
          {priceLabel}
        </span>
        {cycle === 'annual' && (
          <span style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
            2 mois offerts
          </span>
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
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: '#94A3B8', fontWeight: 800 }}>🔒</span>
            {f}
          </li>
        ))}
      </ul>

      <Link href="/register" style={{
        display: 'block', textAlign: 'center',
        padding: '13px 20px', borderRadius: 10,
        fontSize: 14, fontWeight: 700, textDecoration: 'none',
        background: reco ? '#2563EB' : 'white',
        color: reco ? 'white' : '#2563EB',
        border: reco ? '2px solid #2563EB' : '2px solid #DBEAFE',
        transition: 'opacity 0.15s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
      >
        Commencer l&apos;essai gratuit
      </Link>
    </div>
  )
}

export default function Pricing() {
  const { ref: headerRef, visible: headerVisible } = useReveal()
  const [cycle, setCycle] = useState<Cycle>('monthly')

  return (
    <section id="pricing" style={{ padding: '96px 24px', background: 'white' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>

        {/* Header */}
        <div ref={headerRef} style={{ textAlign: 'center', marginBottom: 36, opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Tarifs</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#0F172A', margin: '0 auto', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Des tarifs simples et <span style={{ color: '#2563EB' }}>transparents</span>
          </h2>
        </div>

        {/* Monthly / Annual toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 44 }}>
          <div style={{ display: 'inline-flex', background: '#EFF6FF', borderRadius: 999, padding: 4 }}>
            {(['monthly', 'annual'] as Cycle[]).map(c => (
              <button key={c} onClick={() => setCycle(c)} style={{
                border: 'none', cursor: 'pointer',
                padding: '8px 20px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                background: cycle === c ? '#2563EB' : 'transparent',
                color: cycle === c ? 'white' : '#64748B',
                transition: 'all 0.2s ease',
              }}>
                {c === 'monthly' ? 'Mensuel' : 'Annuel'}
              </button>
            ))}
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#16A34A',
            background: '#DCFCE7', borderRadius: 999, padding: '4px 10px',
            opacity: cycle === 'annual' ? 1 : 0.55, transition: 'opacity 0.2s ease',
          }}>
            2 mois offerts
          </span>
        </div>

        {/* Cards */}
        <div className="pricing2-grid">
          {plans.map((p, i) => <PriceCard key={p.name} plan={p} cycle={cycle} index={i} />)}
        </div>

        {/* Small print */}
        <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', marginTop: 32 }}>
          7 jours d&apos;essai gratuit • Sans carte bancaire • Annulable à tout moment
        </p>
      </div>

      <style>{`
        .pricing2-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .pricing2-grid { grid-template-columns: 1fr; gap: 28px; max-width: 380px; margin: 0 auto; }
        }
      `}</style>
    </section>
  )
}
