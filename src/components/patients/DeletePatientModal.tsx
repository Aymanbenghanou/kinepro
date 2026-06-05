'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertTriangle, Trash2 } from 'lucide-react'

interface Preview {
  canDelete: boolean
  reason?: 'patient_has_paid_factures' | null
  counts: {
    rdv: number
    seances: number
    facturesNonPayees: number
    facturesPayees: number
    documents: number
    programmes: number
    feedbacks: number
    whatsappLogs: number
  }
}

interface Props {
  patientId: string
  patientName: string
  onClose: () => void
}

export default function DeletePatientModal({ patientId, patientName, onClose }: Props) {
  const router = useRouter()
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [deleting, setDeleting]   = useState(false)

  useEffect(() => {
    let alive = true
    fetch(`/api/patients/${patientId}/delete-preview`)
      .then(async r => {
        const data = await r.json()
        if (!alive) return
        if (!r.ok) throw new Error(data.error || 'Erreur de chargement')
        setPreview(data)
      })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Erreur') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [patientId])

  async function handleDelete() {
    setDeleting(true); setError(null)
    try {
      const res = await fetch(`/api/patients/${patientId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      router.push('/patients')
      router.refresh()
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
              Supprimer ce patient ?
            </h2>
          </div>
          <button onClick={onClose} style={iconBtn}><X size={20} /></button>
        </div>

        <p style={{ fontSize: 14, color: '#475569', margin: '0 0 18px' }}>
          <strong style={{ color: '#0F172A' }}>{patientName}</strong>
        </p>

        {loading && <p style={{ fontSize: 13, color: '#94A3B8' }}>Chargement…</p>}

        {blocked && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 14, fontSize: 13, color: '#991B1B', marginBottom: 18 }}>
            Ce patient a <strong>{preview!.counts.facturesPayees} facture{preview!.counts.facturesPayees > 1 ? 's' : ''} payée{preview!.counts.facturesPayees > 1 ? 's' : ''}</strong>.
            Suppression impossible. Veuillez d'abord annuler ces factures ou contacter le support.
          </div>
        )}

        {preview && preview.canDelete && (
          <>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#92400E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                Données supprimées définitivement
              </p>
              <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, color: '#78350F', lineHeight: 1.7 }}>
                {preview.counts.rdv               > 0 && <li>{preview.counts.rdv} rendez-vous</li>}
                {preview.counts.seances           > 0 && <li>{preview.counts.seances} séance{preview.counts.seances > 1 ? 's' : ''}</li>}
                {preview.counts.facturesNonPayees > 0 && <li>{preview.counts.facturesNonPayees} facture{preview.counts.facturesNonPayees > 1 ? 's' : ''} non payée{preview.counts.facturesNonPayees > 1 ? 's' : ''}</li>}
                {preview.counts.documents         > 0 && <li>{preview.counts.documents} document{preview.counts.documents > 1 ? 's' : ''} (fichiers supprimés du stockage)</li>}
                {preview.counts.programmes        > 0 && <li>{preview.counts.programmes} programme{preview.counts.programmes > 1 ? 's' : ''} d'exercices</li>}
                {preview.counts.feedbacks         > 0 && <li>{preview.counts.feedbacks} feedback{preview.counts.feedbacks > 1 ? 's' : ''}</li>}
                {preview.counts.whatsappLogs      > 0 && <li>{preview.counts.whatsappLogs} log{preview.counts.whatsappLogs > 1 ? 's' : ''} WhatsApp</li>}
                <li><strong>Le dossier patient lui-même</strong></li>
              </ul>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#374151', marginBottom: 18, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                disabled={deleting}
                style={{ marginTop: 2, accentColor: '#DC2626' }}
              />
              <span>Je comprends que cette action est <strong>irréversible</strong> et que toutes ces données seront supprimées définitivement.</span>
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
              <Trash2 size={15} /> {deleting ? 'Suppression…' : 'Supprimer définitivement'}
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
  width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
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
