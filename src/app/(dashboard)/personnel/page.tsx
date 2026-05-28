'use client'

import { useState, useEffect, useCallback } from 'react'
import Topbar from '@/components/layout/Topbar'
import Toast from '@/components/ui/Toast'
import { Plus, X, Phone, Mail, Edit2, UserCheck, UserX, Eye, EyeOff, RefreshCw, Shuffle, Lock } from 'lucide-react'
import { PRESETS, PERMISSION_KEYS, type PermissionKey } from '@/lib/permissions'

// ─── Constants ────────────────────────────────────────────────────────────────

const COULEURS = [
  '#2563EB', '#16A34A', '#F59E0B', '#EC4899',
  '#8B5CF6', '#06B6D4', '#EF4444', '#F97316',
]

// Liste des spécialités pour Praticien uniquement (plus de 'Secrétaire' ici).
const SPECIALITES = [
  'Kinésithérapeute',
  'Kinésithérapeute du sport',
  'Ostéopathe',
  'Assistant(e)',
  'Autre',
]

// Libellés humains des 5 permissions granulaires.
const PERMISSION_LABELS: Record<PermissionKey, { title: string; help: string }> = {
  agenda:            { title: 'Agenda & RDV',            help: 'Voir et gérer les rendez-vous du cabinet' },
  patients:          { title: 'Patients',                help: 'Consulter et modifier la fiche patients' },
  dossierMedical:    { title: 'Dossier médical',         help: 'Accéder aux séances et au dossier médical' },
  programmesEtDocs:  { title: 'Programmes & documents',  help: 'Créer programmes d\'exercices et documents patient' },
  factures:          { title: 'Factures & paiements',    help: 'Consulter et gérer la facturation' },
}

type Role = 'PRATICIEN' | 'SECRETAIRE'

type FormState = {
  role:        Role
  nom:         string
  prenom:      string
  specialite:  string
  telephone:   string
  email:       string
  couleur:     string
  acces:       boolean
  password:    string
  permissions: Record<PermissionKey, boolean>
}

const EMPTY_FORM: FormState = {
  role:        'PRATICIEN',
  nom:         '',
  prenom:      '',
  specialite:  'Kinésithérapeute',
  telephone:   '',
  email:       '',
  couleur:     '#2563EB',
  acces:       false,
  password:    '',
  permissions: { ...PRESETS.PRATICIEN } as Record<PermissionKey, boolean>,
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  id:           string
  kind:         'praticien' | 'secretaire'
  role:         Role
  nom:          string
  prenom:       string
  telephone?:   string | null
  email?:       string | null
  specialite?:  string | null
  couleur?:     string | null
  actif:        boolean
  hasAcces:     boolean
  isActive:     boolean
  permissions:  Record<string, unknown>
  userId?:      string | null
  lastLoginAt?: string | null
}

type ModalMode = 'add' | 'edit'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function initials(m: { prenom: string; nom: string }): string {
  return `${m.prenom[0] ?? ''}${m.nom[0] ?? ''}`.toUpperCase()
}

