'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  cabinetId: string
  plan: 'trial' | 'starter' | 'pro'
  planStatus: 'trialing' | 'active' | 'expired' | 'suspended'
  trialEndsAt: string | null    // ISO
  planEndsAt:  string | null    // ISO
  suspensionReason: string | null
  suspendedAt: string | null    // ISO
}

const STATUS_BADGE: Record<Props['planStatus'], { label: string; bg: string; color: string }> = {
  trialing:  { label: 'Essai',     bg: '#DBEAFE', color: '#1D4ED8' },
  active:    { label: 'Actif',     bg: '#DCFCE7', color: '#166534' },
  expired:   { label: 'Expiré',    bg: '#FEF3C7', color: '#92400E' },
  suspended: { label: 'Suspendu',  bg: '#FEE2E2', color: '#991B1B' },
}

function toInputDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function SubscriptionPanel(props: Props) {
  const router = useRouter()
  const [plan, setPlan]             = useState<Props['plan']>(props.plan)
  const [expiryStr, setExpiryStr]   = useState<string>(toInputDate(props.planEndsAt))
  const [loading, setLoading]       = useState(false)
  const [showSuspend, setShowSuspend] = useState(false)
  const [reason, setReason]         = useState('')
  const [msg, setMsg]               = useState<{ text: string; ok: boolean } | null>(null)

  async function call(body: object) {
    setLoading(true); setMsg(null)
    try {
      const res = await fetch(`/api/super-admin/cabinets/${props.cabinetId}/plan`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setMsg({ text: 'Mis à jour ✓', ok: true })
      router.refresh()
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Erreur', ok: false })
    }
    setLoading(false)
  }

  const badge = STATUS_BADGE[props.planStatus]
  const trialEndsDate = props.trialEndsAt ? new Date(props.trialEndsAt) : null

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Abonnement</h2>
        <span style={{ fontSize: 12, background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 99, fontWeight: 700 }}>
          {badge.label}
        </span>
      </div>

      {/* Plan dropdown */}
      <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 4 }}>Plan</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select
          value={plan}
          onChange={e => setPlan(e.target.value as Props['plan'])}
          disabled={loading}
          style={{ flex: 1, padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: 'white' }}
        >
          <option value="trial">Trial</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
        </select>
        <button
          onClick={() => call({ action: 'setPlan', plan })}
          disabled={loading || plan === props.plan}
          style={{ padding: '8px 14px', border: 'none', borderRadius: 8, background: '#2563EB', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: (loading || plan === props.plan) ? 0.5 : 1 }}
        >
          Appliquer
        </button>
      </div>

      {/* Date d'expiration */}
      <label style={{ display: 'block', fontSize: 12, color: '#64748B', marginBottom: 4 }}>
        Date d'expiration {plan !== 'trial' && '(plan payant)'}
      </label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="date" value={expiryStr} onChange={e => setExpiryStr(e.target.value)} disabled={loading}
          style={{ flex: 1, padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13 }}
        />
        <button
          onClick={() => call({ action: 'setExpiry', planEndsAt: expiryStr })}
          disabled={loading || !expiryStr || expiryStr === toInputDate(props.planEndsAt)}
          style={{ padding: '8px 14px', border: 'none', borderRadius: 8, background: '#2563EB', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: (loading || !expiryStr || expiryStr === toInputDate(props.planEndsAt)) ? 0.5 : 1 }}
        >
          Enregistrer
        </button>
      </div>
      <button
        onClick={() => call({ action: 'extendOneYear' })}
        disabled={loading}
        style={{ width: '100%', padding: '8px', marginBottom: 14, border: '1px solid #16A34A', borderRadius: 8, background: 'white', color: '#16A34A', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
      >
        ⏩ Étendre d'1 an (date = aujourd'hui + 365 j, statut actif)
      </button>

      {/* Infos contextuelles */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 12px', fontSize: 12, color: '#475569', marginBottom: 16 }}>
        {trialEndsDate && <>
          <span style={{ color: '#94A3B8' }}>Fin essai</span>
          <span>{trialEndsDate.toLocaleDateString('fr-FR')}</span>
        </>}
        {props.suspensionReason && <>
          <span style={{ color: '#94A3B8' }}>Raison susp.</span>
          <span style={{ fontStyle: 'italic' }}>{props.suspensionReason}</span>
        </>}
        {props.suspendedAt && <>
          <span style={{ color: '#94A3B8' }}>Suspendu le</span>
          <span>{new Date(props.suspendedAt).toLocaleDateString('fr-FR')}</span>
        </>}
      </div>

      {/* Suspension / réactivation */}
      <div style={{ display: 'flex', gap: 8 }}>
        {props.planStatus !== 'suspended' ? (
          <button onClick={() => { setReason(''); setShowSuspend(true) }} disabled={loading}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#DC2626', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            🔒 Suspendre
          </button>
        ) : (
          <button onClick={() => call({ action: 'reactivate' })} disabled={loading}
            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#16A34A', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            ✓ Réactiver
          </button>
        )}
      </div>

      {msg && (
        <div style={{ marginTop: 10, fontSize: 12, color: msg.ok ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
          {msg.text}
        </div>
      )}

      {/* Modal suspension */}
      {showSuspend && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
             onClick={() => setShowSuspend(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, width: 420, maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 12px' }}>Suspendre l'abonnement</h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px' }}>
              Le cabinet n'aura plus accès à l'application tant que la suspension est active.
            </p>
            <label style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 4 }}>Raison (interne)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value.slice(0, 200))} rows={3} maxLength={200}
              placeholder="Ex. impayé, non-respect des CGU…"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, resize: 'vertical' }} />
            <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'right', marginBottom: 12 }}>{reason.length}/200</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowSuspend(false)} style={{ flex: 1, padding: '9px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#64748B' }}>
                Annuler
              </button>
              <button onClick={() => { setShowSuspend(false); call({ action: 'suspend', reason }) }} disabled={!reason.trim()}
                style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, background: '#DC2626', color: 'white', cursor: 'pointer', fontWeight: 700, opacity: !reason.trim() ? 0.5 : 1 }}>
                Confirmer la suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
