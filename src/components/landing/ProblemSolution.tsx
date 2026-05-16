'use client'

import { useEffect, useRef, useState } from 'react'

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function useCounter(target: number, visible: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!visible) return
    const duration = 1800
    const step = 16
    const increment = (target / (duration / step))
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      setCount(Math.round(current))
      if (current >= target) clearInterval(timer)
    }, step)
    return () => clearInterval(timer)
  }, [visible, target])
  return count
}

const rows = [
  { before: 'Dossiers papier perdus',          after: 'Dossier patient digital complet' },
  { before: '20% de no-shows par mois',         after: 'Rappels WhatsApp automatiques' },
  { before: 'Invisible sur Google Maps',        after: 'Top 3 Google Maps garanti' },
  { before: 'Factures griffonnées à la main',   after: 'PDF automatiques en MAD' },
  { before: 'Aucune visibilité sur les revenus', after: 'Dashboard temps réel' },
]

export default function ProblemSolution() {
  const { ref, visible } = useReveal()
  const counter = useCounter(80, visible)

  return (
    <section id="problem" style={{ padding: '96px 24px', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div ref={ref} style={{ textAlign: 'center', marginBottom: 56, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Le problème</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#0F172A', lineHeight: 1.2, margin: '0 auto 20px', maxWidth: 640, letterSpacing: '-0.5px' }}>
            Votre cabinet mérite mieux<br />
            <span style={{ color: '#2563EB' }}>qu'Excel et WhatsApp personnel</span>
          </h2>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 480, margin: '0 auto' }}>
            Arrêtez de perdre du temps sur des outils inadaptés. Voici ce que KinéPro change concrètement.
          </p>
        </div>

        {/* Comparison table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 48, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'all 0.7s ease 0.1s' }}>
          {/* Before */}
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #FCA5A5', overflow: 'hidden' }}>
            <div style={{ background: '#FEF2F2', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #FCA5A5' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>✗</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#B91C1C' }}>Avant KinéPro</div>
                <div style={{ fontSize: 11, color: '#EF4444' }}>La galère quotidienne</div>
              </div>
            </div>
            <div style={{ padding: '8px 0' }}>
              {rows.map(r => (
                <div key={r.before} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: '1px solid #FFF1F1' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>❌</span>
                  <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.4 }}>{r.before}</span>
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #86EFAC', overflow: 'hidden' }}>
            <div style={{ background: '#F0FDF4', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #86EFAC' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>✓</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#15803D' }}>Avec KinéPro</div>
                <div style={{ fontSize: 11, color: '#16A34A' }}>La solution professionnelle</div>
              </div>
            </div>
            <div style={{ padding: '8px 0' }}>
              {rows.map(r => (
                <div key={r.after} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: '1px solid #F0FDF4' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>
                  <span style={{ fontSize: 14, color: '#374151', fontWeight: 500, lineHeight: 1.4 }}>{r.after}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated stat */}
        <div style={{ textAlign: 'center', opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.9)', transition: 'all 0.6s ease 0.3s' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: 'linear-gradient(135deg, #1E3A5F, #2563EB)', borderRadius: 20, padding: '24px 48px', boxShadow: '0 8px 40px rgba(37,99,235,0.3)' }}>
            <div style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 900, color: 'white', lineHeight: 1 }}>
              -{counter}%
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>de no-shows</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>grâce aux rappels WhatsApp</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          #problem > div > div:nth-child(2) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
