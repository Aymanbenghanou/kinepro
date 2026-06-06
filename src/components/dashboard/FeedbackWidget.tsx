'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

/**
 * Carte dashboard read-only : compte des séances dont le feedback est
 * "prêt à envoyer" (token public généré immédiatement à la finalisation
 * de la séance). Tout envoi WhatsApp se fait depuis le WhatsApp Center
 * (`/whatsapp?tab=ready`) — cette carte ne fait que rediriger.
 */
export default function FeedbackWidget() {
  const [readyCount, setReadyCount]   = useState(0)
  const [pending, setPending]         = useState(0)
  const [avgScore, setAvgScore]       = useState<number | null>(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/feedback/ready')
        if (res.ok) {
          const data = await res.json()
          setReadyCount(Array.isArray(data) ? data.length : 0)
        }
        const statsRes = await fetch('/api/dashboard/feedback-stats')
        if (statsRes.ok) {
          const stats = await statsRes.json()
          setPending(stats.pending ?? 0)
          setAvgScore(stats.avgScore ?? null)
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="dash-card dash-card-violet" style={{ padding: 22 }}>
        <div className="dash-card__head">
          <h2 className="dash-card__title">
            <span className="dash-card__title-emoji" aria-hidden>⭐</span>
            Feedback patients
          </h2>
          <span className="dash-skeleton" style={{ width: 140, height: 14 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="dash-skeleton" style={{ height: 64 }} />
          ))}
        </div>
        <div className="dash-skeleton" style={{ height: 38, borderRadius: 10 }} />
      </div>
    )
  }

  return (
    <div className="dash-card dash-card-violet" style={{ padding: 22 }}>
      <div className="dash-card__head">
        <h2 className="dash-card__title">
          <span className="dash-card__title-emoji" aria-hidden>⭐</span>
          Feedback patients
        </h2>
        <Link href="/whatsapp?tab=ready" className="dash-link">
          Ouvrir WhatsApp Center <span className="dash-link__arrow">→</span>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div className="dash-kpi" style={kpiBg('#F5F3FF', '#A78BFA', '#7C3AED')}>
          <p className="dash-kpi__value" style={{ color: '#6D28D9' }}>{readyCount}</p>
          <p className="dash-kpi__label" style={{ color: '#6D28D9' }}>Prêts à envoyer</p>
        </div>
        <div className="dash-kpi" style={kpiBg('#FEF3C7', '#FCD34D', '#D97706')}>
          <p className="dash-kpi__value" style={{ color: '#B45309' }}>{pending}</p>
          <p className="dash-kpi__label" style={{ color: '#B45309' }}>En préparation</p>
        </div>
        <div className="dash-kpi" style={kpiBg('#DCFCE7', '#86EFAC', '#16A34A')}>
          <p className="dash-kpi__value" style={{ color: '#15803D' }}>
            {avgScore !== null ? avgScore.toFixed(1) : '—'}
          </p>
          <p className="dash-kpi__label" style={{ color: '#15803D' }}>Score moy.</p>
        </div>
      </div>

      {readyCount > 0 ? (
        <Link href="/whatsapp?tab=ready" className="dash-cta">
          <span aria-hidden>📲</span>
          Envoyer {readyCount} lien{readyCount > 1 ? 's' : ''} de feedback
          <span className="dash-cta__icon" aria-hidden>→</span>
        </Link>
      ) : (
        <p style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', margin: '4px 0 0' }}>
          Aucun lien de feedback à envoyer pour le moment.
        </p>
      )}
    </div>
  )
}

function kpiBg(bg: string, ringColor: string, _txtColor: string): React.CSSProperties {
  return {
    background: bg,
    boxShadow: `inset 0 0 0 1px ${ringColor}40`,
  }
}
