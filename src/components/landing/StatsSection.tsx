'use client'

import { useEffect, useRef, useState } from 'react'

// Même pattern de révélation au scroll que les autres sections (trigger once).
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

// Séparateur de milliers par espace : 5000 → "5 000"
function thousands(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Compteur 0 → target sur ~1,5 s quand visible. Respecte prefers-reduced-motion
// (affichage immédiat de la valeur finale, sans animation).
function Counter({ target, visible, format, prefix = '', suffix = '', delay = 0 }: {
  target: number; visible: boolean
  format?: (n: number) => string; prefix?: string; suffix?: string; delay?: number
}) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!visible) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setVal(target); return }

    let raf = 0
    let startTs = 0
    const duration = 1500
    const step = (ts: number) => {
      if (!startTs) startTs = ts
      const p = Math.min(1, (ts - startTs) / duration)
      const eased = 1 - Math.pow(1 - p, 3)         // easeOutCubic
      setVal(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(step)
      else setVal(target)
    }
    const to = setTimeout(() => { raf = requestAnimationFrame(step) }, delay)
    return () => { clearTimeout(to); cancelAnimationFrame(raf) }
  }, [visible, target, delay])

  return <>{prefix}{format ? format(val) : String(val)}{suffix}</>
}

export default function StatsSection({ cabinets, rdv }: { cabinets: number; rdv: number }) {
  const { ref: headRef, visible: headVisible } = useReveal()
  const { ref: rowRef, visible: rowVisible }   = useReveal(150)

  // Plancher à 5 000, mais on garde le vrai chiffre s'il est déjà plus haut.
  const rdvTarget = Math.max(rdv, 5000)

  const cards = [
    { node: <Counter target={cabinets} visible={rowVisible} suffix="+" />,                       label: 'Cabinets nous font confiance' },
    { node: <Counter target={rdvTarget} visible={rowVisible} format={thousands} delay={120} />,   label: 'Rendez-vous gérés' },
    { node: <Counter target={80} visible={rowVisible} prefix="jusqu'à " suffix="%" delay={240} />, label: 'de no-shows en moins' },
  ]

  return (
    <section id="stats" style={{ padding: '96px 24px', background: '#EFF6FF' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div ref={headRef} style={{
          textAlign: 'center', marginBottom: 56,
          opacity: headVisible ? 1 : 0,
          transform: headVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.6s ease',
        }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#0F172A', margin: '0 auto 16px', letterSpacing: '-0.5px', lineHeight: 1.2, maxWidth: 720 }}>
            Rejoignez les <span style={{ color: '#2563EB' }}>137 kinés</span> qui ont modernisé leur cabinet
          </h2>
          <p style={{ fontSize: 16, color: '#64748B', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Moins d&apos;administratif, plus de temps pour vos patients — et des performances qui suivent.
          </p>
        </div>

        {/* Stat cards */}
        <div ref={rowRef} className="stats-row">
          {cards.map((c, i) => (
            <div key={i} className="stat-card" style={{
              opacity: rowVisible ? 1 : 0,
              transform: rowVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: `all 0.6s ease ${i * 0.1}s`,
            }}>
              <div style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 900, color: '#1E3A5F', letterSpacing: '-1px', lineHeight: 1 }}>
                {c.node}
              </div>
              <div style={{ fontSize: 15, color: '#64748B', marginTop: 10, fontWeight: 500 }}>{c.label}</div>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .stat-card {
          background: white;
          border: 1px solid #DBEAFE;
          border-radius: 16px;
          padding: 36px 24px;
          text-align: center;
          box-shadow: 0 4px 24px rgba(30,58,95,0.06);
        }
        @media (max-width: 768px) {
          .stats-row { grid-template-columns: 1fr !important; gap: 16px !important; max-width: 360px; margin: 0 auto; }
        }
      `}</style>
    </section>
  )
}
