'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ReadySeance {
  id: string
  feedbackToken: string | null
  feedbackReadyAt: string | null
  patient: { id: string; nom: string; prenom: string; telephone: string | null }
  praticien: { nom: string; prenom: string }
}

function CountdownTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(since).getTime()) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [since])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  return (
    <span style={{ color: '#8B5CF6', fontWeight: 600, fontSize: 12 }}>
      il y a {mins > 0 ? `${mins}m ` : ''}{secs}s
    </span>
  )
}

export default function FeedbackWidget() {
  const [ready, setReady]     = useState<ReadySeance[]>([])
  const [pending, setPending] = useState(0)
  const [avgScore, setAvgScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch ready séances
        const res = await fetch('/api/feedback/ready')
        if (res.ok) {
          const data: ReadySeance[] = await res.json()
          setReady(data)
        }

        // Fetch general stats
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
          Voir tout →
        </Link>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={kpiBox('#F5F3FF', '#7C3AED')}>
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{ready.length}</p>
          <p style={{ fontSize: 11, margin: 0, opacity: 0.8 }}>Prêts</p>
        </div>
        <div style={kpiBox('#FEF3C7', '#D97706')}>
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{pending}</p>
          <p style={{ fontSize: 11, margin: 0, opacity: 0.8 }}>En attente</p>
        </div>
        <div style={kpiBox('#DCFCE7', '#16A34A')}>
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            {avgScore !== null ? avgScore.toFixed(1) : '—'}
          </p>
          <p style={{ fontSize: 11, margin: 0, opacity: 0.8 }}>Score moy.</p>
        </div>
      </div>

      {/* Ready list */}
      {ready.length === 0 ? (
        <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
          Aucun feedback prêt pour le moment
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ready.slice(0, 4).map((s) => (
            <div key={s.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 10px', background: '#F5F3FF', borderRadius: 8,
              borderLeft: '3px solid #8B5CF6',
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>
                  {s.patient.prenom} {s.patient.nom}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Dr. {s.praticien.prenom} {s.praticien.nom}</span>
                  {s.feedbackReadyAt && <CountdownTimer since={s.feedbackReadyAt} />}
                </div>
              </div>
              {s.patient.telephone && s.feedbackToken && (
                <a
                  href={`https://wa.me/${s.patient.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Bonjour ${s.patient.prenom} 👋\n\nVotre séance est terminée. Donnez votre avis ici :\n${process.env.NEXT_PUBLIC_APP_URL ?? ''}/feedback/${s.feedbackToken}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#25D366',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  📲 WA
                </a>
              )}
            </div>
          ))}
          {ready.length > 4 && (
            <Link
              href="/whatsapp?tab=ready"
              style={{ textAlign: 'center', fontSize: 12, color: '#7C3AED', fontWeight: 600, textDecoration: 'none', padding: '4px 0' }}
            >
              +{ready.length - 4} autres prêts →
            </Link>
          )}
        </div>
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
