'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{
            width: 40, height: 40,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 700,
            transition: 'all 0.15s',
            background: (hovered || value) >= n
              ? n >= 8 ? '#16A34A' : n >= 5 ? '#F59E0B' : '#DC2626'
              : '#F1F5F9',
            color: (hovered || value) >= n ? 'white' : '#94A3B8',
            transform: (hovered || value) >= n ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function ScoreLabel({ score }: { score: number }) {
  if (!score) return null
  if (score >= 8) return (
    <p style={{ textAlign: 'center', color: '#16A34A', fontWeight: 600, fontSize: 15, margin: '8px 0 0' }}>
      😊 Excellent — Nous sommes ravis !
    </p>
  )
  if (score >= 5) return (
    <p style={{ textAlign: 'center', color: '#D97706', fontWeight: 600, fontSize: 15, margin: '8px 0 0' }}>
      😐 Moyen — Nous allons nous améliorer
    </p>
  )
  return (
    <p style={{ textAlign: 'center', color: '#DC2626', fontWeight: 600, fontSize: 15, margin: '8px 0 0' }}>
      😞 Difficile — Nous sommes désolés
    </p>
  )
}

export default function FeedbackPage() {
  const { token } = useParams<{ token: string }>()
  const [score, setScore]             = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [status, setStatus]           = useState<'idle' | 'loading' | 'success' | 'error' | 'already'>('idle')
  const [errorMsg, setErrorMsg]       = useState('')

  useEffect(() => {
    document.title = 'Votre avis — KinéPro'
  }, [])

  const handleSubmit = async () => {
    if (!score) return
    setStatus('loading')

    try {
      const res = await fetch('/api/feedback/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, score, commentaire }),
      })
      const data = await res.json()

      if (res.status === 409) { setStatus('already'); return }
      if (!res.ok) { setErrorMsg(data.error || 'Erreur'); setStatus('error'); return }

      setStatus('success')
    } catch {
      setErrorMsg('Erreur réseau. Veuillez réessayer.')
      setStatus('error')
    }
  }

  // ─── Success screen ───────────────────────────────────────────────────────

  if (status === 'success') {
    return (
      <div style={pageWrap}>
        <div style={card}>
          <div style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>🙏</div>
          <h1 style={{ textAlign: 'center', color: '#0F172A', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Merci pour votre retour !
          </h1>
          <p style={{ textAlign: 'center', color: '#64748B', fontSize: 15, lineHeight: 1.6 }}>
            Votre avis nous aide à améliorer nos soins.<br />
            À très bientôt au cabinet !
          </p>
          <div style={{ marginTop: 24, padding: '16px', background: '#F0FDF4', borderRadius: 12, textAlign: 'center' }}>
            <p style={{ color: '#16A34A', fontWeight: 600, margin: 0, fontSize: 14 }}>
              ⭐ Votre note : <strong>{score}/10</strong>
            </p>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 16 }}>
          Propulsé par KinéPro
        </p>
      </div>
    )
  }

  // ─── Already submitted ────────────────────────────────────────────────────

  if (status === 'already') {
    return (
      <div style={pageWrap}>
        <div style={card}>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>✅</div>
          <h1 style={{ textAlign: 'center', color: '#0F172A', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Feedback déjà soumis
          </h1>
          <p style={{ textAlign: 'center', color: '#64748B', fontSize: 14 }}>
            Vous avez déjà évalué cette séance. Merci !
          </p>
        </div>
      </div>
    )
  }

  // ─── Main form ────────────────────────────────────────────────────────────

  return (
    <div style={pageWrap}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'white', padding: '10px 20px', borderRadius: 12,
          boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
        }}>
          <span style={{ fontSize: 22 }}>🏥</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0F2747' }}>KinéPro</span>
        </div>
      </div>

      <div style={card}>
        <h1 style={{ textAlign: 'center', color: '#0F172A', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
          Comment s'est passée votre séance ?
        </h1>
        <p style={{ textAlign: 'center', color: '#64748B', fontSize: 14, marginBottom: 24 }}>
          Votre avis nous aide à améliorer la qualité de nos soins
        </p>

        {/* Score */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ textAlign: 'center', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            Note de satisfaction (1 = difficile, 10 = excellent)
          </p>
          <StarRating value={score} onChange={setScore} />
          <ScoreLabel score={score} />
        </div>

        {/* Comment */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Commentaire <span style={{ fontWeight: 400, color: '#94A3B8' }}>(facultatif)</span>
          </label>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Partagez votre expérience, suggestions ou remarques..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              fontSize: 14,
              color: '#0F172A',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Error */}
        {status === 'error' && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!score || status === 'loading'}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 10,
            border: 'none',
            background: !score ? '#E2E8F0' : '#2563EB',
            color: !score ? '#94A3B8' : 'white',
            fontSize: 15,
            fontWeight: 700,
            cursor: !score ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {status === 'loading' ? '⏳ Envoi...' : '✉️ Envoyer mon avis'}
        </button>

        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 11, marginTop: 12 }}>
          Votre avis est confidentiel et ne sera partagé qu'avec votre praticien
        </p>
      </div>

      <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 16 }}>
        Propulsé par KinéPro
      </p>
    </div>
  )
}

const pageWrap: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
}

const card: React.CSSProperties = {
  background: 'white',
  borderRadius: 16,
  padding: '32px 28px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  width: '100%',
  maxWidth: 520,
}
