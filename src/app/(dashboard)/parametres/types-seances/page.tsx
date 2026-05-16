'use client'

import { useState, useEffect, useCallback } from 'react'
import Topbar from '@/components/layout/Topbar'
import Toast from '@/components/ui/Toast'
import { Plus, X, Pencil, Trash2, Globe, User, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SeanceType {
  id: string
  nom: string
  description?: string | null
  dureeDefaut: number
  tarifDefaut: number
  couleur: string
  actif: boolean
  isDefault: boolean
  praticienId: string | null
  praticien?: { id: string; nom: string; prenom: string } | null
}

type Tab = 'global' | 'personal'

const COULEURS = [
  { hex: '#2563EB', label: 'Bleu'    },
  { hex: '#16A34A', label: 'Vert'    },
  { hex: '#7C3AED', label: 'Violet'  },
  { hex: '#D97706', label: 'Orange'  },
  { hex: '#DC2626', label: 'Rouge'   },
  { hex: '#0D9488', label: 'Teal'    },
  { hex: '#0EA5E9', label: 'Ciel'    },
  { hex: '#9333EA', label: 'Pourpre' },
  { hex: '#C2410C', label: 'Brique'  },
  { hex: '#1E3A5F', label: 'Marine'  },
]

const EMPTY_FORM = {
  nom: '', description: '', dureeDefaut: '45', tarifDefaut: '300',
  couleur: '#2563EB', actif: true, praticienId: '',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #E2E8F0', borderRadius: 8,
  fontSize: 14, color: '#0F172A', background: 'white',
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#374151',
  display: 'block', marginBottom: 6,
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TypesSeancesPage() {
  const [types, setTypes]           = useState<SeanceType[]>([])
  const [praticiens, setPraticiens] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState<Tab>('global')

  const [showModal, setShowModal]       = useState(false)
  const [editTarget, setEditTarget]     = useState<SeanceType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SeanceType | null>(null)
  const [deleteError, setDeleteError]   = useState<string | null>(null)
  const [form, setForm]                 = useState({ ...EMPTY_FORM })
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchTypes = useCallback(async () => {
    try {
      const res  = await fetch('/api/seance-types?all=true')
      const data = await res.json()
      setTypes(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  useEffect(() => {
    Promise.all([
      fetchTypes(),
      fetch('/api/praticiens').then(r => r.json()).then(d => setPraticiens(Array.isArray(d) ? d : [])),
    ]).finally(() => setLoading(false))
  }, [fetchTypes])

  // ── Derived lists ──────────────────────────────────────────────────────────

  const globalTypes   = types.filter(t => t.praticienId === null)
  const personalTypes = types.filter(t => t.praticienId !== null)

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openAdd(tab: Tab) {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, praticienId: tab === 'personal' ? (praticiens[0]?.id || '') : '' })
    setShowModal(true)
  }

  function openEdit(t: SeanceType) {
    setEditTarget(t)
    setForm({
      nom:         t.nom,
      description: t.description  || '',
      dureeDefaut: String(t.dureeDefaut),
      tarifDefaut: String(t.tarifDefaut),
      couleur:     t.couleur,
      actif:       t.actif,
      praticienId: t.praticienId  || '',
    })
    setShowModal(true)
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.nom.trim()) {
      setToast({ message: 'Le nom est obligatoire', type: 'error' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        nom:         form.nom.trim(),
        description: form.description || null,
        dureeDefaut: parseInt(form.dureeDefaut)   || 45,
        tarifDefaut: parseFloat(form.tarifDefaut) || 300,
        couleur:     form.couleur,
        actif:       form.actif,
        praticienId: form.praticienId || null,
      }

      let res: Response
      if (editTarget) {
        res = await fetch(`/api/seance-types/${editTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/seance-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')

      setShowModal(false)
      await fetchTypes()
      setToast({ message: editTarget ? 'Type modifié ✓' : 'Type ajouté ✓', type: 'success' })
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur serveur', type: 'error' })
    }
    setSaving(false)
  }

  async function handleDelete(t: SeanceType) {
    setDeleteError(null)
    try {
      const res  = await fetch(`/api/seance-types/${t.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        if (data.inUse) {
          setDeleteError(data.error)
          return
        }
        throw new Error(data.error || 'Erreur serveur')
      }
      setDeleteTarget(null)
      await fetchTypes()
      setToast({ message: 'Type supprimé', type: 'success' })
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur suppression', type: 'error' })
      setDeleteTarget(null)
    }
  }

  async function toggleActif(t: SeanceType) {
    try {
      const res  = await fetch(`/api/seance-types/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !t.actif }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      setTypes(prev => prev.map(x => x.id === t.id ? { ...x, actif: !x.actif } : x))
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur', type: 'error' })
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function TypesTable({ list, tab }: { list: SeanceType[]; tab: Tab }) {
    return (
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {tab === 'global' ? <Globe size={15} color="#2563EB" /> : <User size={15} color="#7C3AED" />}
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
              {tab === 'global'
                ? `${list.length} type${list.length > 1 ? 's' : ''} global${list.length > 1 ? 'aux' : ''}`
                : `${list.length} type${list.length > 1 ? 's' : ''} personnel${list.length > 1 ? 's' : ''}`}
            </span>
          </div>
          <button
            onClick={() => openAdd(tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: tab === 'global' ? '#2563EB' : '#7C3AED',
              color: 'white', border: 'none', borderRadius: 7,
              padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>

        {list.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
            {tab === 'global'
              ? 'Aucun type global défini.'
              : 'Aucun type personnel. Cliquez sur Ajouter.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Couleur', 'Nom', 'Durée', 'Tarif', 'Statut', ...(tab === 'personal' ? ['Praticien'] : []), 'Actions']
                    .map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#64748B', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {list.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                    {/* Couleur */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, background: t.couleur, border: '1px solid rgba(0,0,0,0.08)' }} />
                    </td>

                    {/* Nom + badges */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>{t.nom}</span>
                        {t.isDefault && (
                          <span style={{
                            background: '#F0FDF4', color: '#16A34A',
                            fontSize: 10, fontWeight: 700,
                            padding: '2px 7px', borderRadius: 999,
                            border: '1px solid #BBF7D0',
                            whiteSpace: 'nowrap',
                          }}>
                            Par défaut
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{t.description}</div>
                      )}
                    </td>

                    {/* Durée */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#DBEAFE', color: '#2563EB', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                        {t.dureeDefaut} min
                      </span>
                    </td>

                    {/* Tarif */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{t.tarifDefaut} MAD</span>
                    </td>

                    {/* Statut toggle */}
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => toggleActif(t)}
                        style={{
                          padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                          border: 'none', cursor: 'pointer',
                          background: t.actif ? '#DCFCE7' : '#F1F5F9',
                          color: t.actif ? '#16A34A' : '#64748B',
                        }}
                      >
                        {t.actif ? '● Actif' : '○ Inactif'}
                      </button>
                    </td>

                    {/* Praticien (personal tab only) */}
                    {tab === 'personal' && (
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                        {t.praticien ? `Dr. ${t.praticien.prenom} ${t.praticien.nom}` : '—'}
                      </td>
                    )}

                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => openEdit(t)}
                          title="Modifier"
                          style={{ padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 7, background: 'white', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(t); setDeleteError(null) }}
                          title="Supprimer"
                          style={{ padding: '6px 10px', border: '1px solid #FEE2E2', borderRadius: 7, background: '#FFF5F5', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <Topbar title="Types de séances" subtitle={`${types.length} types configurés`} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: 24 }}>

        {/* Empty-state CTA when no types exist yet */}
        {!loading && types.length === 0 && (
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <AlertTriangle size={22} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#92400E', margin: 0 }}>Aucun type de séance configuré</p>
              <p style={{ fontSize: 13, color: '#B45309', margin: '4px 0 0' }}>
                Les types de séance permettent de pré-remplir la durée et le tarif lors de la création d'un RDV ou d'une séance.
                Cliquez sur « Ajouter » pour créer votre premier type.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#F1F5F9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {([
            { key: 'global'   as Tab, label: '🌐 Types globaux'   },
            { key: 'personal' as Tab, label: '👤 Types personnels' },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 500, fontSize: 13,
                background: activeTab === tab.key ? 'white' : 'transparent',
                color: activeTab === tab.key ? '#0F172A' : '#64748B',
                boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Info banner */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#1D4ED8' }}>
          {activeTab === 'global'
            ? '🌐 Les types globaux sont disponibles pour tous les praticiens du cabinet.'
            : '👤 Les types personnels sont visibles uniquement par le praticien concerné, en plus des types globaux.'}
        </div>

        {loading ? (
          <p style={{ color: '#64748B', fontSize: 14 }}>Chargement...</p>
        ) : (
          <TypesTable list={activeTab === 'global' ? globalTypes : personalTypes} tab={activeTab} />
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="modal-sheet" style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                {editTarget ? 'Modifier le type' : 'Nouveau type de séance'}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {/* Default type notice */}
            {editTarget?.isDefault && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#166534', display: 'flex', gap: 8 }}>
                <span>✓</span>
                <span>Type par défaut — vous pouvez modifier la durée, le tarif et la couleur.</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Nom */}
              <div>
                <label style={labelStyle}>Nom <span style={{ color: '#DC2626' }}>*</span></label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Rééducation lombaire"
                  style={inputStyle} />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optionnel)</span></label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brève description du type de séance..."
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Durée + Tarif */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Durée par défaut (min)</label>
                  <input type="number" min="5" max="240"
                    value={form.dureeDefaut}
                    onChange={e => setForm(f => ({ ...f, dureeDefaut: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tarif par défaut (MAD)</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" min="0"
                      value={form.tarifDefaut}
                      onChange={e => setForm(f => ({ ...f, tarifDefaut: e.target.value }))}
                      style={{ ...inputStyle, paddingRight: 50 }} />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#64748B', fontWeight: 600 }}>MAD</span>
                  </div>
                </div>
              </div>

              {/* Couleur */}
              <div>
                <label style={labelStyle}>Couleur</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COULEURS.map(c => (
                    <button key={c.hex} type="button"
                      title={c.label}
                      onClick={() => setForm(f => ({ ...f, couleur: c.hex }))}
                      style={{
                        width: 32, height: 32, borderRadius: 7, background: c.hex,
                        border: form.couleur === c.hex ? '3px solid #0F172A' : '2px solid transparent',
                        cursor: 'pointer',
                        boxShadow: form.couleur === c.hex ? `0 0 0 3px ${c.hex}50` : '0 1px 3px rgba(0,0,0,0.15)',
                        transition: 'box-shadow 0.15s',
                      }} />
                  ))}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: form.couleur }} />
                  <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace' }}>{form.couleur}</span>
                </div>
              </div>

              {/* Praticien scope */}
              <div>
                <label style={labelStyle}>Portée</label>
                <select
                  value={form.praticienId}
                  onChange={e => setForm(f => ({ ...f, praticienId: e.target.value }))}
                  style={{ ...inputStyle, background: 'white' }}
                >
                  <option value="">Global (partagé avec tous les praticiens)</option>
                  {praticiens.map((p: any) => (
                    <option key={p.id} value={p.id}>Personnel — Dr. {p.prenom} {p.nom}</option>
                  ))}
                </select>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Laissez sur « Global » pour que tous les praticiens puissent utiliser ce type.
                </p>
              </div>

              {/* Actif toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, actif: !f.actif }))}
                  style={{
                    width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: form.actif ? '#16A34A' : '#CBD5E1',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2,
                    left: form.actif ? 22 : 2,
                    width: 20, height: 20, borderRadius: '50%', background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s',
                  }} />
                </button>
                <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                  {form.actif ? 'Type actif' : 'Type inactif'}
                </span>
              </div>

              {/* Preview */}
              {form.nom && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 12 }}>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 8px', fontWeight: 600 }}>Aperçu dans l'agenda :</p>
                  <div style={{
                    background: form.couleur, color: 'white', borderRadius: 6,
                    padding: '6px 10px', fontSize: 12, fontWeight: 600, display: 'inline-block',
                  }}>
                    {form.nom} · {form.dureeDefaut} min · {form.tarifDefaut} MAD
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '11px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#64748B' }}>
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 8, background: saving ? '#93C5FD' : '#2563EB', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  {saving ? 'Enregistrement...' : editTarget ? 'Modifier' : 'Créer le type'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="modal-sheet" style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Trash2 size={22} color="#DC2626" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>Supprimer ce type ?</h3>
              <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
                <strong style={{ color: '#0F172A' }}>« {deleteTarget.nom} »</strong> sera définitivement supprimé.
              </p>
              {deleteTarget.isDefault && (
                <p style={{ fontSize: 12, color: '#D97706', marginTop: 8, background: '#FFF7ED', borderRadius: 6, padding: '6px 10px' }}>
                  ⚠️ Il s'agit d'un type par défaut. La suppression est possible mais irréversible.
                </p>
              )}
            </div>

            {/* In-use error */}
            {deleteError && (
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', margin: '0 0 4px' }}>Suppression impossible</p>
                  <p style={{ fontSize: 13, color: '#B45309', margin: 0 }}>{deleteError}</p>
                  <button
                    onClick={() => { toggleActif(deleteTarget); setDeleteTarget(null) }}
                    style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: '#D97706', background: 'none', border: '1px solid #FDE68A', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                  >
                    Désactiver à la place →
                  </button>
                </div>
              </div>
            )}

            {!deleteError && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setDeleteTarget(null); setDeleteError(null) }}
                  style={{ flex: 1, padding: '11px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#64748B' }}>
                  Annuler
                </button>
                <button onClick={() => handleDelete(deleteTarget)}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 8, background: '#DC2626', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Supprimer
                </button>
              </div>
            )}
            {deleteError && (
              <button onClick={() => { setDeleteTarget(null); setDeleteError(null) }}
                style={{ width: '100%', padding: '11px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#64748B' }}>
                Fermer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