function normalizePermsFromApi(perms: Record<string, unknown> | undefined | null): Record<PermissionKey, boolean> {
  const out = {} as Record<PermissionKey, boolean>
  for (const k of PERMISSION_KEYS) out[k] = perms?.[k] === true
  return out
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
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modal state
  const [mode, setMode]           = useState<ModalMode>('add')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [showPw, setShowPw]       = useState(false)

  // Acces management modal (standalone toggle for existing staff)
  const [accesModal, setAccesModal] = useState<{ member: Member } | null>(null)
  const [accesForm, setAccesForm]   = useState({ email: '', password: '' })
  const [accesShowPw, setAccesShowPw] = useState(false)
  const [accesSaving, setAccesSaving] = useState(false)

  const showToast = (message: string, type: 'success' | 'error') =>
    setToast({ message, type })

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/praticiens')
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : [])
    } catch {
      showToast('Erreur lors du chargement', 'error')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  // ── Open modal ──────────────────────────────────────────────────────────────

  function openAdd() {
    setMode('add')
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowPw(false)
    setShowModal(true)
  }

  function openEdit(m: Member) {
    setMode('edit')
    setEditId(m.id)
    const isPraticien = m.role === 'PRATICIEN'
    setForm({
      role:        m.role,
      nom:         m.nom,
      prenom:      m.prenom,
      specialite:  m.specialite ?? (isPraticien ? 'Kinésithérapeute' : ''),
      telephone:   m.telephone  ?? '',
      email:       m.email      ?? '',
      couleur:     m.couleur    ?? '#2563EB',
      acces:       m.role === 'SECRETAIRE' ? true : m.hasAcces,
      password:    '',
      permissions: {
        ...normalizePermsFromApi(m.permissions),
        // Garde-fou client : Praticien → agenda toujours actif.
        ...(isPraticien ? { agenda: true } : {}),
      } as Record<PermissionKey, boolean>,
    })
    setShowPw(false)
    setShowModal(true)
  }

  // ── Role change → reset permissions to preset + reset acces rules ──────────

  function changeRole(nextRole: Role) {
    setForm(f => ({
      ...f,
      role: nextRole,
      // Auto-fill permissions selon le preset du rôle.
      permissions: { ...PRESETS[nextRole] } as Record<PermissionKey, boolean>,
      // Secrétaire requiert toujours un accès app.
      acces: nextRole === 'SECRETAIRE' ? true : f.acces,
      // Si on passe à Secrétaire, on vide la spécialité (UI ne l'affiche plus).
      specialite: nextRole === 'PRATICIEN' ? (f.specialite || 'Kinésithérapeute') : '',
    }))
  }

  function togglePermission(key: PermissionKey) {
    setForm(f => {
      // Garde-fou client : un Praticien garde toujours l'agenda actif.
      if (f.role === 'PRATICIEN' && key === 'agenda') return f
      return { ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }
    })
  }

  // ── Save (add or edit) ──────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.prenom.trim()) {
      showToast('Nom et prénom sont requis', 'error')
      return
    }
    if (form.role === 'PRATICIEN' && !form.specialite.trim()) {
      showToast('Spécialité requise pour un praticien', 'error')
      return
    }
    if (form.role === 'SECRETAIRE' && !form.acces) {
      // Garde-fou UI : on ne devrait jamais arriver ici, mais au cas où.
      showToast('Un secrétaire requiert obligatoirement un accès à l\'application', 'error')
      return
    }
    if (form.acces && !form.email.trim()) {
      showToast('Un email est requis pour activer l\'accès à l\'application', 'error')
      return
    }
    if (form.acces && mode === 'add' && form.password.length < 6) {
      showToast('Le mot de passe doit faire au moins 6 caractères', 'error')
      return
    }

    setSaving(true)
    try {
      // Construction des permissions à envoyer (avec garde-fou client).
      const permsToSend = { ...form.permissions } as Record<string, boolean>
      if (form.role === 'PRATICIEN') permsToSend.agenda = true

      if (mode === 'add') {
        // Création : un seul POST gère role + permissions + accès.
        const body: Record<string, unknown> = {
          role:        form.role,
          nom:         form.nom.trim(),
          prenom:      form.prenom.trim(),
          telephone:   form.telephone || null,
          acces:       form.acces,
          permissions: permsToSend,
        }
        if (form.role === 'PRATICIEN') {
          body.specialite = form.specialite.trim()
          body.couleur    = form.couleur
        }
        if (form.acces) {
          body.email    = form.email.trim()
          body.password = form.password
        }
        const res = await fetch('/api/praticiens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      } else {
        // Édition : on ne change PAS le rôle. On met à jour identité + permissions.
        const body: Record<string, unknown> = {
          nom:         form.nom.trim(),
          prenom:      form.prenom.trim(),
          telephone:   form.telephone || null,
          permissions: permsToSend,
        }
        if (form.role === 'PRATICIEN') {
          body.specialite = form.specialite.trim()
          body.couleur    = form.couleur
        }
        const res = await fetch(`/api/praticiens/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur serveur')

        // Gestion accès en édition.
        const existing = members.find(m => m.id === editId)
        if (form.acces) {
          // Si on saisit un nouveau mot de passe OU si on (ré)active un compte → POST /acces.
          if (form.password) {
            const ar = await fetch(`/api/praticiens/${editId}/acces`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: form.email.trim(), password: form.password, permissions: permsToSend }),
            })
            if (!ar.ok) {
              const ad = await ar.json()
              throw new Error(ad.error || 'Erreur lors de la mise à jour de l\'accès')
            }
          }
        } else if (existing?.hasAcces && form.role !== 'SECRETAIRE') {
          // Praticien dont on coupe l'accès.
          await fetch(`/api/praticiens/${editId}/acces`, { method: 'DELETE' })
        }
      }

      showToast(mode === 'add' ? 'Membre ajouté ✓' : 'Informations mises à jour ✓', 'success')
      setShowModal(false)
      fetchMembers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur serveur', 'error')
    }
    setSaving(false)
  }

  // ── Toggle actif (Praticien seulement — Secrétaire passe par accès) ────────

  async function toggleActif(m: Member) {
    if (m.kind !== 'praticien') return
    const action = m.actif ? 'désactiver' : 'réactiver'
    if (!confirm(`Voulez-vous ${action} ${m.prenom} ${m.nom} ?`)) return
    try {
      const res = await fetch(`/api/praticiens/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !m.actif }),
      })
      if (!res.ok) throw new Error()
      showToast(`${m.prenom} ${m.nom} ${m.actif ? 'désactivé' : 'réactivé'} ✓`, 'success')
      fetchMembers()
    } catch {
      showToast('Erreur lors de la mise à jour', 'error')
    }
  }

  // ── Standalone access modal ─────────────────────────────────────────────────

  function openAccesModal(m: Member) {
    setAccesModal({ member: m })
    setAccesForm({ email: m.email ?? '', password: '' })
    setAccesShowPw(false)
  }

  async function handleAccesSave(e: React.FormEvent) {
    e.preventDefault()
    if (!accesModal) return
    setAccesSaving(true)
    try {
      const res = await fetch(`/api/praticiens/${accesModal.member.id}/acces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accesForm.email, password: accesForm.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      showToast(`Accès activé pour ${accesModal.member.prenom} ✓`, 'success')
      setAccesModal(null)
      fetchMembers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur serveur', 'error')
    }
    setAccesSaving(false)
  }

  async function handleAccesRevoke(m: Member) {
    if (!confirm(`Révoquer l'accès de ${m.prenom} ${m.nom} à l'application ?`)) return
    try {
      const res = await fetch(`/api/praticiens/${m.id}/acces`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast(`Accès révoqué pour ${m.prenom} ${m.nom}`, 'success')
      fetchMembers()
    } catch {
      showToast('Erreur lors de la révocation', 'error')
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const total      = members.length
  const praticiens = members.filter(m => m.role === 'PRATICIEN').length
  const secretaires = members.filter(m => m.role === 'SECRETAIRE').length
  const avecAcces  = members.filter(m => m.hasAcces && m.isActive).length

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <Topbar
        title="Personnel"
        subtitle={`${praticiens} praticien${praticiens > 1 ? 's' : ''} · ${secretaires} secrétaire${secretaires > 1 ? 's' : ''}`}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: 24 }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total personnel',  value: total,     color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Praticiens',       value: praticiens, color: '#16A34A', bg: '#F0FDF4' },
            { label: 'Accès application', value: avecAcces, color: '#8B5CF6', bg: '#F5F3FF' },
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
        ) : members.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748B', fontSize: 14, background: 'white', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            Aucun membre du personnel. Commencez par en ajouter un.
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 130px 160px 140px 100px 90px 140px',
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
              <div>Rôle</div>
              <div>Spécialité</div>
              <div>Téléphone</div>
              <div>Accès app</div>
              <div>Statut</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            {/* Table rows */}
            {members.map((m, i) => {
              const hasAccess = m.hasAcces && m.isActive
              const isPraticien = m.role === 'PRATICIEN'
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 130px 160px 140px 100px 90px 140px',
                    gap: 0,
                    padding: '13px 16px',
                    borderBottom: i < members.length - 1 ? '1px solid #F1F5F9' : 'none',
                    alignItems: 'center',
                    opacity: m.actif ? 1 : 0.55,
                    transition: 'background 0.1s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: m.actif
                      ? (isPraticien ? (m.couleur || '#2563EB') : '#8B5CF6')
                      : '#CBD5E1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{initials(m)}</span>
                  </div>

                  {/* Nom complet */}
                  <div>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                      {m.prenom} {m.nom}
                    </div>
                    {m.email && (
                      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={11} /> {m.email}
                      </div>
                    )}
                  </div>

                  {/* Rôle badge */}
                  <div>
                    <span style={{
                      background: isPraticien ? '#EFF6FF' : '#F5F3FF',
                      color:      isPraticien ? '#2563EB' : '#8B5CF6',
                      border:    `1px solid ${isPraticien ? '#BFDBFE' : '#DDD6FE'}`,
                      padding: '3px 9px', borderRadius: 999,
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {isPraticien ? 'Praticien' : 'Secrétaire'}
                    </span>
                  </div>

                  {/* Spécialité (praticien uniquement) */}
                  <div>
                    {isPraticien ? (
                      <span style={{
                        background: '#F1F5F9', color: '#475569',
                        padding: '3px 8px', borderRadius: 999,
                        fontSize: 12, fontWeight: 500,
                      }}>
                        {m.specialite || 'Kinésithérapeute'}
                      </span>
                    ) : (
                      <span style={{ color: '#CBD5E1' }}>—</span>
                    )}
                  </div>

                  {/* Téléphone */}
                  <div style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {m.telephone ? (
                      <><Phone size={12} style={{ color: '#94A3B8' }} /> {m.telephone}</>
                    ) : (
                      <span style={{ color: '#CBD5E1' }}>—</span>
                    )}
                  </div>

                  {/* Accès app */}
                  <div>
                    <span style={{
                      background: hasAccess ? '#F0FDF4' : '#F8FAFC',
                      color:      hasAccess ? '#16A34A' : '#94A3B8',
                      border:    `1px solid ${hasAccess ? '#BBF7D0' : '#E2E8F0'}`,
                      padding: '3px 9px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {hasAccess ? '✓ Oui' : '✗ Non'}
                    </span>
                  </div>

                  {/* Statut */}
                  <div>
                    <span style={{
                      background: m.actif ? '#DCFCE7' : '#F1F5F9',
                      color:      m.actif ? '#16A34A' : '#64748B',
                      padding: '3px 9px', borderRadius: 999,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {m.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {/* Edit */}
                    <button
                      onClick={() => openEdit(m)}
                      title="Modifier"
                      style={{ padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 7, background: 'white', cursor: 'pointer', color: '#2563EB', display: 'flex', alignItems: 'center' }}
                    >
                      <Edit2 size={14} />
                    </button>

                    {/* Access toggle */}
                    {m.actif && !hasAccess && (
                      <button
                        onClick={() => openAccesModal(m)}
                        title="Activer accès app"
                        style={{ padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 7, background: 'white', cursor: 'pointer', color: '#8B5CF6', display: 'flex', alignItems: 'center' }}
                      >
                        <UserCheck size={14} />
                      </button>
                    )}
                    {m.actif && hasAccess && (
                      <button
                        onClick={() => handleAccesRevoke(m)}
                        title="Révoquer accès app"
                        style={{ padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 7, background: 'white', cursor: 'pointer', color: '#F59E0B', display: 'flex', alignItems: 'center' }}
                      >
                        <UserX size={14} />
                      </button>
                    )}

                    {/* Deactivate / Reactivate — Praticien uniquement */}
                    {isPraticien && (
                      <button
                        onClick={() => toggleActif(m)}
                        title={m.actif ? 'Désactiver' : 'Réactiver'}
                        style={{ padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 7, background: 'white', cursor: 'pointer', color: m.actif ? '#EF4444' : '#16A34A', display: 'flex', alignItems: 'center' }}
                      >
                        {m.actif ? <UserX size={14} /> : <RefreshCw size={14} />}
                      </button>
                    )}
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
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {mode === 'add' ? 'Ajouter un membre' : 'Modifier le membre'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* ── Étape 1 : choix du rôle ─────────────────────────────────── */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Rôle <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['PRATICIEN', 'SECRETAIRE'] as Role[]).map(r => {
                    const isActive = form.role === r
                    const isDisabled = mode === 'edit'
                    const accent = r === 'PRATICIEN' ? '#2563EB' : '#8B5CF6'
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => !isDisabled && changeRole(r)}
                        disabled={isDisabled && !isActive}
                        style={{
                          textAlign: 'left',
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: `1.5px solid ${isActive ? accent : '#E2E8F0'}`,
                          background: isActive ? `${accent}10` : 'white',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled && !isActive ? 0.5 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{
                            width: 16, height: 16, borderRadius: '50%',
                            border: `2px solid ${isActive ? accent : '#CBD5E1'}`,
                            background: isActive ? accent : 'white',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? accent : '#0F172A' }}>
                            {r === 'PRATICIEN' ? 'Praticien' : 'Secrétaire'}
                          </span>
                          {isDisabled && isActive && <Lock size={11} style={{ color: '#94A3B8', marginLeft: 'auto' }} />}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>
                          {r === 'PRATICIEN'
                            ? 'Kinésithérapeute, ostéopathe, etc. (a un agenda)'
                            : "Gestion administrative (pas d'agenda dédié)"}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {mode === 'edit' && (
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lock size={10} />{" Le rôle d'un membre existant ne peut pas être modifié."}
                  </div>
                )}
              </div>

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

              {/* Spécialité — Praticien uniquement */}
              {form.role === 'PRATICIEN' && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Spécialité <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={form.specialite}
                    onChange={e => setForm(f => ({ ...f, specialite: e.target.value }))}
                    required
                    style={{ ...inputStyle, appearance: 'auto' }}
                  >
                    {SPECIALITES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {/* Téléphone */}
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

              {/* Couleur — Praticien uniquement */}
              {form.role === 'PRATICIEN' && (
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
              )}

              {/* ── Permissions granulaires ─────────────────────────────────── */}
              <div style={{ background: '#FAFBFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                  Permissions
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>
                  {"Modules accessibles par ce membre dans l'application."}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PERMISSION_KEYS.map(key => {
                    const checked  = !!form.permissions[key]
                    const isLocked = form.role === 'PRATICIEN' && key === 'agenda'
                    return (
                      <label
                        key={key}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '8px 10px',
                          background: checked ? '#EFF6FF' : 'white',
                          border: `1px solid ${checked ? '#BFDBFE' : '#E2E8F0'}`,
                          borderRadius: 8,
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          opacity: isLocked ? 0.85 : 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isLocked}
                          onChange={() => togglePermission(key)}
                          style={{ marginTop: 2, accentColor: '#2563EB', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {PERMISSION_LABELS[key].title}
                            {isLocked && <Lock size={10} style={{ color: '#94A3B8' }} />}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            {PERMISSION_LABELS[key].help}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
                {form.role === 'PRATICIEN' && (
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lock size={10} /> Un praticien a toujours accès à son agenda.
                  </div>
                )}
              </div>

              {/* ── Accès application ────────────────────────────────────────── */}
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{"Accès à l'application"}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {form.role === 'SECRETAIRE'
                        ? 'Obligatoire pour un secrétaire'
                        : 'Permet à ce membre de se connecter à KinéPro'}
                    </div>
                  </div>
                  {/* Toggle switch */}
                  <button
                    type="button"
                    onClick={() => {
                      if (form.role === 'SECRETAIRE') return // verrouillé sur ON
                      setForm(f => ({ ...f, acces: !f.acces }))
                    }}
                    disabled={form.role === 'SECRETAIRE'}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none',
                      cursor: form.role === 'SECRETAIRE' ? 'not-allowed' : 'pointer',
                      background: form.acces ? '#2563EB' : '#CBD5E1',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                      opacity: form.role === 'SECRETAIRE' ? 0.85 : 1,
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
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>{"Activer l'accès application"}</h2>
              <button onClick={() => setAccesModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: accesModal.member.role === 'PRATICIEN'
                  ? (accesModal.member.couleur || '#2563EB')
                  : '#8B5CF6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{initials(accesModal.member)}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{accesModal.member.prenom} {accesModal.member.nom}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {accesModal.member.role === 'PRATICIEN'
                    ? (accesModal.member.specialite || 'Kinésithérapeute')
                    : 'Secrétaire'}
                </div>
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
                  {accesSaving ? 'Activation...' : "Activer l'accès"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
