'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Status = 'idle' | 'loading' | 'thanks' | 'redirecting' | 'error'

/**
 * Normalise une URL stockée en base :
 *   - trim espaces
 *   - si pas de schéma "http(s)://" → préfixe "https://"
 *   - parse et accepte UNIQUEMENT http: ou https: (anti open-redirect)
 *
 * Retourne l'URL normalisée prête pour `window.location.replace`, ou
 * `null` si elle est invalide / d'un protocole interdit.
 */
function safeNormalizeUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Tolère "maps.app.goo.gl/...", "www.example.com/...", "g.page/..." en
  // ajoutant https:// si aucun schéma n'est présent.
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const u = new URL(withScheme)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}

export default function FeedbackPage() {
  const { token } = useParams<{ token: string }>()
  const [score, setScore]   = useState<number | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  // Lien Google pré-chargé au mount via GET /api/feedback/[token].
  // Sert au redirect même si le POST submit plante côté réseau.
  const [prefetchedLink, setPrefetchedLink] = useState<string | null>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  useEffect(() => { document.title = 'Votre avis — KinéPro' }, [])

  // Pré-chargement du contexte token + lien Google.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch(`/api/feedback/${token}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        setTokenValid(!!d?.valid)
        setPrefetchedLink(typeof d?.googleMapsLink === 'string' ? d.googleMapsLink : null)
      })
      .catch(() => {
        if (!cancelled) setTokenValid(null) // garde l'incertitude, ne bloque pas la saisie
      })
    return () => { cancelled = true }
  }, [token])

  async function handleSubmit() {
    if (!score || !token) return
    setStatus('loading')

    // Calcule l'URL de redirection POTENTIELLE (basée sur le link pré-chargé)
    // avant même de tenter le POST. Si le POST échoue côté réseau ET que le
    // score est éligible, on rediriger quand même.
    const eligibleForGoogle = score >= 8
    const fallbackRedirect  = eligibleForGoogle ? safeNormalizeUrl(prefetchedLink) : null

    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, score }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // 400/404/500 → erreur métier. On n'utilise pas le fallback car
        // l'erreur peut être "token invalide" → ne PAS rediriger.
        setErrorMsg(data?.error || 'Erreur')
        setStatus('error')
        return
      }

      const link = safeNormalizeUrl(data?.googleMapsLink) || fallbackRedirect
      if (eligibleForGoogle && link) {
        setStatus('redirecting')
        window.location.replace(link)
        return
      }
      setStatus('thanks')
    } catch {
      // Erreur réseau : si éligible et qu'on a un lien pré-chargé valide,
      // on tente la redirection quand même.
      if (eligibleForGoogle && fallbackRedirect) {
        setStatus('redirecting')
        window.location.replace(fallbackRedirect)
        return
      }
      setErrorMsg('Erreur réseau. Veuillez réessayer.')
      setStatus('error')
    }
  }

  // ─── Token invalide (confirmé par le GET au mount) ───────────────────────
  if (tokenValid === false) {
    return (
      <div style={pageWrap}>
        <Logo />
        <div style={card}>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>⚠️</div>
          <h1 style={h1}>Lien invalide</h1>
          <p style={p}>Ce lien de feedback n'est plus valide. Contactez votre cabinet si besoin.</p>
        </div>
        <Footer />
      </div>
    )
  }

  // ─── Redirecting ────────────────────────────────────────────────────────
  if (status === 'redirecting') {
    return (
      <div style={pageWrap}>
        <Logo />
        <div style={card}>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>🙏</div>
          <h1 style={h1}>Merci ! Redirection…</h1>
          <p style={p}>Nous vous ouvrons Google pour laisser un avis.</p>
        </div>
        <Footer />
      </div>
    )
  }

  // ─── Thanks (score < 8 ou ≥ 8 sans link) ────────────────────────────────
  if (status === 'thanks') {
    const lowScore = (score ?? 10) <= 7
    return (
      <div style={pageWrap}>
        <Logo />
        <div style={card}>
          <div style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>
            {lowScore ? '💙' : '🙏'}
          </div>
          <h1 style={h1}>
            {lowScore ? "Merci d'avoir partagé" : 'Merci pour votre retour !'}
          </h1>
          <p style={p}>
            {lowScore
              ? "Votre praticien en est informé et reviendra vers vous pour adapter votre prise en charge."
              : "Votre avis nous aide à améliorer nos soins. À très bientôt au cabinet !"}
          </p>
        </div>
        <Footer />
      </div>
    )
  }

  // ─── Erreur ──────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div style={pageWrap}>
        <Logo />
        <div style={card}>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>⚠️</div>
          <h1 style={h1}>Une erreur est survenue</h1>
          <p style={p}>{errorMsg || 'Veuillez réessayer dans un instant.'}</p>
        </div>
        <Footer />
      </div>
    )
  }

  // ─── Saisie du score ─────────────────────────────────────────────────────
  const loading = status === 'loading'
  return (
    <div style={pageWrap}>
      <Logo />
      <div style={card}>
        <h1 style={{ ...h1, marginBottom: 8 }}>Comment s'est passée votre séance ?</h1>
        <p style={{ ...p, marginBottom: 24 }}>
          Notez votre satisfaction de 1 à 10
        </p>

        {/* Grille 1-10 — adaptée mobile (5x2) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
          marginBottom: 20,
        }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
            const active = score === n
            const baseColor = n >= 8 ? '#16A34A' : n >= 5 ? '#F59E0B' : '#DC2626'
            return (
              <button
                key={n}
                disabled={loading}
                onClick={() => setScore(n)}
                style={{
                  aspectRatio: '1',
                  borderRadius: 10,
                  border: active ? `2px solid ${baseColor}` : '1px solid #E2E8F0',
                  background: active ? baseColor : '#F8FAFC',
                  color: active ? 'white' : '#475569',
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: active ? `0 4px 12px ${baseColor}55` : 'none',
                }}
              >
                {n}
              </button>
            )
          })}
        </div>

        {score !== null && (
          <p style={{
            textAlign: 'center', margin: '0 0 20px',
            color: score >= 8 ? '#16A34A' : score >= 5 ? '#D97706' : '#DC2626',
            fontWeight: 600, fontSize: 14,
          }}>
            {score >= 8 ? '😊 Très satisfait(e)'
              : score >= 5 ? '😐 Mitigé(e)'
              : '😞 Insatisfait(e)'} — {score}/10
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!score || loading}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 10,
            border: 'none',
            background: !score ? '#E2E8F0' : '#2563EB',
            color: !score ? '#94A3B8' : 'white',
            fontSize: 15,
            fontWeight: 700,
            cursor: !score || loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {loading ? '⏳ Envoi…' : '✉️ Envoyer mon avis'}
        </button>

        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 11, marginTop: 12 }}>
          Votre avis est confidentiel et ne sera partagé qu'avec votre praticien.
        </p>
      </div>
      <Footer />
    </div>
  )
}

// ─── UI helpers ─────────────────────────────────────────────────────────────

function Logo() {
  return (
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
  )
}

function Footer() {
  return (
    <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 16 }}>
      Propulsé par KinéPro
    </p>
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
  padding: '28px 24px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  width: '100%',
  maxWidth: 480,
}

const h1: React.CSSProperties = {
  textAlign: 'center', color: '#0F172A',
  fontSize: 20, fontWeight: 700, margin: '0 0 12px',
}

const p: React.CSSProperties = {
  textAlign: 'center', color: '#64748B',
  fontSize: 14, lineHeight: 1.6, margin: 0,
}
