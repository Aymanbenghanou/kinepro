'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

type Status =
  | 'idle'           // initial / no ?r param
  | 'loading'        // calling /api/feedback/submit
  | 'thanks_oui'     // Oui sans googleMapsLink → remerciement
  | 'thanks_non'     // Non → remerciement empathique
  | 'redirecting'    // Oui avec googleMapsLink → redirection Google en cours
  | 'error'

/**
 * Valide qu'une URL est http(s) avant redirection — anti open-redirect.
 * On accepte http et https uniquement ; tout autre protocole (javascript:,
 * data:, file:, etc.) est rejeté.
 */
function isSafeHttpUrl(u: string | null | undefined): u is string {
  if (typeof u !== 'string' || !u.trim()) return false
  try {
    const url = new URL(u.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function FeedbackPage() {
  const { token } = useParams<{ token: string }>()
  const searchParams = useSearchParams()
  const r = searchParams.get('r')

  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    document.title = 'Votre avis — KinéPro'
  }, [])

  useEffect(() => {
    if (r !== 'oui' && r !== 'non') return
    if (!token) return

    let cancelled = false
    const submit = async () => {
      setStatus('loading')
      try {
        const res = await fetch('/api/feedback/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, reponse: r }),
        })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return

        if (!res.ok) {
          setErrorMsg(data?.error || 'Erreur')
          setStatus('error')
          return
        }

        // Si Oui ET googleMapsLink valide → redirection immédiate.
        if (r === 'oui' && isSafeHttpUrl(data?.googleMapsLink)) {
          setStatus('redirecting')
          // petit délai pour laisser le navigateur peindre l'écran "Merci"
          // pendant qu'il ouvre Google.
          window.location.replace(data.googleMapsLink as string)
          return
        }

        setStatus(r === 'oui' ? 'thanks_oui' : 'thanks_non')
      } catch {
        if (!cancelled) {
          setErrorMsg('Erreur réseau. Veuillez réessayer.')
          setStatus('error')
        }
      }
    }
    submit()
    return () => { cancelled = true }
  }, [r, token])

  // ─── Pas de param r → accueil neutre ────────────────────────────────────
  if (r !== 'oui' && r !== 'non') {
    return (
      <div style={pageWrap}>
        <Logo />
        <div style={card}>
          <h1 style={h1}>Votre avis nous intéresse</h1>
          <p style={p}>
            Ouvrez le message WhatsApp que nous vous avons envoyé et cliquez
            sur <strong>Oui</strong> ou <strong>Non</strong> pour répondre.
          </p>
        </div>
        <Footer />
      </div>
    )
  }

  // ─── Loading / Redirecting ───────────────────────────────────────────────
  if (status === 'loading' || status === 'redirecting') {
    return (
      <div style={pageWrap}>
        <Logo />
        <div style={card}>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>⏳</div>
          <h1 style={h1}>
            {status === 'redirecting' ? 'Merci ! Redirection…' : 'Enregistrement…'}
          </h1>
          {status === 'redirecting' && (
            <p style={p}>Nous vous ouvrons Google pour laisser un avis 🙏</p>
          )}
        </div>
        <Footer />
      </div>
    )
  }

  // ─── Oui sans googleMapsLink → remerciement simple ───────────────────────
  if (status === 'thanks_oui') {
    return (
      <div style={pageWrap}>
        <Logo />
        <div style={card}>
          <div style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>🙏</div>
          <h1 style={h1}>Merci pour votre retour !</h1>
          <p style={p}>
            Nous sommes ravis que votre séance se soit bien passée.<br />
            À très bientôt au cabinet !
          </p>
        </div>
        <Footer />
      </div>
    )
  }

  // ─── Non → remerciement empathique ───────────────────────────────────────
  if (status === 'thanks_non') {
    return (
      <div style={pageWrap}>
        <Logo />
        <div style={card}>
          <div style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>💙</div>
          <h1 style={h1}>Merci d'avoir partagé</h1>
          <p style={p}>
            Nous sommes désolés que cette séance ne vous ait pas pleinement
            satisfait(e). Votre praticien en est informé et reviendra vers
            vous pour adapter votre prise en charge.
          </p>
        </div>
        <Footer />
      </div>
    )
  }

  // ─── Erreur ───────────────────────────────────────────────────────────────
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

// ─── UI helpers ────────────────────────────────────────────────────────────

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
  padding: '32px 28px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  width: '100%',
  maxWidth: 520,
}

const h1: React.CSSProperties = {
  textAlign: 'center', color: '#0F172A',
  fontSize: 22, fontWeight: 700, margin: '0 0 12px',
}

const p: React.CSSProperties = {
  textAlign: 'center', color: '#64748B',
  fontSize: 15, lineHeight: 1.6, margin: 0,
}
