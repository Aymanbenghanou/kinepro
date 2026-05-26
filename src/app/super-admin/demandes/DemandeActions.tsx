'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DemandeActions({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<null | 'confirmer' | 'rejeter'>(null)
  const [error, setError] = useState(false)

  async function act(action: 'confirmer' | 'rejeter') {
    setBusy(action); setError(false)
    try {
      const res = await fetch(`/api/super-admin/demandes/${id}/${action}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      router.refresh() // la demande quitte "en_attente" → disparaît de la liste
    } catch {
      setError(true)
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={() => act('confirmer')} disabled={busy !== null} style={{
        padding: '7px 14px', borderRadius: 8, border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
        background: '#16A34A', color: 'white', fontWeight: 700, fontSize: 12.5, opacity: busy ? 0.6 : 1,
      }}>
        {busy === 'confirmer' ? '…' : '✓ Confirmer'}
      </button>
      <button onClick={() => act('rejeter')} disabled={busy !== null} style={{
        padding: '7px 14px', borderRadius: 8, border: '1.5px solid #E2E8F0', cursor: busy ? 'not-allowed' : 'pointer',
        background: 'white', color: '#DC2626', fontWeight: 700, fontSize: 12.5, opacity: busy ? 0.6 : 1,
      }}>
        {busy === 'rejeter' ? '…' : 'Rejeter'}
      </button>
      {error && <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>Erreur</span>}
    </div>
  )
}
