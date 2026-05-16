'use client'

import { useState, useEffect } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #E2E8F0', borderRadius: 10,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
  color: '#0F172A', background: 'white',
}

export default function SuperAdminParametresPage() {
  const [form, setForm] = useState({
    whatsappNumber: '',
    rib:            '',
    banque:         '',
    titulaire:      '',
    prixMensuel:    '299',
    prixAnnuel:     '2499',
  })
  const [loading, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/super-admin/parametres')
      .then(r => r.json())
      .then(data => {
        if (data) setForm(f => ({ ...f, ...data }))
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/super-admin/parametres', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setMsg({ text: 'Paramètres sauvegardés !', ok: true })
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : 'Erreur', ok: false })
    }
    setSaving(false)
  }

  if (fetching) return <div style={{ padding: 40, color: '#64748B' }}>Chargement...</div>

  return (
    <div style={{ padding: '32px 28px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>Paramètres</h1>
      <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 32px' }}>Configuration globale de KinéPro SaaS</p>

      <form onSubmit={handleSave} style={{ maxWidth: 600 }}>

        {/* WhatsApp SUPER ADMIN */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>📱 WhatsApp Super Admin</h2>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Numéro WhatsApp (format international, sans +)
            </label>
            <input
              value={form.whatsappNumber}
              onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))}
              placeholder="212600000000"
              style={inputStyle}
            />
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '6px 0 0' }}>
              Exemple: 212600123456 pour +212 6 00 12 34 56
            </p>
          </div>
        </div>

        {/* RIB */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>🏦 Coordonnées bancaires</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Banque</label>
              <input value={form.banque} onChange={e => setForm(f => ({ ...f, banque: e.target.value }))} placeholder="Attijariwafa Bank" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>RIB</label>
              <input value={form.rib} onChange={e => setForm(f => ({ ...f, rib: e.target.value }))} placeholder="007 780 0001234567890 12" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Titulaire du compte</label>
              <input value={form.titulaire} onChange={e => setForm(f => ({ ...f, titulaire: e.target.value }))} placeholder="KinéPro SARL" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>💰 Tarifs abonnement</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Prix mensuel (MAD)</label>
              <input type="number" value={form.prixMensuel} onChange={e => setForm(f => ({ ...f, prixMensuel: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Prix annuel (MAD)</label>
              <input type="number" value={form.prixAnnuel} onChange={e => setForm(f => ({ ...f, prixAnnuel: e.target.value }))} style={inputStyle} />
            </div>
          </div>
        </div>

        {msg && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
            background: msg.ok ? '#F0FDF4' : '#FEF2F2',
            color: msg.ok ? '#166534' : '#B91C1C',
            border: `1px solid ${msg.ok ? '#BBF7D0' : '#FECACA'}`,
          }}>
            {msg.text}
          </div>
        )}

        <button type="submit" disabled={loading}
          style={{ padding: '12px 28px', background: loading ? '#93C5FD' : '#4F46E5', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </form>
    </div>
  )
}
