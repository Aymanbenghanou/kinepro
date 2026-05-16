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

const PHOTO_URL = 'https://res.cloudinary.com/djouneyaq/image/upload/v1778974291/POL_6607-950x600_b8jayx.jpg'

export default function HowItWorks() {
  const { ref: headerRef, visible: headerVisible } = useReveal()
  const { ref: photoRef, visible: photoVisible }   = useReveal(200)

  return (
    <section id="how" style={{ padding: '96px 24px', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div ref={headerRef} style={{ textAlign: 'center', marginBottom: 64, opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Démarrage rapide</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#0F172A', margin: '0 auto 16px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Opérationnel en <span style={{ color: '#2563EB' }}>5 minutes</span>
          </h2>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 440, margin: '0 auto' }}>
            Pas de formation, pas de migration compliquée. Vous êtes productif dès le premier jour.
          </p>
        </div>

        {/* Two-column layout: steps left, photo right */}
        <div className="how-layout">

          {/* Steps column */}
          <div className="how-steps">
            {steps.map((step, i) => {
              const { ref, visible } = useReveal(i * 120)
              return (
                <div key={step.num} ref={ref} style={{
                  display: 'flex', gap: 20, alignItems: 'flex-start',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateX(0)' : 'translateX(-24px)',
                  transition: 'all 0.6s ease',
                }}>
                  {/* Circle + connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: step.bg, border: `2px solid ${step.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 0 5px ${step.color}08`,
                    }}>
                      <span style={{ fontSize: 26 }}>{step.emoji}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 32, background: `linear-gradient(${step.color}, ${steps[i + 1].color})`, opacity: 0.2, margin: '6px 0' }} />
                    )}
                  </div>

                  {/* Text */}
                  <div style={{ paddingBottom: i < steps.length - 1 ? 32 : 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: step.color, letterSpacing: 2, marginBottom: 6 }}>ÉTAPE {step.num}</div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>{step.title}</h3>
                    <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
                  </div>
                </div>
              )
            })}

            {/* CTA */}
            <div style={{ marginTop: 40 }}>
              <a href="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
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

          {/* Photo column */}
          <div
            ref={photoRef}
            className="how-photo"
            style={{
              opacity: photoVisible ? 1 : 0,
              transform: photoVisible ? 'translateX(0) scale(1)' : 'translateX(32px) scale(0.97)',
              transition: 'all 0.8s ease',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHOTO_URL}
              alt="Séance de kinésithérapie — praticien et patient"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                borderRadius: 16,
                boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
              }}
            />
            {/* Subtle caption */}
            <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 12, fontStyle: 'italic' }}>
              Séance de kinésithérapie — suivi personnalisé
            </p>
          </div>

        </div>
      </div>

      <style>{`
        .how-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        .how-photo {
          height: 420px;
          border-radius: 16px;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .how-layout {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .how-photo {
            height: 260px;
            order: -1;
          }
        }
      `}</style>
    </section>
  )
}
