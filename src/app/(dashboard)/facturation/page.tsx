'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/layout/Topbar'
import { formatDate, formatMoney } from '@/lib/utils'
import { Plus, X, Download } from 'lucide-react'

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    paye: { label: 'Payé', bg: '#DCFCE7', color: '#16A34A' },
    en_attente: { label: 'En attente', bg: '#FEF3C7', color: '#D97706' },
    en_retard: { label: 'En retard', bg: '#FEE2E2', color: '#DC2626' },
  }
  const s = map[statut] || { label: statut, bg: '#F1F5F9', color: '#64748B' }
  return <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>{s.label}</span>
}

export default function FacturationPage() {
  const [factures, setFactures] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ patientId: '', montant: '', statut: 'en_attente' })

  async function fetchFactures() {
    setLoading(true)
    try {
      const params = filterStatut ? `?statut=${filterStatut}` : ''
      const res = await fetch(`/api/factures${params}`)
      const data = await res.json()
      setFactures(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchFactures() }, [filterStatut])
  useEffect(() => {
    fetch('/api/patients').then(r => r.json()).then(d => setPatients(Array.isArray(d) ? d : []))
  }, [])

  const totalRevenu = factures.filter(f => f.statut === 'paye').reduce((sum, f) => sum + f.montant, 0)
  const totalImpaye = factures.filter(f => f.statut !== 'paye').reduce((sum, f) => sum + f.montant, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/factures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: form.patientId, montant: parseFloat(form.montant), statut: form.statut }),
      })
      setShowModal(false)
      setForm({ patientId: '', montant: '', statut: 'en_attente' })
      fetchFactures()
    } catch {}
    setSaving(false)
  }

  function exportPDF(f: any) {
    const content = `FACTURE\n\nPatient: ${f.patient?.prenom} ${f.patient?.nom}\nDate: ${formatDate(f.dateEmise)}\nMontant: ${formatMoney(f.montant)}\nStatut: ${f.statut === 'paye' ? 'Payé' : f.statut === 'en_attente' ? 'En attente' : 'En retard'}\n\nCabinet Amrani - Kinésithérapie\n45 Avenue Hassan II, Casablanca 20000\nTél: 0522-456-789`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `facture-${f.id.slice(0, 8)}.txt`
    a.click()
  }

  return (
    <div>
      <Topbar title="Facturation" subtitle="Gestion des factures" />
      <div style={{ padding: 24 }}>

        {/* Stats résumé */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total encaissé', value: formatMoney(totalRevenu), bg: '#DCFCE7', color: '#16A34A' },
            { label: 'Montant impayé', value: formatMoney(totalImpaye), bg: '#FEE2E2', color: '#DC2626' },
            { label: 'Nombre de factures', value: factures.length, bg: '#DBEAFE', color: '#2563EB' },
          ].map(({ label, value, bg, color }) => (
            <div key={label} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filtres + bouton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: 'white', color: '#374151' }}>
            <option value="">Tous les statuts</option>
            <option value="paye">Payées</option>
            <option value="en_attente">En attente</option>
            <option value="en_retard">En retard</option>
          </select>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>
            <Plus size={16} /> Créer facture
          </button>
        </div>

        {/* Table */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Patient', 'Date émission', 'Montant', 'Statut', 'Date paiement', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748B', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 14 }}>Chargement...</td></tr>
              ) : factures.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 14 }}>Aucune facture</td></tr>
              ) : factures.map((f: any, i: number) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{f.patient?.prenom} {f.patient?.nom}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151' }}>{formatDate(f.dateEmise)}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{formatMoney(f.montant)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StatutBadge statut={f.statut} />
                      {f.statut === 'en_retard' && <span style={{ fontSize: 16 }}>🔴</span>}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151' }}>{f.datePaiement ? formatDate(f.datePaiement) : '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => exportPDF(f)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12, color: '#374151' }}>
                      <Download size={13} /> Exporter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal créer facture */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>Créer une facture</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Patient *</label>
                <select value={form.patientId} onChange={e => setForm(f => ({...f, patientId: e.target.value}))} required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}>
                  <option value="">Sélectionner un patient</option>
                  {patients.map((p: any) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Montant (MAD) *</label>
                <input type="number" value={form.montant} onChange={e => setForm(f => ({...f, montant: e.target.value}))} required min="0" step="0.01"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} placeholder="Ex: 200" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Statut</label>
                <select value={form.statut} onChange={e => setForm(f => ({...f, statut: e.target.value}))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}>
                  <option value="en_attente">En attente</option>
                  <option value="paye">Payé</option>
                  <option value="en_retard">En retard</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#64748B' }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#2563EB', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  {saving ? 'Création...' : 'Créer la facture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
