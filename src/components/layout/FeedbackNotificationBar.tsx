'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface ReadySeance {
  id: string
  feedbackToken: string | null
  patient: { id: string; nom: string; prenom: string }
  praticien: { nom: string; prenom: string }
}

export default function FeedbackNotificationBar() {
  const [readyList, setReadyList]   = useState<ReadySeance[]>([])
  const [dismissed, setDismissed]   = useState<Set<string>>(new Set())
  const [visible, setVisible]       = useState(false)

  const fetchReady = useCallback(async () => {
    try {
      const res  = await fetch('/api/feedback/ready')
      if (!res.ok) return
      const data: ReadySeance[] = await res.json()
      setReadyList(data)
      setVisible(data.length > 0)
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => {
    fetchReady()
    const interval = setInterval(fetchReady, 60_000) // poll every 60s
    return () => clearInterval(interval)
  }, [fetchReady])

  // Auto-dismiss the banner after 5 seconds (data still available in /whatsapp)
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(t)
  }, [visible])

  const undismissed = readyList.filter((s) => !dismissed.has(s.id))

  if (!visible || undismissed.length === 0) return null

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]))
  }

  const dismissAll = () => {
    setDismissed(new Set(readyList.map((s) => s.id)))
    setVisible(false)
  }

  return (
    <div style={{
      background: 'linear-gradient(90deg, #7C3AED 0%, #6D28D9 100%)',
      color: 'white',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      fontSize: 13,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
        <span style={{ fontSize: 16 }}>🔔</span>
        <strong>
          {undismissed.length} patient{undismissed.length > 1 ? 's' : ''} prêt{undismissed.length > 1 ? 's' : ''} pour feedback :
        </strong>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {undismissed.slice(0, 3).map((s) => (
            <span
              key={s.id}
              style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 10px',
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {s.patient.prenom} {s.patient.nom}
              <button
                onClick={() => dismiss(s.id)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1 }}
              >
                ✕
              </button>
            </span>
          ))}
          {undismissed.length > 3 && (
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 999 }}>
              +{undismissed.length - 3} autres
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link
          href="/whatsapp?tab=ready"
          style={{
            background: 'white',
            color: '#7C3AED',
            padding: '5px 14px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 12,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Envoyer feedback →
        </Link>
        <button
          onClick={dismissAll}
          aria-label="Fermer"
          style={{
            background: 'rgba(255,255,255,0.18)',
            border: 'none',
            color: 'white',
            width: 28, height: 28,
            borderRadius: '50%',
            fontSize: 16, lineHeight: 1,
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
