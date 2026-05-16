'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/layout/Topbar'
import { Plus, X, Phone, Mail } from 'lucide-react'

const COULEURS = ['#2563EB', '#16A34A', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4']

export default function PersonnelPage() {
  const [praticiens, setPraticiens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', specialite: '', telephone: '', email: '', couleur: '#2563EB' })

  async function fetchPraticiens() {
    setLoading(true)
    try {
      const res = await fetch('/api/praticiens')
      const data = await res.json()
      setPraticiens(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchPraticiens() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/praticiens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setShowModal(false)
      setForm({ nom: '', prenom: '', specialite: '', telephone: '', email: '', couleur: '#2563EB' })
      fetchPraticiens()
    } catch {}
    setSaving(false)
  }

  return (
    <div>
      <Topbar title="Personnel" subtitle={`${praticiens.length} praticiens`} />
      <div style={{ padding: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>
            <Plus size={16} /> Ajouter praticien
          </button>
        </div>

        {/* Grille praticiens */}
        {loading ? (
          <p style={{ color: '#64748B', fontSize: 14 }}>Chargement...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {praticiens.map((p: any) => (
              <div key={p.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                {/* Avatar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: p.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <span style={{ color: 'white', fontSize: 22, fontWeight: 700 }}>{p.prenom[0]}{p.nom[0]}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0, textAlign: 'center' }}>
                    Dr. {p.prenom} {p.nom}
                  </h3>
                  <span style={{ background: '#DBEAFE', color: '#2563EB', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500, marginTop: 6 }}>
                    {p.specialite || 'Kinésithérapeute'}
                  </span>
                </div>

                {/* Infos contact */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                  {p.telephone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={14} style={{ color: '#64748B', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#374151' }}>{p.telephone}</span>
                    </div>
                  )}
                  {p.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Mail size={14} style={{ color: '#64748B', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#374151', wordBreak: 'break-all' }}>{p.email}</span>
                    </div>
                  )}
                </div>

                {/* Statut actif */}
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                  <span style={{ background: p.actif ? '#DCFCE7' : '#F1F5F9', color: p.actif ? '#16A34A' : '#64748B', padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>
                    {p.actif ? '● Actif' : '● Inactif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal ajouter praticien */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>Ajouter un praticien</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Prénom *</label>
                  <input value={form.prenom} onChange={e => setForm(f => ({...f, prenom: e.target.value}))} required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Nom *</label>
                  <input value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Spécialité</label>
                <input value={form.specialite} onChange={e => setForm(f => ({...f, specialite: e.target.value}))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} placeholder="Ex: Kiné sport" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Téléphone</label>
                  <input type="tel" value={form.telephone} onChange={e => setForm(f => ({...f, telephone: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Couleur</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COULEURS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({...f, couleur: c}))}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.couleur === c ? '3px solid #0F172A' : '2px solid white', cursor: 'pointer', boxShadow: '0 0 0 1px #E2E8F0' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#64748B' }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#2563EB', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  {saving ? 'Création...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
