'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Plan = 'trial' | 'starter' | 'pro'

function plusOneYearISO(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function NewCabinetPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Cabinet
  const [nom, setNom] = useState('')
  const [ville, setVille] = useState('')
  const [telephone, setTelephone] = useState('')
  const [cabEmail, setCabEmail] = useState('')

  // Owner
  const [ownerPrenom, setOwnerPrenom] = useState('')
  const [ownerNom, setOwnerNom] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

  // Plan
  const [plan, setPlan] = useState<Plan>('trial')
  const [trialDays, setTrialDays] = useState(15)
  const [planEndsAt, setPlanEndsAt] = useState(plusOneYearISO())

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!nom.trim() || !ownerEmail.trim() || !ownerPassword || !ownerPrenom.trim() || !ownerNom.trim()) {
      setErr('Champs requis manquants'); return
    }
    if (ownerPassword.length < 8) { setErr('Mot de passe : 8 caractères minimum'); return }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        cabinet: {
          nom: nom.trim(),
          ville:     ville.trim() || null,
          telephone: telephone.trim() || null,
          email:     cabEmail.trim() || null,
        },
        owner: {
          email:    ownerEmail.trim(),
          password: ownerPassword,
          nom:      ownerNom.trim(),
          prenom:   ownerPrenom.trim(),
        },
        plan,
      }
      if (plan === 'trial') body.trialDays = trialDays
      else body.planEndsAt = planEndsAt

      const res = await fetch('/api/super-admin/cabinets/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      // Toast minimal via sessionStorage : le détail relit & affiche
      try {
        sessionStorage.setItem('admin_cabinet_created', JSON.stringify({
          email: ownerEmail.trim(),
          ts: Date.now(),
        }))
      } catch {}
      router.push(`/super-admin/cabinets/${data.cabinetId}`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 720 }}>
      <Link href="/super-admin/cabinets" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        ← Tous les cabinets
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 24px' }}>Nouveau cabinet</h1>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Cabinet */}
        <section style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>Cabinet</h2>
          <Field label="Nom du cabinet *">
            <input value={nom} onChange={e => setNom(e.target.value)} required style={inputStyle} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Ville"><input value={ville} onChange={e => setVille(e.target.value)} style={inputStyle} /></Field>
            <Field label="Téléphone"><input value={telephone} onChange={e => setTelephone(e.target.value)} style={inputStyle} /></Field>
          </div>
          <Field label="Email cabinet">
            <input type="email" value={cabEmail} onChange={e => setCabEmail(e.target.value)} style={inputStyle} />
          </Field>
        </section>

        {/* Owner */}
        <section style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>Compte propriétaire</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Prénom *"><input value={ownerPrenom} onChange={e => setOwnerPrenom(e.target.value)} required style={inputStyle} /></Field>
            <Field label="Nom *"><input value={ownerNom} onChange={e => setOwnerNom(e.target.value)} required style={inputStyle} /></Field>
          </div>
          <Field label="Email *"><input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} required style={inputStyle} /></Field>
          <Field label="Mot de passe * (min 8 caractères)">
            <input type="text" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} required minLength={8} style={inputStyle} />
          </Field>
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: -4 }}>À transmettre au kiné par WhatsApp/email après création.</p>
        </section>

        {/* Plan */}
        <section style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>Plan initial</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {(['trial', 'starter', 'pro'] as Plan[]).map(p => (
              <label key={p} style={{
                flex: 1, minWidth: 110, cursor: 'pointer',
                padding: '10px 14px', borderRadius: 10,
                border: plan === p ? '2px solid #2563EB' : '1px solid #E2E8F0',
                background: plan === p ? '#EFF6FF' : 'white',
                fontSize: 13, fontWeight: 600, color: '#0F172A',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <input type="radio" name="plan" value={p} checked={plan === p} onChange={() => setPlan(p)} style={{ accentColor: '#2563EB' }} />
                {p === 'trial' ? 'Trial' : p === 'starter' ? 'Starter' : 'Pro'}
              </label>
            ))}
          </div>

          {plan === 'trial' ? (
            <Field label="Durée d'essai (jours)">
              <input type="number" min={1} max={365} value={trialDays}
                onChange={e => setTrialDays(parseInt(e.target.value) || 15)} style={inputStyle} />
            </Field>
          ) : (
            <Field label="Date d'expiration">
              <input type="date" value={planEndsAt} onChange={e => setPlanEndsAt(e.target.value)} style={inputStyle} />
            </Field>
          )}
        </section>

        {err && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 12, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/super-admin/cabinets" style={{
            flex: 1, padding: '12px', textAlign: 'center', border: '1px solid #E2E8F0',
            borderRadius: 10, background: 'white', fontWeight: 600, color: '#64748B', textDecoration: 'none',
          }}>Annuler</Link>
          <button type="submit" disabled={submitting} style={{
            flex: 2, padding: '12px', border: 'none', borderRadius: 10,
            background: '#2563EB', color: 'white', cursor: 'pointer', fontWeight: 700,
            opacity: submitting ? 0.6 : 1,
          }}>
            {submitting ? 'Création…' : 'Créer le cabinet'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0',
  borderRadius: 8, fontSize: 14, background: 'white',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
