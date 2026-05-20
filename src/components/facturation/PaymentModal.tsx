'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import { MODE_PAIEMENT } from '@/lib/facture-statut'

interface Facture {
  id: string
  montant: number
  montantPaye: number
  patient?: { prenom: string; nom: string } | null
}

export default function PaymentModal({
  facture, onClose, onSuccess,
}: {
  facture: Facture
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const reste = Math.max(0, facture.montant - facture.montantPaye)
  const [montant, setMontant] = useState(String(reste))
  const [mode, setMode] = useState<'especes' | 'virement' | 'cheque' | 'carte'>('especes')
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const m = parseFloat(montant) || 0
  const valid = m > 0 && m <= reste + 0.01
  const progressBefore = facture.montant > 0 ? (facture.montantPaye / facture.montant) * 100 : 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/facturation/${facture.id}/paiements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montant: m, modePaiement: mode, datePaiement, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      onSuccess(`Paiement de ${formatMoney(m)} enregistré ✓`)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.55)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} style={{
        background: 'white', borderRadius: 18, padding: 24,
        maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Enregistrer un paiement</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Header summary */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, marginBottom: 18 }}>
          {facture.patient && (
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              {facture.patient.prenom} {facture.patient.nom}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 13, marginBottom: 10 }}>
            <div>
              <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{formatMoney(facture.montant)}</div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Déjà payé</div>
              <div style={{ fontWeight: 700, color: '#16A34A' }}>{formatMoney(facture.montantPaye)}</div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Reste dû</div>
              <div style={{ fontWeight: 800, color: reste > 0 ? '#DC2626' : '#16A34A', fontSize: 15 }}>{formatMoney(reste)}</div>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressBefore}%`,
              background: progressBefore >= 100 ? '#16A34A' : '#F59E0B',
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: '#64748B', textAlign: 'right' }}>{Math.round(progressBefore)}%</div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Montant à encaisser *</label>
          <input
            type="number" min={0} max={reste} step="0.01"
            value={montant}
            onChange={e => setMontant(e.target.value)}
            required
            style={{ ...input, fontSize: 16, fontWeight: 700, color: '#0F172A' }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {[50, 100, 200].filter(v => v < reste).map(v => (
              <button type="button" key={v} onClick={() => setMontant(String(v))} style={quick}>
                {v} MAD
              </button>
            ))}
            <button type="button" onClick={() => setMontant(String(reste))} style={{ ...quick, background: '#DBEAFE', color: '#1E40AF', borderColor: '#BFDBFE', fontWeight: 700 }}>
              Tout payer ({formatMoney(reste)})
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>Reste dû : {formatMoney(reste)}</div>
        </div>

        {/* Mode */}
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Mode de paiement *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {(Object.keys(MODE_PAIEMENT) as Array<keyof typeof MODE_PAIEMENT>).map(k => {
              const m = MODE_PAIEMENT[k]
              const active = mode === k
              return (
                <button
                  key={k} type="button" onClick={() => setMode(k as any)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${active ? m.color : '#E2E8F0'}`,
                    background: active ? `${m.color}10` : 'white',
                    fontWeight: active ? 700 : 600, fontSize: 13.5,
                    color: active ? m.color : '#475569',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{m.icon}</span> {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Date du paiement</label>
          <input type="date" value={datePaiement} onChange={e => setDatePaiement(e.target.value)} style={input} />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 18 }}>
          <label style={lbl}>Notes (optionnel)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Reçu #, référence virement…" style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} disabled={saving} style={btnSecondary}>Annuler</button>
          <button type="submit" disabled={!valid || saving} style={{
            ...btnPrimary, flex: 2, opacity: (!valid || saving) ? 0.6 : 1,
            cursor: (!valid || saving) ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Enregistrement…' : `Enregistrer ${formatMoney(m || 0)}`}
          </button>
        </div>
      </form>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }
const input: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', color: '#0F172A', boxSizing: 'border-box' }
const quick: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, background: 'white', border: '1px solid #E2E8F0', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: '#475569' }
const btnPrimary: React.CSSProperties = { padding: '12px', borderRadius: 10, background: '#16A34A', color: 'white', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: 10, background: 'white', color: '#475569', border: '1.5px solid #E2E8F0', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
