'use client'

import { useEffect, useRef, useState } from 'react'

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

const features = [
  {
    color: '#2563EB',
    bg: '#EFF6FF',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="28" rx="3" fill="#2563EB" opacity=".15"/>
        <rect x="8" y="9" width="8" height="1.5" rx=".75" fill="#2563EB"/>
        <rect x="8" y="13" width="12" height="1.5" rx=".75" fill="#2563EB" opacity=".6"/>
        <rect x="8" y="17" width="10" height="1.5" rx=".75" fill="#2563EB" opacity=".6"/>
        <rect x="8" y="21" width="7" height="1.5" rx=".75" fill="#2563EB" opacity=".4"/>
        <circle cx="22" cy="10" r="5" fill="#2563EB"/>
        <path d="M20 10l1.5 1.5L24 8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Dossier Patient',
    desc: 'Radio, ordonnances, historique complet des séances. Tout centralisé, accessible en un clic.',
  },
  {
    color: '#7C3AED',
    bg: '#F5F3FF',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="3" y="7" width="26" height="22" rx="3" fill="#7C3AED" opacity=".12"/>
        <rect x="3" y="7" width="26" height="6" rx="3" fill="#7C3AED" opacity=".25"/>
        <rect x="10" y="3" width="3" height="8" rx="1.5" fill="#7C3AED"/>
        <rect x="19" y="3" width="3" height="8" rx="1.5" fill="#7C3AED"/>
        <rect x="7" y="18" width="4" height="4" rx="1" fill="#7C3AED" opacity=".6"/>
        <rect x="14" y="18" width="4" height="4" rx="1" fill="#7C3AED"/>
        <rect x="21" y="18" width="4" height="4" rx="1" fill="#7C3AED" opacity=".4"/>
      </svg>
    ),
    title: 'Agenda Intelligent',
    desc: 'Calendrier visuel par praticien, gestion des créneaux, vue journalière et hebdomadaire.',
  },
  {
    color: '#059669',
    bg: '#ECFDF5',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="13" fill="#059669" opacity=".12"/>
        <path d="M21.472 19.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606l.446-.52c.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#059669"/>
      </svg>
    ),
    title: 'WhatsApp Automatisé',
    desc: 'Rappels, confirmations de RDV, et feedback post-séance. Vos patients restent engagés.',
  },
  {
    color: '#D97706',
    bg: '#FFFBEB',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="13" fill="#D97706" opacity=".12"/>
        <path d="M16 8l2.09 4.26L23 13.27l-3.5 3.41.83 4.82L16 19.27l-4.33 2.23.83-4.82L9 13.27l4.91-.71L16 8z" fill="#D97706"/>
      </svg>
    ),
    title: 'Réputation Google',
    desc: 'Collecte automatique des avis après chaque séance réussie. Grimpez dans Google Maps.',
  },
  {
    color: '#DC2626',
    bg: '#FEF2F2',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="5" y="6" width="22" height="20" rx="3" fill="#DC2626" opacity=".12"/>
        <rect x="9" y="11" width="14" height="1.5" rx=".75" fill="#DC2626" opacity=".5"/>
        <rect x="9" y="15" width="10" height="1.5" rx=".75" fill="#DC2626" opacity=".5"/>
        <rect x="9" y="19" width="7" height="1.5" rx=".75" fill="#DC2626" opacity=".5"/>
        <path d="M20 20l5-5-5-5" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
        <path d="M25 15H14" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Facturation MAD',
    desc: 'PDF automatiques en dirhams, suivi des paiements, relances automatiques pour les impayés.',
  },
  {
    color: '#0D9488',
    bg: '#F0FDFA',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="20" width="4" height="8" rx="1.5" fill="#0D9488"/>
        <rect x="10" y="14" width="4" height="14" rx="1.5" fill="#0D9488" opacity=".8"/>
        <rect x="16" y="17" width="4" height="11" rx="1.5" fill="#0D9488" opacity=".6"/>
        <rect x="22" y="9"  width="4" height="19" rx="1.5" fill="#0D9488"/>
        <path d="M5 20 L12 14 L18 17 L25 9" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="5"  cy="20" r="2.5" fill="#0D9488"/>
        <circle cx="12" cy="14" r="2.5" fill="#0D9488"/>
        <circle cx="18" cy="17" r="2.5" fill="#0D9488"/>
        <circle cx="25" cy="9"  r="2.5" fill="#0D9488"/>
      </svg>
    ),
    title: 'Analytics Temps Réel',
    desc: 'Revenus, patients, taux de présence, évolution mensuelle. Pilotez votre cabinet avec data.',
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [hovered, setHovered] = useState(false)
  const { ref, visible } = useReveal(index * 80)
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        borderRadius: 16,
        padding: '28px 24px',
        border: `1.5px solid ${hovered ? feature.color + '50' : '#E2E8F0'}`,
        boxShadow: hovered ? `0 8px 32px ${feature.color}18` : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : visible ? 'translateY(0)' : 'translateY(24px)',
        opacity: visible ? 1 : 0,
        cursor: 'default',
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 14, background: feature.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        {feature.icon}
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 10px' }}>{feature.title}</h3>
      <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: 0 }}>{feature.desc}</p>
    </div>
  )
}

export default function FeaturesSection() {
  const { ref: headerRef, visible: headerVisible } = useReveal()
  return (
    <section id="features" style={{ padding: '96px 24px', background: 'white' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div ref={headerRef} style={{ textAlign: 'center', marginBottom: 56, opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Fonctionnalités</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#0F172A', margin: '0 auto 16px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Tout ce qu'il vous faut,<br />dans un seul outil
          </h2>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 500, margin: '0 auto' }}>
            Conçu spécifiquement pour les kinésithérapeutes marocains, avec chaque fonctionnalité pensée pour votre métier.
          </p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </div>
      <style>{`
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        @media(max-width:900px){ .features-grid { grid-template-columns: repeat(2,1fr)!important; } }
        @media(max-width:580px){ .features-grid { grid-template-columns: 1fr!important; } }
      `}</style>
    </section>
  )
}
