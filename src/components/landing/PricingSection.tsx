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

const plans = [
  {
    name: 'Essai gratuit',
    price: '0',
    period: '7 jours',
    desc: 'Toutes les fonctionnalités, sans engagement.',
    highlight: false,
    badge: null,
    color: '#2563EB',
    ctaText: 'Commencer gratuitement',
    ctaHref: '/register',
    features: [
      'Dossiers patients illimités',
      'Agenda + Praticiens',
      'WhatsApp automatisé',
      'Facturation MAD',
      'Analytics',
      'Support email',
    ],
  },
  {
    name: 'Annuel',
    price: '2 499',
    period: 'par an',
    desc: 'Économisez l\'équivalent de 2 mois.',
    highlight: true,
    badge: '🏆 Populaire',
    color: '#2563EB',
    ctaText: 'Choisir Annuel',
    ctaHref: '/register',
    features: [
      'Tout du plan Mensuel',
      '2 mois offerts',
      'Onboarding personnalisé',
      'Support prioritaire FR/عربي',
      'Formations vidéo',
      'Accès aux nouvelles fonctionnalités en avant-première',
    ],
  },
  {
    name: 'Mensuel',
    price: '299',
    period: 'par mois',
    desc: 'Sans engagement, résiliable à tout moment.',
    highlight: false,
    badge: null,
    color: '#7C3AED',
    ctaText: 'Choisir Mensuel',
    ctaHref: '/register',
    features: [
      'Dossiers patients illimités',
      'Agenda + Praticiens',
      'WhatsApp automatisé',
      'Google Avis automatique',
      'Facturation PDF MAD',
      'Support FR/عربي',
    ],
  },
]

function PricingCard({ plan, index }: { plan: typeof plans[0]; index: number }) {
  const [hovered, setHovered] = useState(false)
  const { ref, visible } = useReveal(index * 100)
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: plan.highlight ? 'linear-gradient(160deg, #1E3A5F, #2563EB)' : 'white',
        borderRadius: 20,
        padding: plan.highlight ? '32px 28px' : '28px 24px',
        border: plan.highlight
          ? 'none'
          : `1.5px solid ${hovered ? '#2563EB50' : '#E2E8F0'}`,
        boxShadow: plan.highlight
          ? '0 16px 64px rgba(37,99,235,0.4)'
          : hovered ? '0 8px 32px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: plan.highlight
          ? (visible ? 'translateY(-8px)' : 'translateY(24px)')
          : (visible ? (hovered ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(24px)'),
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {plan.highlight && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #60A5FA, #A78BFA)' }} />
      )}

      {plan.badge && (
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 16 }}>
          {plan.badge}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: plan.highlight ? 'rgba(255,255,255,0.75)' : '#64748B', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>
          {plan.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
          <span style={{ fontSize: 42, fontWeight: 900, color: plan.highlight ? 'white' : '#0F172A', lineHeight: 1 }}>
            {plan.price}
          </span>
          <span style={{ fontSize: 16, fontWeight: 500, color: plan.highlight ? 'rgba(255,255,255,0.6)' : '#64748B' }}>
            {plan.price === '0' ? '' : ' MAD'}
          </span>
          <span style={{ fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.5)' : '#94A3B8', marginLeft: 4 }}>
            / {plan.period}
          </span>
        </div>
        <p style={{ fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.6)' : '#64748B', margin: 0 }}>{plan.desc}</p>
      </div>

      <div style={{ height: 1, background: plan.highlight ? 'rgba(255,255,255,0.15)' : '#F1F5F9', marginBottom: 20 }} />

      <ul style={{ listStyle: 'none', margin: '0 0 28px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {plan.features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: plan.highlight ? 'rgba(255,255,255,0.85)' : '#374151' }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: plan.highlight ? 'rgba(255,255,255,0.2)' : '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: plan.highlight ? 'white' : '#16A34A', fontWeight: 700 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      <Link href={plan.ctaHref} style={{
        display: 'block', textAlign: 'center',
        padding: '12px 20px', borderRadius: 10,
        fontSize: 14, fontWeight: 700, textDecoration: 'none',
        background: plan.highlight ? 'white' : '#2563EB',
        color: plan.highlight ? '#1E3A5F' : 'white',
        transition: 'transform 0.15s, opacity 0.15s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
      >
        {plan.ctaText}
      </Link>
    </div>
  )
}

export default function PricingSection() {
  const { ref: headerRef, visible: headerVisible } = useReveal()
  return (
    <section id="pricing" style={{ padding: '96px 24px', background: 'white' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div ref={headerRef} style={{ textAlign: 'center', marginBottom: 56, opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Tarifs</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#0F172A', margin: '0 auto 16px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Tarifs simples et <span style={{ color: '#2563EB' }}>transparents</span>
          </h2>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 440, margin: '0 auto' }}>
            Commencez gratuitement. Aucune carte bancaire requise. Résiliez à tout moment.
          </p>
        </div>

        {/* Pricing cards — horizontal scroll on mobile */}
        <div className="pricing-scroll-wrapper">
          <div className="pricing-grid">
            {plans.map((p, i) => <PricingCard key={p.name} plan={p} index={i} />)}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', marginTop: 32 }}>
          Tous les prix sont en dirhams marocains (MAD) • Facturation annuelle ou mensuelle • Annulation sans frais
        </p>
      </div>
      <style>{`
        .pricing-scroll-wrapper {
          overflow: visible;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 780px) {
          .pricing-scroll-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 12px;
            margin: 0 -20px;
            padding: 0 20px 16px;
          }
          .pricing-grid {
            grid-template-columns: repeat(3, 280px);
            gap: 16px;
          }
        }
      `}</style>
    </section>
  )
}
