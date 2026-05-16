'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

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

export default function CtaSection() {
  const { ref, visible } = useReveal()
  return (
    <section style={{ padding: '96px 24px', background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 60%, #7C3AED 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Background decorations */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

      <div
        ref={ref}
        style={{
          maxWidth: 680,
          margin: '0 auto',
          textAlign: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(32px)',
          transition: 'all 0.7s ease',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 999, padding: '6px 16px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.2)' }}>
          <span style={{ fontSize: 14 }}>🚀</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 }}>Essai gratuit · Sans carte bancaire</span>
        </div>

        <h2 style={{ fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 900, color: 'white', lineHeight: 1.15, margin: '0 0 20px', letterSpacing: '-0.5px' }}>
          Prêt à transformer votre cabinet ?
        </h2>

        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 40px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
          Rejoignez les kinésithérapeutes marocains qui gèrent leur cabinet avec KinéPro. 7 jours gratuits, aucune carte requise.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/register"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 36px', borderRadius: 12, fontSize: 16, fontWeight: 800,
              background: 'white', color: '#1E3A5F', textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)' }}
          >
            Commencer gratuitement <span style={{ fontSize: 18 }}>→</span>
          </Link>

          <Link
            href="#pricing"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '16px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
              background: 'rgba(255,255,255,0.12)', color: 'white', textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.3)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
          >
            Voir les tarifs
          </Link>
        </div>

        <p style={{ marginTop: 28, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          ✓ 7 jours gratuits &nbsp;·&nbsp; ✓ Annulation facile &nbsp;·&nbsp; ✓ Support FR/عربي
        </p>
      </div>
    </section>
  )
}
