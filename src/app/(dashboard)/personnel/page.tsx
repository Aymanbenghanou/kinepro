'use client'

import { useState, useEffect, useCallback } from 'react'
import Topbar from '@/components/layout/Topbar'
import Toast from '@/components/ui/Toast'
import { Plus, X, Phone, Mail, Edit2, UserCheck, UserX, Eye, EyeOff, RefreshCw, Shuffle } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

// ─── Constants ────────────────────────────────────────────────────────────────

const COULEURS = [
  '#2563EB', '#16A34A', '#F59E0B', '#EC4899',
  '#8B5CF6', '#06B6D4', '#EF4444', '#F97316',
]

const SPECIALITES = [
  'Kinésithérapeute',
  'Kinésithérapeute du sport',
  'Ostéopathe',
  'Secrétaire',
  'Assistant(e)',
  'Autre',
]

const EMPTY_FORM = {
  nom: '',
  prenom: '',
  specialite: 'Kinésithérapeute',
  telephone: '',
  email: '',
  couleur: '#2563EB',
  acces: false,
  password: '',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PraticienUser {
  id: string
  email: string
  isActive: boolean
  role: string
  lastLoginAt?: string | null
}

interface Praticien {
  id: string
  nom: string
  prenom: string
  specialite?: string | null
  telephone?: string | null
  email?: string | null
  couleur: string
  actif: boolean
  user?: PraticienUser | null
}

type ModalMode = 'add' | 'edit'
type FormState = typeof EMPTY_FORM

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function initials(p: Praticien): string {
  return `${p.prenom[0] ?? ''}${p.nom[0] ?? ''}`.toUpperCase()
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1.5px solid #E2E8F0',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  color: '#0F172A',
  background: 'white',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PersonnelPage() {
  const { t } = useTranslation()
  const [praticiens, setPraticiens] = useState<Praticien[]>([])
  const [loading, setLoading]       = useState(true)
  const [toast, setToast]           = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modal state
  const [mode, setMode]           = useState<ModalMode>('add')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [showPw, setShowPw]       = useState(false)

  // Acces management modal (standalone toggle for existing staff)
  const [accesModal, setAccesModal] = useState<{ praticien: Praticien } | null>(null)
  const [accesForm, setAccesForm]   = useState({ email: '', password: '' })
  const [accesShowPw, setAccesShowPw] = useState(false)
  const [accesSaving, setAccesSaving] = useState(false)

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ message, type })

  const fetchPraticiens = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/praticiens')
      const data = await res.json()
      setPraticiens(Array.isArray(data) ? data : [])
    } catch {
      showToast('Erreur lors du chargement', 'error')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPraticiens() }, [fetchPraticiens])

  // ── Open modal ──────────────────────────────────────────────────────────────

  function openAdd() {
    setMode('add')
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowPw(false)
    setShowModal(true)
  }

  function openEdit(p: Praticien) {
    setMode('edit')
    setEditId(p.id)
    setForm({
      nom:        p.nom,
      prenom:     p.prenom,
      specialite: p.specialite ?? 'Kinésithérapeute',
      telephone:  p.telephone  ?? '',
      email:      p.email      ?? '',
      couleur:    p.couleur,
      acces:      !!(p.user?.isActive),
      password:   '',
    })
    setShowPw(false)
    setShowModal(true)
  }

  // ── Save (add or edit) ──────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.prenom.trim()) {
      showToast('Nom et prénom sont requis', 'error')
      return
    }
    if (form.acces && !form.email.trim()) {
      showToast('Un email est requis pour activer l\'accès à l\'application', 'error')
      return
    }
    if (form.acces && !editId && form.password.length < 6) {
      showToast('Le mot de passe doit faire au moins 6 caractères', 'error')
      return
    }

    setSaving(true)
    try {
      let praticienId = editId

      if (mode === 'add') {
        // Create praticien
        const res = await fetch('/api/praticiens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom:        form.nom.trim(),
            prenom:     form.prenom.trim(),
            specialite: form.specialite,
            telephone:  form.telephone || null,
            email:      form.email || null,
            couleur:    form.couleur,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur serveur')
        praticienId = data.id
      } else {
        // Update praticien
        const res = await fetch(`/api/praticiens/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom:        form.nom.trim(),
            prenom:     form.prenom.trim(),
            specialite: form.specialite,
            telephone:  form.telephone || null,
            email:      form.email || null,
            couleur:    form.couleur,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      }

      // Handle access toggle
      if (form.acces && praticienId) {
        if (form.password) {
          // Create or update user account
          const res = await fetch(`/api/praticiens/${praticienId}/acces`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.email, password: form.password }),
          })
          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Erreur lors de la création du compte')
          }
        }
      } else if (!form.acces && editId) {
        // Check if existing user — deactivate access
        const existing = praticiens.find(p => p.id === editId)
        if (existing?.user?.isActive) {
          await fetch(`/api/praticiens/${editId}/acces`, { method: 'DELETE' })
        }
      }

      showToast(mode === 'add' ? 'Membre du personnel ajouté ✓' : 'Informations mises à jour ✓', 'success')
      setShowModal(false)
      fetchPraticiens()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur serveur', 'error')
    }
    setSaving(false)
  }

  // ── Toggle actif ────────────────────────────────────────────────────────────

  async function toggleActif(p: Praticien) {
    const action = p.actif ? 'désactiver' : 'réactiver'
    if (!confirm(`Voulez-vous ${action} ${p.prenom} ${p.nom} ?`)) return
    try {
      const res = await fetch(`/api/praticiens/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !p.actif }),
      })
      if (!res.ok) throw new Error()
      showToast(`${p.prenom} ${p.nom} ${p.actif ? 'désactivé' : 'réactivé'} ✓`, 'success')
      fetchPraticiens()
    } catch {
      showToast('Erreur lors de la mise à jour', 'error')
    }
  }

  // ── Standalone access modal ─────────────────────────────────────────────────

  function openAccesModal(p: Praticien) {
    setAccesModal({ praticien: p })
    setAccesForm({ email: p.email ?? '', password: '' })
    setAccesShowPw(false)
  }

  async function handleAccesSave(e: React.FormEvent) {
    e.preventDefault()
    if (!accesModal) return
    setAccesSaving(true)
    try {
      const res = await fetch(`/api/praticiens/${accesModal.praticien.id}/acces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accesForm.email, password: accesForm.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      showToast(`Accès application activé pour ${accesModal.praticien.prenom} ✓`, 'success')
      setAccesModal(null)
      fetchPraticiens()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur serveur', 'error')
    }
    setAccesSaving(false)
  }

  async function handleAccesRevoke(p: Praticien) {
    if (!confirm(`Révoquer l'accès de ${p.prenom} ${p.nom} à l'application ?`)) return
    try {
      const res = await fetch(`/api/praticiens/${p.id}/acces`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast(`Accès révoqué pour ${p.prenom} ${p.nom}`, 'success')
      fetchPraticiens()
    } catch {
      showToast('Erreur lors de la révocation', 'error')
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const actifs   = praticiens.filter(p => p.actif).length
  const inactifs = praticiens.filter(p => !p.actif).length
  const avecAcces = praticiens.filter(p => p.user?.isActive).length

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <Topbar title={t.personnel} subtitle={`${actifs} ${t.actif}${inactifs > 0 ? ` · ${inactifs} ${t.inactif}` : ''}`} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: 24 }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total personnel',      value: praticiens.length, color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Membres actifs',        value: actifs,            color: '#16A34A', bg: '#F0FDF4' },
            { label: 'Accès application',     value: avecAcces,         color: '#8B5CF6', bg: '#F5F3FF' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${color}25`, borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          >
            <Plus size={16} /> Ajouter un membre
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748B', fontSize: 14 }}>Chargement...</div>
        ) : praticiens.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748B', fontSize: 14, background: 'white', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            Aucun membre du personnel. Commencez par en ajouter un.
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 160px 140px 100px 90px 140px',
              gap: 0,
              padding: '10px 16px',
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              fontSize: 12,
              fontWeight: 700,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              <div />
              <div>Nom complet</div>
              <div>Spécialité</div>
              <div>Téléphone</div>
              <div>Accès app</div>
              <div>Statut</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            {/* Table rows */}
            {praticiens.map((p, i) => {
              const hasAccess = !!(p.user?.isActive)
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 160px 140px 100px 90px 140px',
                    gap: 0,
                    padding: '13px 16px',
                    borderBottom: i < praticiens.length - 1 ? '1px solid #F1F5F9' : 'none',
                    alignItems: 'center',
                    opacity: p.actif ? 1 : 0.55,
                    transition: 'background 0.1s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: p.actif ? p.couleur : '#CBD5E1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{initials(p)}</span>
                  </div>

                  {/* Nom complet */}
                  <div>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                      {p.prenom} {p.nom}
                    </div>
                    {p.email && (
                      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={11} /> {p.email}
                      </div>
                    )}
                  </div>

                  {/* Spécialité */}
                  <div>
                    <span style={{
                      background: '#EFF6FF', color: '#2563EB',
                      padding: '3px 8px', borderRadius: 999,
                      fontSize: 12, fontWeight: 500,
                    }}>
                      {p.specialite || 'Kinésithérapeute'}
                    </span>
                  </div>

                  {/* Téléphone */}
                  <div style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {p.telephone ? (
                      <><Phone size={12} style={{ color: '#94A3B8' }} /> {p.telephone}</>
                    ) : (
                      <span style={{ color: '#CBD5E1' }}>—</span>
                    )}
                  </div>

                  {/* Accès app */}
                  <div>
                    <span style={{
                      background: hasAccess ? '#F0FDF4' : '#F8FAFC',
                      color: hasAccess ? '#16A34A' : '#94A3B8',
                      border: `1px solid ${hasAccess ? '#BBF7D0' : '#E2E8F0'}`,
                      padding: '3px 9px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {hasAccess ? '✓ Oui' : '✗ Non'}
                    </span>
                  </div>

                  {/* Statut */}
                  <div>
                    <span style={{
                      background: p.actif ? '#DCFCE7' : '#F1F5F9',
                      color: p.actif ? '#16A34A' : '#64748B',
                      padding: '3px 9px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {p.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {/* Edit */}
                    <button
                      onClick={() => openEdit(p)}
                      title="Modifier"
                      style={{ padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 7, background: 'white', cursor: 'pointer', color: '#2563EB', display: 'flex', alignItems: 'center' }}
                    >
                      <Edit2 size={14} />
                    </button>

                    {/* Access toggle */}
                    {p.actif && !hasAccess && (
                      <button
                        onClick={() => openAccesModal(p)}
                        title="Activer accès app"
                        style={{ padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 7, background: 'white', cursor: 'pointer', color: '#8B5CF6', display: 'flex', alignItems: 'center' }}
                      >
                        <UserCheck size={14} />
                      </button>
                    )}
                    {p.actif && hasAccess && (
                      <button
                        onClick={() => handleAccesRevoke(p)}
                        title="Révoquer accès app"
                        style={{ padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 7, background: 'white', cursor: 'pointer', color: '#F59E0B', display: 'flex', alignItems: 'center' }}
                      >
                        <UserX size={14} />
                      </button>
                    )}

                    {/* Deactivate / Reactivate */}
                    <button
                      onClick={() => toggleActif(p)}
                      title={p.actif ? 'Désactiver' : 'Réactiver'}
                      style={{ padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 7, background: 'white', cursor: 'pointer', color: p.actif ? '#EF4444' : '#16A34A', display: 'flex', alignItems: 'center' }}
                    >
                      {p.actif ? <UserX size={14} /> : <RefreshCw size={14} />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 540, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {mode === 'add' ? 'Ajouter un membre' : 'Modifier le membre'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nom / Prénom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Prénom <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    value={form.prenom}
                    onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                    required
                    placeholder="Karim"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Nom <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    value={form.nom}
                    onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                    required
                    placeholder="Amrani"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Spécialité */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Spécialité / Rôle</label>
                <select
                  value={form.specialite}
                  onChange={e => setForm(f => ({ ...f, specialite: e.target.value }))}
                  style={{ ...inputStyle, appearance: 'auto' }}
                >
                  {SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Téléphone / Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Téléphone</label>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    placeholder="0600000000"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="karim@cabinet.ma"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Couleur */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Couleur (agenda)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COULEURS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, couleur: c }))}
                      style={{
                        width: 30, height: 30, borderRadius: '50%', background: c, border: 'none',
                        cursor: 'pointer',
                        boxShadow: form.couleur === c
                          ? `0 0 0 2px white, 0 0 0 4px ${c}`
                          : '0 0 0 1px #E2E8F0',
                        transition: 'box-shadow 0.15s',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Accès application toggle */}
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Accès à l'application</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      Permet à ce membre de se connecter à KinéPro
                    </div>
                  </div>
                  {/* Toggle switch */}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, acces: !f.acces }))}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: form.acces ? '#2563EB' : '#CBD5E1',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: form.acces ? 23 : 3,
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>

                {form.acces && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                        Email de connexion <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="karim@cabinet.ma"
                        required={form.acces}
                        style={{ ...inputStyle, fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                        Mot de passe{mode === 'edit' ? ' (laisser vide = inchangé)' : ' *'}
                      </label>
                      <div style={{ position: 'relative', display: 'flex', gap: 6 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type={showPw ? 'text' : 'password'}
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            placeholder="Min. 6 caractères"
                            style={{ ...inputStyle, fontSize: 13, paddingRight: 36 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(v => !v)}
                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                          >
                            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                          title="Générer un mot de passe"
                          style={{ padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                        >
                          <Shuffle size={14} />
                        </button>
                      </div>
                      {form.password && (
                        <p style={{ fontSize: 11, color: '#8B5CF6', marginTop: 4 }}>
                          Pensez à communiquer ce mot de passe au membre du personnel.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#64748B', fontSize: 14 }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 8, background: saving ? '#93C5FD' : '#2563EB', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14 }}
                >
                  {saving ? 'Enregistrement...' : mode === 'add' ? 'Ajouter' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Accès application modal (standalone, for existing staff) ─────────── */}
      {accesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Activer l'accès application</h2>
              <button onClick={() => setAccesModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: accesModal.praticien.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{initials(accesModal.praticien)}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{accesModal.praticien.prenom} {accesModal.praticien.nom}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{accesModal.praticien.specialite || 'Kinésithérapeute'}</div>
              </div>
            </div>

            <form onSubmit={handleAccesSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Email de connexion <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={accesForm.email}
                  onChange={e => setAccesForm(f => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="karim@cabinet.ma"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Mot de passe <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={accesShowPw ? 'text' : 'password'}
                      value={accesForm.password}
                      onChange={e => setAccesForm(f => ({ ...f, password: e.target.value }))}
                      required
                      minLength={6}
                      placeholder="Min. 6 caractères"
                      style={{ ...inputStyle, paddingRight: 36 }}
                    />
                    <button
                      type="button"
                      onClick={() => setAccesShowPw(v => !v)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                    >
                      {accesShowPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAccesForm(f => ({ ...f, password: generatePassword() }))}
                    title="Générer un mot de passe"
                    style={{ padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                  >
                    <Shuffle size={14} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setAccesModal(null)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#64748B' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={accesSaving}
                  style={{ flex: 2, padding: '10px', border: 'none', borderRadius: 8, background: accesSaving ? '#93C5FD' : '#8B5CF6', color: 'white', cursor: accesSaving ? 'not-allowed' : 'pointer', fontWeight: 700 }}
                >
                  {accesSaving ? 'Activation...' : 'Activer l\'accès'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
