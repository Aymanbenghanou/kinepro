'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DemandeActions({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function confirmer() {
    setBusy(true); setError(false)
    try {
      const res = await fetch(`/api/super-admin/demandes/${id}/confirmer`, { method: 'POST' })
      if (!res.ok) throw new Error()
      router.refresh() // la demande passe "confirmee" → quitte la liste "en attente"
    } catch {
      setError(true)
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={confirmer} disabled={busy} style={{
        padding: '7px 14px', borderRadius: 8, border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
        background: '#16A34A', color: 'white', fontWeight: 700, fontSize: 12.5, opacity: busy ? 0.6 : 1,
        whiteSpace: 'nowrap',
      }}>
        {busy ? 'Confirmation…' : '✓ Confirmer le paiement'}
      </button>
      {error && <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>Erreur</span>}
    </div>
  )
}
