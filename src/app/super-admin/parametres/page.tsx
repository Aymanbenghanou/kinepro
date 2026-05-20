'use client'

import { useState, useEffect } from 'react'
import { Plus, Eye, EyeOff, Pencil, Trash2, Check, X, Star, ChevronDown } from 'lucide-react'
import { MOROCCAN_BANKS, maskRib, formatRib } from '@/lib/banks'
import { BankLogo } from '@/components/BankLogo'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #E2E8F0', borderRadius: 10,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
  color: '#0F172A', background: 'white',
}

interface BankAccount {
  id: string
  bankName: string
  accountHolder: string
  rib: string
  iban?: string | null
  swift?: string | null
  city?: string | null
  notes?: string | null
  isActive: boolean
  isDefault: boolean
}

type FormState = Omit<BankAccount, 'id'>

const EMPTY_FORM: FormState = {
  bankName: 'Attijariwafa Bank',
  accountHolder: '',
  rib: '',
  iban: '',
  swift: '',
  city: '',
  notes: '',
  isActive: true,
  isDefault: false,
}

export default function SuperAdminParametresPage() {
  // ─── Legacy SystemConfig form ──────────────────────────────────────────────
  const [form, setForm] = useState({
    whatsappNumber: '', prixMensuel: '299', prixAnnuel: '2499',
  })
  const [loading, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [fetching, setFetching] = useState(true)

  // ─── Bank accounts state ──────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [bankForm, setBankForm] = useState<FormState>(EMPTY_FORM)
  const [customBank, setCustomBank] = useState('')
  const [saving, setBankSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(text: string) {
    setToast(text)
    setTimeout(() => setToast(null), 2500)
  }

  // Load both system config and bank accounts on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/super-admin/parametres').then(r => r.json()),
      fetch('/api/super-admin/bank-accounts').then(r => r.json()),
    ])
      .then(([cfg, banks]) => {
        if (cfg) setForm(f => ({ ...f, ...cfg }))
        if (Array.isArray(banks)) setAccounts(banks)
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

  // ─── Bank account CRUD ────────────────────────────────────────────────────
  function openCreate() {
    setBankForm(EMPTY_FORM)
    setEditingId(null)
    setCustomBank('')
    setModalOpen(true)
  }
  function openEdit(acc: BankAccount) {
    setBankForm({
      bankName: acc.bankName, accountHolder: acc.accountHolder,
      rib: formatRib(acc.rib),
      iban: acc.iban ?? '', swift: acc.swift ?? '', city: acc.city ?? '', notes: acc.notes ?? '',
      isActive: acc.isActive, isDefault: acc.isDefault,
    })
    const known = MOROCCAN_BANKS.some(b => b.name === acc.bankName)
    if (!known) {
      setBankForm(f => ({ ...f, bankName: 'Autre' }))
      setCustomBank(acc.bankName)
    } else {
      setCustomBank('')
    }
    setEditingId(acc.id)
    setModalOpen(true)
  }

  async function refresh() {
    const banks = await fetch('/api/super-admin/bank-accounts').then(r => r.json())
    if (Array.isArray(banks)) setAccounts(banks)
  }

  async function submitBank(e: React.FormEvent) {
    e.preventDefault()
    setBankSaving(true)
    try {
      const finalBank = bankForm.bankName === 'Autre' && customBank.trim() ? customBank.trim() : bankForm.bankName
      const payload = { ...bankForm, bankName: finalBank, rib: bankForm.rib.replace(/\s+/g, '') }
      const url = editingId ? `/api/super-admin/bank-accounts/${editingId}` : '/api/super-admin/bank-accounts'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      await refresh()
      setModalOpen(false)
      showToast(editingId ? '✓ Compte mis à jour' : '✓ Compte créé')
    } catch (err) {
      showToast(`❌ ${err instanceof Error ? err.message : 'Erreur'}`)
    } finally {
      setBankSaving(false)
    }
  }

  async function toggleActive(acc: BankAccount) {
    await fetch(`/api/super-admin/bank-accounts/${acc.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !acc.isActive }),
    })
    refresh()
  }
  async function makeDefault(acc: BankAccount) {
    await fetch(`/api/super-admin/bank-accounts/${acc.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    })
    refresh()
    showToast('✓ Compte par défaut mis à jour')
  }
  async function deleteAcc(acc: BankAccount) {
    if (!confirm(`Supprimer le compte ${acc.bankName} ?`)) return
    await fetch(`/api/super-admin/bank-accounts/${acc.id}`, { method: 'DELETE' })
    refresh()
    showToast('Compte supprimé')
  }

  if (fetching) return <div style={{ padding: 40, color: '#64748B' }}>Chargement...</div>

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>Paramètres</h1>
      <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 32px' }}>Configuration globale de KinéPro SaaS</p>

      {/* ── Coordonnées bancaires ─────────────────────────────────────────── */}
      <section style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>🏦 Coordonnées bancaires</h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Comptes affichés aux cabinets sur la page d'abonnement</p>
          </div>
          <button
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            <Plus size={16} /> Ajouter un compte
          </button>
        </div>

        {accounts.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', border: '2px dashed #E2E8F0', borderRadius: 12, color: '#94A3B8', fontSize: 14 }}>
            Aucun compte bancaire configuré. Cliquez sur "Ajouter un compte" pour commencer.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #E2E8F0' }}>
                  <th style={th}>Banque</th>
                  <th style={th}>Titulaire</th>
                  <th style={th}>RIB</th>
                  <th style={th}>IBAN</th>
                  <th style={{ ...th, textAlign: 'center' }}>Statut</th>
                  <th style={{ ...th, textAlign: 'center' }}>Défaut</th>
                  <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => {
                  const isRevealed = revealed[acc.id]
                  return (
                    <tr key={acc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <BankLogo bankName={acc.bankName} size={36} />
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>{acc.bankName}</span>
                        </div>
                      </td>
                      <td style={td}>{acc.accountHolder}</td>
                      <td style={{ ...td, fontFamily: 'ui-monospace, monospace' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {isRevealed ? formatRib(acc.rib) : maskRib(acc.rib)}
                          <button onClick={() => setRevealed(r => ({ ...r, [acc.id]: !r[acc.id] }))} title={isRevealed ? 'Masquer' : 'Afficher'} style={btnIcon}>
                            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </span>
                      </td>
                      <td style={{ ...td, fontFamily: 'ui-monospace, monospace', color: '#64748B' }}>{acc.iban || '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <button
                          onClick={() => toggleActive(acc)}
                          style={{
                            background: acc.isActive ? '#DCFCE7' : '#FEE2E2',
                            color:      acc.isActive ? '#166534' : '#991B1B',
                            border: 'none', borderRadius: 999, padding: '4px 12px',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          {acc.isActive ? '● Actif' : '○ Inactif'}
                        </button>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        {acc.isDefault ? (
                          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Star size={11} fill="#F59E0B" color="#F59E0B" /> Défaut
                          </span>
                        ) : (
                          <button onClick={() => makeDefault(acc)} title="Définir comme compte par défaut" style={{ ...btnIcon, color: '#94A3B8' }}>
                            <Star size={14} />
                          </button>
                        )}
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button onClick={() => openEdit(acc)} title="Modifier" style={btnIcon}><Pencil size={14} /></button>
                          <button onClick={() => deleteAcc(acc)} title="Supprimer" style={{ ...btnIcon, color: '#DC2626' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Legacy form: WhatsApp + pricing ───────────────────────────────── */}
      <form onSubmit={handleSave} style={{ maxWidth: 600 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>📱 WhatsApp Super Admin</h2>
          <label style={lbl}>Numéro WhatsApp (format international, sans +)</label>
          <input
            value={form.whatsappNumber}
            onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))}
            placeholder="212600000000"
            style={inputStyle}
          />
          <p style={{ fontSize: 12, color: '#94A3B8', margin: '6px 0 0' }}>Exemple: 212600123456 pour +212 6 00 12 34 56</p>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>💰 Tarifs abonnement</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Prix mensuel (MAD)</label>
              <input type="number" value={form.prixMensuel} onChange={e => setForm(f => ({ ...f, prixMensuel: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={lbl}>Prix annuel (MAD)</label>
              <input type="number" value={form.prixAnnuel} onChange={e => setForm(f => ({ ...f, prixAnnuel: e.target.value }))} style={inputStyle} />
            </div>
          </div>
        </div>

        {msg && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
            background: msg.ok ? '#F0FDF4' : '#FEF2F2',
            color:      msg.ok ? '#166534' : '#B91C1C',
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

      {/* ── Modal: create/edit bank account ───────────────────────────────── */}
      {modalOpen && (
        <div onClick={() => !saving && setModalOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
        }}>
          <form onClick={e => e.stopPropagation()} onSubmit={submitBank} style={{
            background: 'white', borderRadius: 18, padding: 28, maxWidth: 560, width: '100%',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <BankLogo bankName={bankForm.bankName === 'Autre' && customBank ? customBank : bankForm.bankName} size={44} />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {editingId ? 'Modifier le compte' : 'Ajouter un compte bancaire'}
                </h3>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, flexShrink: 0 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Banque *</label>
                <BankDropdown
                  value={bankForm.bankName}
                  onChange={v => setBankForm(f => ({ ...f, bankName: v }))}
                />
                {bankForm.bankName === 'Autre' && (
                  <input
                    placeholder="Nom de la banque"
                    value={customBank}
                    onChange={e => setCustomBank(e.target.value)}
                    style={{ ...inputStyle, marginTop: 8 }}
                    required
                  />
                )}
              </div>

              <div>
                <label style={lbl}>Nom du titulaire *</label>
                <input
                  value={bankForm.accountHolder}
                  onChange={e => setBankForm(f => ({ ...f, accountHolder: e.target.value }))}
                  placeholder="KinéPro SARL"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={lbl}>RIB * (24 chiffres)</label>
                <input
                  value={bankForm.rib}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 24)
                    setBankForm(f => ({ ...f, rib: formatRib(digits) }))
                  }}
                  placeholder="XXXX XXXX XXXX XXXX XXXX XX"
                  required
                  style={{
                    ...inputStyle, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.5px',
                    borderColor: bankForm.rib.replace(/\s/g, '').length === 24 ? '#16A34A' : bankForm.rib ? '#FCA5A5' : '#E2E8F0',
                  }}
                />
                <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>
                  {bankForm.rib.replace(/\s/g, '').length} / 24 chiffres
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>IBAN (optionnel)</label>
                  <input value={bankForm.iban ?? ''} onChange={e => setBankForm(f => ({ ...f, iban: e.target.value }))} placeholder="MA64..." style={inputStyle} />
                </div>
                <div>
                  <label style={lbl}>Code SWIFT/BIC</label>
                  <input value={bankForm.swift ?? ''} onChange={e => setBankForm(f => ({ ...f, swift: e.target.value }))} placeholder="BCMAMAMC" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={lbl}>Ville de l'agence (optionnel)</label>
                <input value={bankForm.city ?? ''} onChange={e => setBankForm(f => ({ ...f, city: e.target.value }))} placeholder="Casablanca" style={inputStyle} />
              </div>

              <div>
                <label style={lbl}>Notes internes (non visibles par les clients)</label>
                <textarea
                  value={bankForm.notes ?? ''}
                  onChange={e => setBankForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, padding: '8px 0', flexWrap: 'wrap' }}>
                <Toggle label="Compte par défaut" checked={bankForm.isDefault} onChange={v => setBankForm(f => ({ ...f, isDefault: v }))} hint="Affiché en premier" />
                <Toggle label="Compte actif"      checked={bankForm.isActive}  onChange={v => setBankForm(f => ({ ...f, isActive: v }))} hint="Visible aux cabinets" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}
                style={{ flex: 1, padding: '12px', background: 'white', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Annuler
              </button>
              <button type="submit" disabled={saving || bankForm.rib.replace(/\s/g, '').length !== 24}
                style={{ flex: 2, padding: '12px', background: saving || bankForm.rib.replace(/\s/g, '').length !== 24 ? '#94A3B8' : '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Enregistrement...' : (editingId ? 'Mettre à jour' : 'Créer le compte')}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: '#0F172A', color: 'white',
          padding: '12px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 200,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── small inline UI helpers ──────────────────────────────────────────────────

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }
const td: React.CSSProperties = { padding: '12px', color: '#0F172A', verticalAlign: 'middle' }
const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }
const btnIcon: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 6, borderRadius: 6, display: 'inline-flex', alignItems: 'center' }

function BankDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  return (
    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <BankLogo bankName={value} size={28} />
          <span style={{ fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        </span>
        <ChevronDown size={16} color="#64748B" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 10,
          boxShadow: '0 14px 40px rgba(0,0,0,0.12)', maxHeight: 320, overflowY: 'auto',
          zIndex: 30, padding: 4,
        }}>
          {MOROCCAN_BANKS.map(b => {
            const isActive = b.name === value
            return (
              <button
                key={b.name}
                type="button"
                onClick={() => { onChange(b.name); setOpen(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  background: isActive ? '#EFF6FF' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F8FAFC' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <BankLogo bankName={b.name} size={28} />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: isActive ? 700 : 500, color: '#0F172A' }}>{b.name}</span>
                {isActive && <Check size={15} color="#2563EB" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: '1 1 220px' }}>
      <span
        onClick={() => onChange(!checked)}
        style={{
          width: 38, height: 22, borderRadius: 999, position: 'relative',
          background: checked ? '#2563EB' : '#CBD5E1', transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 18, height: 18, background: 'white', borderRadius: '50%',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </span>
      <span>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{label}</span>
        {hint && <span style={{ display: 'block', fontSize: 12, color: '#94A3B8' }}>{hint}</span>}
      </span>
    </label>
  )
}
