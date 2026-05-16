'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CabinetActions({ cabinetId, currentPlan }: { cabinetId: string; currentPlan: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function updatePlan(action: 'activate' | 'suspend' | 'trial') {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/super-admin/cabinets/${cabinetId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setMsg({ text: 'Mis à jour !', ok: true })
      router.refresh()
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : 'Erreur', ok: false })
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {currentPlan !== 'ACTIVE' && (
          <button onClick={() => updatePlan('activate')} disabled={loading}
            style={{ padding: '9px 18px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            ✅ Activer l'abonnement
          </button>
        )}
        {currentPlan !== 'SUSPENDED' && (
          <button onClick={() => updatePlan('suspend')} disabled={loading}
            style={{ padding: '9px 18px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            🔒 Suspendre
          </button>
        )}
        {currentPlan !== 'TRIAL' && (
          <button onClick={() => updatePlan('trial')} disabled={loading}
            style={{ padding: '9px 18px', background: '#D97706', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            ⏳ Remettre en essai
          </button>
        )}
      </div>
      {msg && (
        <div style={{ fontSize: 12, color: msg.ok ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
          {msg.text}
        </div>
      )}
    </div>
  )
}
