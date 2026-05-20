'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Topbar from '@/components/layout/Topbar'
import { formatDate, formatMoney } from '@/lib/utils'
import { Plus, X, Download, Search, RotateCcw, Wallet, Eye, CheckCircle2 } from 'lucide-react'
import { generateFacturePDF } from '@/lib/pdf-utils'
import { STATUT_LABELS, type FactureStatut } from '@/lib/facture-statut'
import PaymentModal from '@/components/facturation/PaymentModal'

const QrCodeModal = dynamic(() => import('@/components/qr/QrCodeModal'), { ssr: false })

function StatutBadge({ statut }: { statut: string }) {
  const s = STATUT_LABELS[statut as FactureStatut] ?? { label: statut, bg: '#F1F5F9', color: '#64748B', icon: '' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 700,
    }}>
      <span>{s.icon}</span> {s.label}
    </span>
  )
}

function ProgressBar({ paye, total }: { paye: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (paye / total) * 100) : 0
  const color = pct >= 100 ? '#16A34A' : pct > 0 ? '#F59E0B' : '#94A3B8'
  return (
    <div style={{ minWidth: 140 }}>
      <div style={{ height: 6, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.3s' }} />
      </div>
      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: 600 }}>
        {formatMoney(paye)} / {formatMoney(total)}
      </div>
    </div>
  )
}

