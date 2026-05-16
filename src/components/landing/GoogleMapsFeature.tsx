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

const rankings = [
  { pos: 1, name: 'Votre Cabinet', stars: 4.9, reviews: 89, highlight: true },
  { pos: 2, name: 'Cabinet concurrent',      stars: 4.2, reviews: 23, highlight: false },
  { pos: 3, name: 'Kiné centre-ville',       stars: 3.8, reviews: 11, highlight: false },
]

const steps = [
  { num: '1', label: 'Collez votre lien Google', icon: '🔗' },
  { num: '2', label: 'Patient reçoit WhatsApp',  icon: '💬' },
  { num: '3', label: 'Avis publié automatiquement',icon: '⭐' },
  { num: '4', label: 'Classement qui monte',     icon: '📈' },
]

export default function GoogleMapsFeature() {
  const { ref, visible } = useReveal()
  return (
    <section style={{ padding: '96px 24px', background: 'linear-gradient(135deg, #0F2747, #1E3A5F, #1D4ED8)', position: 'relative', overflow: 'hidden' }}>
      {/* Bg decoration */}
      <svg style={{ position: 'absolute', right: 0, top: 0, opacity: 0.05, pointerEvents: 'none' }} width="600" height="600" viewBox="0 0 600 600">
        <circle cx="400" cy="200" r="300" fill="white"/>
      </svg>

      <div ref={ref} id="googlemaps-inner" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'all 0.7s ease' }}>

        {/* Left — copy + steps */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 999, padding: '5px 14px', marginBottom: 20, border: '1px solid rgba(255,255,255,0.2)' }}>
            <span style={{ fontSize: 14 }}>📍</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Google Maps</span>
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900, color: 'white', lineHeight: 1.15, margin: '0 0 20px', letterSpacing: '-0.5px' }}>
            Classez votre cabinet<br/>
            <span style={{ color: '#FCD34D' }}>en tête sur Google Maps</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, margin: '0 0 40px' }}>
            KinéPro envoie automatiquement un message WhatsApp à vos patients satisfaits pour leur demander un avis Google. Plus d'avis = meilleur classement = plus de patients.
          </p>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {steps.map((s, i) => (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-20px)', transition: `all 0.5s ease ${0.2 + i * 0.1}s` }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                  {s.icon}
                </div>
                {i < 3 && <div style={{ position: 'absolute', marginTop: 56, marginLeft: 19, width: 1.5, height: 20, background: 'rgba(255,255,255,0.2)' }} />}
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginRight: 8 }}>Étape {s.num}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — fake Google Maps ranking widget */}
        <div>
          <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            {/* Map header */}
            <div style={{ background: '#E8F0FE', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #DADCE0' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#4285F4"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#3C4043' }}>Kinésithérapeute — Casablanca</span>
            </div>

            {/* Map placeholder */}
            <div style={{ height: 100, background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', position: 'relative', overflow: 'hidden' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }} viewBox="0 0 400 100">
                <path d="M0 50 Q50 20 100 50 T200 50 T300 50 T400 50" stroke="#4CAF50" strokeWidth="2" fill="none"/>
                <path d="M0 70 Q80 40 160 70 T320 70 T400 70" stroke="#81C784" strokeWidth="1.5" fill="none"/>
              </svg>
              {/* Pin markers */}
              <div style={{ position: 'absolute', top: 20, left: '30%', fontSize: 20, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>📍</div>
              <div style={{ position: 'absolute', top: 40, left: '55%', fontSize: 14, opacity: 0.6 }}>📍</div>
              <div style={{ position: 'absolute', top: 30, left: '75%', fontSize: 12, opacity: 0.4 }}>📍</div>
            </div>

            {/* Rankings */}
            <div style={{ padding: '8px 0' }}>
              {rankings.map((r) => (
                <div key={r.pos} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: r.highlight ? '#EFF6FF' : 'white',
                  borderLeft: r.highlight ? '3px solid #2563EB' : '3px solid transparent',
                  borderBottom: '1px solid #F1F5F9',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: r.highlight ? '#2563EB' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: r.highlight ? 'white' : '#64748B' }}>
                      {r.pos === 1 ? '🥇' : r.pos}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: r.highlight ? 700 : 500, color: r.highlight ? '#1E3A5F' : '#374151' }}>{r.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706' }}>{r.stars}</span>
                      <span style={{ color: '#F59E0B', fontSize: 10 }}>{'★'.repeat(Math.round(r.stars))}</span>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>({r.reviews} avis)</span>
                    </div>
                  </div>
                  {r.highlight && (
                    <div style={{ background: '#2563EB', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>VOUS</div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 16px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#64748B' }}>Résultat : </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>+18 nouveaux patients ce mois</span>
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){#googlemaps-inner{grid-template-columns:1fr!important;gap:40px!important;padding:0 4px;}}`}</style>
    </section>
  )
}
