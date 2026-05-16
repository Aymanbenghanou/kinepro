'use client'

import { useEffect, useRef, useState } from 'react'

function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setTimeout(() => setVisible(true), delay)
    }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [delay])
  return { ref, visible }
}

const steps = [
  {
    num: '01',
    emoji: '🏥',
    title: 'Créez votre cabinet',
    desc: 'Renseignez le nom de votre cabinet, votre adresse, vos praticiens et vos tarifs. 5 minutes chrono.',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    num: '02',
    emoji: '👥',
    title: 'Ajoutez vos patients',
    desc: 'Import depuis Excel, ou saisie rapide de la fiche patient. Historique, pathologie, ordonnances.',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    num: '03',
    emoji: '🚀',
    title: 'Automatisez tout',
    desc: 'Activez les rappels WhatsApp, la collecte de feedback et Google Avis. Votre cabinet tourne seul.',
    color: '#059669',
    bg: '#ECFDF5',
  },
]

export default function HowItWorks() {
  const { ref: headerRef, visible: headerVisible } = useReveal()

  return (
    <section id="how" style={{ padding: '96px 24px', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div ref={headerRef} style={{ textAlign: 'center', marginBottom: 64, opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Démarrage rapide</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#0F172A', margin: '0 auto 16px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Opérationnel en <span style={{ color: '#2563EB' }}>5 minutes</span>
          </h2>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 440, margin: '0 auto' }}>
            Pas de formation, pas de migration compliquée. Vous êtes productif dès le premier jour.
          </p>
        </div>

        <div className="how-grid">
          {/* Connector line */}
          <div className="how-connector" style={{ position: 'absolute', top: 48, left: '16.5%', right: '16.5%', height: 2, background: 'linear-gradient(90deg, #2563EB, #7C3AED, #059669)', opacity: 0.25, zIndex: 0 }} />

          {steps.map((step, i) => {
            const { ref, visible } = useReveal(i * 120)
            return (
              <div key={step.num} ref={ref} style={{ textAlign: 'center', position: 'relative', zIndex: 1, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: 'all 0.6s ease' }}>
                {/* Number badge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: step.bg, border: `3px solid ${step.color}25`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 6px ${step.color}08` }}>
                    <span style={{ fontSize: 28 }}>{step.emoji}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: step.color, letterSpacing: 2, marginBottom: 8 }}>ÉTAPE {step.num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 12px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <a href="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700,
            background: '#2563EB', color: 'white', textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(37,99,235,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 32px rgba(37,99,235,0.4)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 4px 24px rgba(37,99,235,0.3)' }}
          >
            Commencer maintenant — c'est gratuit <span>→</span>
          </a>
        </div>
      </div>
      <style>{`
        .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; position: relative; }
        @media(max-width:700px){
          .how-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .how-connector { display: none !important; }
        }
      `}</style>
    </section>
  )
}
