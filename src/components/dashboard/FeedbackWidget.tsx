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
      <div style={cardStyle}>
        <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: 20 }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: 0 }}>⭐ Feedback patients</h2>
        <Link href="/whatsapp?tab=ready" style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>
          Ouvrir WhatsApp Center →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={kpiBox('#F5F3FF', '#7C3AED')}>
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{readyCount}</p>
          <p style={{ fontSize: 11, margin: 0, opacity: 0.8 }}>Prêts à envoyer</p>
        </div>
        <div style={kpiBox('#FEF3C7', '#D97706')}>
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{pending}</p>
          <p style={{ fontSize: 11, margin: 0, opacity: 0.8 }}>En préparation</p>
        </div>
        <div style={kpiBox('#DCFCE7', '#16A34A')}>
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            {avgScore !== null ? avgScore.toFixed(1) : '—'}
          </p>
          <p style={{ fontSize: 11, margin: 0, opacity: 0.8 }}>Score moy.</p>
        </div>
      </div>

      {readyCount > 0 ? (
        <Link
          href="/whatsapp?tab=ready"
          style={{
            display: 'block', textAlign: 'center',
            background: '#7C3AED', color: 'white',
            padding: '8px 12px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}
        >
          📲 Envoyer {readyCount} lien{readyCount > 1 ? 's' : ''} de feedback
        </Link>
      ) : (
        <p style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', margin: '4px 0 0' }}>
          Aucun lien de feedback à envoyer pour le moment.
        </p>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #E2E8F0',
  borderRadius: 12,
  padding: 20,
}

function kpiBox(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    borderRadius: 8,
    padding: '10px 12px',
    textAlign: 'center',
    color,
  }
}
