'use client'

import { useEffect, useState } from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { formatMoney } from '@/lib/utils'

interface Preview {
  canDelete: boolean
  reason?: 'facture_has_payments' | null
  paiementsCount: number
  montantTotal: number
  montantPaye:  number
}

interface Props {
  factureId: string
  factureLabel?: string  // ex: "Facture #2024-042"
  onClose: () => void
  onDeleted?: () => void  // pour rafraîchir la liste
}

export default function DeleteFactureModal({ factureId, factureLabel, onClose, onDeleted }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [deleting, setDeleting]   = useState(false)

  useEffect(() => {
    let alive = true
    fetch(`/api/facturation/${factureId}/delete-preview`)
      .then(async r => {
        const data = await r.json()
        if (!alive) return
        if (!r.ok) throw new Error(data.error || 'Erreur de chargement')
        setPreview(data)
      })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Erreur') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [factureId])

  async function handleDelete() {
    setDeleting(true); setError(null)
    try {
      const res = await fetch(`/api/facturation/${factureId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      onDeleted?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
      setDeleting(false)
    }
  }

  const blocked = preview && !preview.canDelete

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#FEE2E2', color: '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={20} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Supprimer cette facture ?
            </h2>
          </div>
          <button onClick={onClose} style={iconBtn}><X size={20} /></button>
        </div>

        {factureLabel && (
          <p style={{ fontSize: 14, color: '#475569', margin: '0 0 18px' }}>
            <strong style={{ color: '#0F172A' }}>{factureLabel}</strong>
          </p>
        )}

        {loading && <p style={{ fontSize: 13, color: '#94A3B8' }}>Chargement…</p>}

        {blocked && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 14, fontSize: 13, color: '#991B1B', marginBottom: 18 }}>
            Cette facture a <strong>{preview!.paiementsCount} paiement{preview!.paiementsCount > 1 ? 's' : ''} enregistré{preview!.paiementsCount > 1 ? 's' : ''}</strong>.
            Suppression impossible. Veuillez d'abord supprimer les paiements.
          </div>
        )}

        {preview && preview.canDelete && (
          <>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#78350F', margin: 0 }}>
                Montant : <strong>{formatMoney(preview.montantTotal)}</strong> · Aucun paiement enregistré.
              </p>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#374151', marginBottom: 18, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                disabled={deleting}
                style={{ marginTop: 2, accentColor: '#DC2626' }}
              />
              <span>Je comprends que cette action est <strong>irréversible</strong>.</span>
            </label>
          </>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 10, fontSize: 12, color: '#991B1B', marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={deleting} style={btnCancel}>
            Annuler
          </button>
          {!blocked && preview && (
            <button
              onClick={handleDelete}
              disabled={!confirmed || deleting}
              style={{ ...btnDanger, opacity: (!confirmed || deleting) ? 0.5 : 1, cursor: (!confirmed || deleting) ? 'not-allowed' : 'pointer' }}
            >
              <Trash2 size={15} /> {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 250, padding: 16,
}
const sheet: React.CSSProperties = {
  background: 'white', borderRadius: 14, padding: 24,
  width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
}
const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4,
}
const btnCancel: React.CSSProperties = {
  padding: '10px 18px', border: '1px solid #E2E8F0', borderRadius: 10,
  background: 'white', color: '#64748B', fontWeight: 600, fontSize: 14, cursor: 'pointer',
}
const btnDanger: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 18px', border: 'none', borderRadius: 10,
  background: '#DC2626', color: 'white', fontWeight: 700, fontSize: 14,
}