export default function FacturationPage() {
  const [factures, setFactures] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [praticiens, setPraticiens] = useState<any[]>([])
  const [cabinet, setCabinet] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch]           = useState('')
  const [statut, setStatut]           = useState<string>('all')
  const [from, setFrom]               = useState('')
  const [to, setTo]                   = useState('')
  const [praticienId, setPraticienId] = useState('all')

  const [showCreate, setShowCreate] = useState(false)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ patientId: '', montant: '', statut: 'en_attente' })

  const [qrFacture, setQrFacture] = useState<{ url: string; title: string } | null>(null)
  const [paymentFor, setPaymentFor] = useState<any>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(null), 3500)
  }

  async function fetchFactures() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statut !== 'all') params.set('statut', statut)
      if (from)              params.set('from', from)
      if (to)                params.set('to', to)
      if (praticienId !== 'all') params.set('praticienId', praticienId)
      const res = await fetch(`/api/facturation?${params}`)
      const data = await res.json()
      setFactures(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchFactures() }, [statut, from, to, praticienId])
  useEffect(() => {
    fetch('/api/patients').then(r => r.json()).then(d => setPatients(Array.isArray(d) ? d : []))
    fetch('/api/praticiens').then(r => r.json()).then(d => setPraticiens(Array.isArray(d) ? d : []))
    fetch('/api/cabinet').then(r => r.json()).then(setCabinet).catch(() => {})
  }, [])

  // Client-side search by patient name
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return factures
    return factures.filter(f => `${f.patient?.prenom ?? ''} ${f.patient?.nom ?? ''}`.toLowerCase().includes(q))
  }, [search, factures])

  const matchingPatients = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return patients.filter(p => `${p.prenom} ${p.nom}`.toLowerCase().includes(q)).slice(0, 6)
  }, [search, patients])

  // Stats from visible list
  const totalEncaisse = visible.reduce((s, f) => s + (f.montantPaye ?? 0), 0)
  const totalReste    = visible.reduce((s, f) => s + Math.max(0, f.montant - (f.montantPaye ?? 0)), 0)
  const totalFacture  = visible.reduce((s, f) => s + f.montant, 0)

  function resetFilters() {
    setSearch(''); setStatut('all'); setFrom(''); setTo(''); setPraticienId('all')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/facturation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: form.patientId, montant: parseFloat(form.montant) }),
      })
      setShowCreate(false)
      setForm({ patientId: '', montant: '', statut: 'en_attente' })
      fetchFactures()
      showToast('Facture créée ✓')
    } finally { setSaving(false) }
  }

  async function exportPDF(f: any) {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'
    const qrUrl = f.patient?.publicToken ? `${APP_URL}/scan/${f.patient.publicToken}` : undefined
    await generateFacturePDF(f, cabinet, qrUrl)
  }

  return (
    <div>
      <Topbar title="Facturation" subtitle="Suivi des paiements et factures" />
      <div style={{ padding: 20 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 18 }}>
          <Stat label="Total facturé"     value={formatMoney(totalFacture)} color="#0F172A" bg="#F1F5F9" />
          <Stat label="Total encaissé"     value={formatMoney(totalEncaisse)} color="#16A34A" bg="#DCFCE7" />
          <Stat label="Reste à encaisser"  value={formatMoney(totalReste)}    color={totalReste > 0 ? '#DC2626' : '#16A34A'} bg={totalReste > 0 ? '#FEE2E2' : '#DCFCE7'} />
          <Stat label="Nombre de factures" value={String(visible.length)}     color="#2563EB" bg="#DBEAFE" />
        </div>

        {/* Filters bar */}
        <div style={{
          background: 'white', border: '1px solid #E2E8F0', borderRadius: 14,
          padding: 14, marginBottom: 16, boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {/* Patient search with autocomplete */}
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setShowAutocomplete(true) }}
                onFocus={() => setShowAutocomplete(true)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
                placeholder="Rechercher un patient…"
                style={{ ...input, paddingLeft: 36 }}
              />
              {showAutocomplete && matchingPatients.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: 'white', border: '1px solid #E2E8F0', borderRadius: 10,
                  boxShadow: '0 10px 32px rgba(0,0,0,0.1)', zIndex: 30,
                  maxHeight: 240, overflowY: 'auto',
                }}>
                  {matchingPatients.map(p => (
                    <button
                      key={p.id} type="button"
                      onMouseDown={() => { setSearch(`${p.prenom} ${p.nom}`); setShowAutocomplete(false) }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 12px', background: 'transparent', border: 'none',
                        cursor: 'pointer', fontSize: 13.5,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{p.prenom} {p.nom}</span>
                      {p.telephone && <span style={{ color: '#94A3B8', marginLeft: 8, fontSize: 12 }}>{p.telephone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select value={statut} onChange={e => setStatut(e.target.value)} style={select}>
              <option value="all">Tous les statuts</option>
              <option value="paye">Payée</option>
              <option value="en_attente">En attente</option>
              <option value="partielle">Partiellement payée</option>
              <option value="en_retard">En retard</option>
            </select>

            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={select} title="Date début" />
            <input type="date" value={to}   onChange={e => setTo(e.target.value)}   style={select} title="Date fin" />

            <select value={praticienId} onChange={e => setPraticienId(e.target.value)} style={select}>
              <option value="all">Tous les praticiens</option>
              {praticiens.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
            </select>

            <button onClick={resetFilters} style={btnGhost}>
              <RotateCcw size={13} /> Réinitialiser
            </button>

            <button onClick={() => setShowCreate(true)} style={{ ...btnPrimary, marginLeft: 'auto' }}>
              <Plus size={15} /> Créer facture
            </button>
          </div>
        </div>

        {/* ── MOBILE: sticky summary + card list ─────────────────── */}
        <div className="mobile-only">
          <div className="msummary">
            <div className="msummary-item">
              <span className="msummary-label">Encaissé</span>
              <span className="msummary-value" style={{ color: '#16A34A' }}>{formatMoney(totalEncaisse)}</span>
            </div>
            <div className="msummary-divider" />
            <div className="msummary-item">
              <span className="msummary-label">Reste</span>
              <span className="msummary-value" style={{ color: totalReste > 0 ? '#DC2626' : '#16A34A' }}>{formatMoney(totalReste)}</span>
            </div>
            <div className="msummary-divider" />
            <div className="msummary-item">
              <span className="msummary-label">Total</span>
              <span className="msummary-value">{visible.length}</span>
            </div>
          </div>

          <div className="mlist">
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>Chargement…</div>
            ) : visible.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>Aucune facture</div>
            ) : visible.map((f: any) => {
              const reste = Math.max(0, f.montant - (f.montantPaye ?? 0))
              const pct   = f.montant > 0 ? Math.min(100, ((f.montantPaye ?? 0) / f.montant) * 100) : 0
              const pillColor = STATUT_LABELS[f.statut as FactureStatut] ?? { bg: '#F1F5F9', color: '#64748B', label: f.statut, icon: '' }
              return (
                <div key={f.id} className="mcard">
                  <Link href={`/facturation/${f.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div className="mcard-row">
                      <div className="mcard-title">{f.patient?.prenom} {f.patient?.nom}</div>
                      <span className="mcard-pill" style={{ background: pillColor.bg, color: pillColor.color }}>
                        {pillColor.icon} {pillColor.label}
                      </span>
                    </div>
                    <div className="mcard-meta">
                      📅 {formatDate(f.dateEmise)}
                      {f.seance?.seanceType?.nom && <>· 🏥 {f.seance.seanceType.nom}</>}
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 6, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#16A34A' : '#F59E0B' }} />
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12.5, color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                        <span><strong style={{ color: '#0F172A' }}>{formatMoney(f.montantPaye ?? 0)}</strong> / {formatMoney(f.montant)}</span>
                        {reste > 0 && <span style={{ color: '#DC2626', fontWeight: 700 }}>Reste : {formatMoney(reste)}</span>}
                      </div>
                    </div>
                  </Link>
                  {/* Actions */}
                  <div className="mcard-actions">
                    {reste > 0 && (
                      <button onClick={() => setPaymentFor(f)} className="mcard-btn success">
                        <Wallet size={14} /> Payer
                      </button>
                    )}
                    <button onClick={() => exportPDF(f)} className="mcard-btn">
                      <Download size={14} /> PDF
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── DESKTOP: table ─────────────────────────────────── */}
        <div className="desktop-only" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                  <th style={th}>Patient</th>
                  <th style={th}>Date</th>
                  <th style={{ ...th, textAlign: 'right' }}>Montant</th>
                  <th style={th}>Progression</th>
                  <th style={th}>Statut</th>
                  <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 36, textAlign: 'center', color: '#94A3B8' }}>Chargement…</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 36, textAlign: 'center', color: '#94A3B8' }}>Aucune facture</td></tr>
                ) : visible.map(f => {
                  const reste = Math.max(0, f.montant - (f.montantPaye ?? 0))
                  return (
                    <tr key={f.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{f.patient?.prenom} {f.patient?.nom}</div>
                        {f.seance?.seanceType?.nom && (
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{f.seance.seanceType.nom}</div>
                        )}
                      </td>
                      <td style={{ ...td, color: '#475569' }}>{formatDate(f.dateEmise)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                        {formatMoney(f.montant)}
                        {reste > 0 && f.statut === 'partielle' && (
                          <div style={{ fontSize: 11, color: '#EA580C', fontWeight: 600, marginTop: 2 }}>Reste : {formatMoney(reste)}</div>
                        )}
                      </td>
                      <td style={td}>
                        <ProgressBar paye={f.montantPaye ?? 0} total={f.montant} />
                      </td>
                      <td style={td}><StatutBadge statut={f.statut} /></td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {reste > 0 && (
                            <button onClick={() => setPaymentFor(f)} style={actionBtn('#16A34A', '#DCFCE7', '#BBF7D0')} title="Enregistrer paiement">
                              <Wallet size={13} /> Encaisser
                            </button>
                          )}
                          <Link href={`/facturation/${f.id}`} style={actionBtn('#2563EB', '#EFF6FF', '#DBEAFE') as any} title="Détail">
                            <Eye size={13} />
                          </Link>
                          <button onClick={() => exportPDF(f)} style={actionBtn('#475569', 'white', '#E2E8F0')} title="PDF">
                            <Download size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div onClick={() => setShowCreate(false)} style={modalOverlay}>
          <form onClick={e => e.stopPropagation()} onSubmit={handleCreate} style={modalSheet}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Créer une facture</h3>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={lbl}>Patient *</label>
                <select value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} required style={input}>
                  <option value="">Sélectionner un patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Montant (MAD) *</label>
                <input type="number" min={0} step="0.01" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} required style={input} placeholder="Ex: 350" />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, ...btnSecondary }}>Annuler</button>
                <button type="submit" disabled={saving} style={{ ...btnPrimary, flex: 2 }}>
                  {saving ? 'Création…' : <><CheckCircle2 size={15} /> Créer</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Payment modal */}
      {paymentFor && (
        <PaymentModal
          facture={paymentFor}
          onClose={() => setPaymentFor(null)}
          onSuccess={(msg) => { showToast(msg); fetchFactures() }}
        />
      )}

      {/* QR modal */}
      {qrFacture && (
        <QrCodeModal url={qrFacture.url} title={qrFacture.title} subtitle="Patient" onClose={() => setQrFacture(null)} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 250,
          background: '#0F172A', color: 'white', padding: '14px 20px',
          borderRadius: 12, fontWeight: 600, fontSize: 14,
          boxShadow: '0 14px 36px rgba(0,0,0,0.25)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 18 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Wallet size={18} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>{label}</div>
    </div>
  )
}

// Styles
const th: React.CSSProperties = { textAlign: 'left', padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }
const td: React.CSSProperties = { padding: '14px', color: '#0F172A', verticalAlign: 'middle' }
const input: React.CSSProperties = { width: '100%', padding: '9px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13.5, outline: 'none', color: '#0F172A', background: 'white', boxSizing: 'border-box' }
const select: React.CSSProperties = { padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#0F172A', background: 'white', cursor: 'pointer', minWidth: 130 }
const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#2563EB', color: 'white', border: 'none', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', justifyContent: 'center' }
const btnSecondary: React.CSSProperties = { padding: '9px 16px', borderRadius: 10, background: 'white', color: '#475569', border: '1.5px solid #E2E8F0', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 10, background: 'white', color: '#64748B', border: '1.5px solid #E2E8F0', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }

function actionBtn(color: string, bg: string, border: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '6px 11px', borderRadius: 8,
    background: bg, color, border: `1px solid ${border}`,
    cursor: 'pointer', fontSize: 12, fontWeight: 700,
    textDecoration: 'none',
  }
}

const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
const modalSheet: React.CSSProperties = { background: 'white', borderRadius: 16, padding: 24, maxWidth: 460, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }
