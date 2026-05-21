'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatDate, formatTime, formatMoney } from '@/lib/utils'
import Topbar from '@/components/layout/Topbar'
import {
  ArrowLeft, Phone, Mail, MapPin, Activity, FileText,
  Calendar, Plus, X, User, CreditCard, Target, Clock, Download, BarChart2, QrCode,
  Sparkles, Send,
} from 'lucide-react'
import ExercicesModal from '@/components/whatsapp/ExercicesModal'
import { generateDossierPatientPDF } from '@/lib/pdf-utils'
import ProgressionTab from '@/components/patients/ProgressionTab'
import DocumentsTab from '@/components/patients/DocumentsTab'
import ExerciseProgramModal from '@/components/exercise-program/ExerciseProgramModal'
import { formatWhatsAppMessage, waUrl } from '@/lib/exercise-program'
import dynamic from 'next/dynamic'

const QrCodeModal = dynamic(() => import('@/components/qr/QrCodeModal'), { ssr: false })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'

// ─── Types ───────────────────────────────────────────────────────────────────
type TabId = 'informations' | 'seances' | 'plan' | 'facturation' | 'progression' | 'documents' | 'programmes'

const TABS: { id: TabId; label: string; short: string; icon: any }[] = [
  { id: 'informations', label: 'Informations',       short: 'Info',     icon: User },
  { id: 'seances',      label: 'Séances',            short: 'Séances',  icon: Clock },
  { id: 'plan',         label: 'Plan de traitement', short: 'Plan',     icon: Target },
  { id: 'programmes',   label: 'Programmes',         short: 'Progr.',   icon: Sparkles },
  { id: 'facturation',  label: 'Facturation',        short: 'Factures', icon: CreditCard },
  { id: 'progression',  label: 'Progression',        short: 'Progrès',  icon: BarChart2 },
  { id: 'documents',    label: 'Documents',           short: 'Docs',     icon: FileText },
]

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>{label}</span>
}

function statutSeance(s: string) {
  const m: Record<string, { label: string; bg: string; color: string }> = {
    realisee: { label: 'Réalisée', bg: '#DCFCE7', color: '#16A34A' },
    annulee: { label: 'Annulée', bg: '#FEE2E2', color: '#DC2626' },
    no_show: { label: 'Absent', bg: '#FEF3C7', color: '#D97706' },
  }
  return m[s] || { label: s, bg: '#F1F5F9', color: '#64748B' }
}
function statutFacture(s: string) {
  const m: Record<string, { label: string; bg: string; color: string }> = {
    paye: { label: 'Payé', bg: '#DCFCE7', color: '#16A34A' },
    en_attente: { label: 'En attente', bg: '#FEF3C7', color: '#D97706' },
    en_retard: { label: 'En retard', bg: '#FEE2E2', color: '#DC2626' },
  }
  return m[s] || { label: s, bg: '#F1F5F9', color: '#64748B' }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 0, padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ fontSize: 13, color: '#64748B', minWidth: 200, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#0F172A', flex: 1 }}>{value}</span>
    </div>
  )
}

// ─── Modal Planifier Séance ───────────────────────────────────────────────────
function PlanifierModal({ patientId, onClose, onSuccess }: {
  patientId: string; onClose: () => void; onSuccess: () => void
}) {
  const [praticiens, setPraticiens] = useState<any[]>([])
  const [seanceTypes, setSeanceTypes] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: '', heure: '09:00', praticienId: '', typeSeance: '',
    salle: 'Salle 1', duree: '45', notes: '',
  })

  useEffect(() => {
    fetch('/api/praticiens').then(r => r.json()).then(d => setPraticiens(Array.isArray(d) ? d : []))
    fetch('/api/seance-types').then(r => r.json()).then(d => setSeanceTypes(Array.isArray(d) ? d : []))
  }, [])

  // Auto-fill duree from seanceType
  useEffect(() => {
    const found = seanceTypes.find(t => t.nom === form.typeSeance)
    if (found) setForm(f => ({ ...f, duree: String(found.dureeDefaut) }))
  }, [form.typeSeance, seanceTypes])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.date || !form.praticienId || !form.typeSeance) return
    setSaving(true)
    try {
      await fetch('/api/rendez-vous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: `${form.date}T${form.heure}:00`,
          duree: parseInt(form.duree),
          typeSeance: form.typeSeance,
          salle: form.salle,
          notes: form.notes,
          patientId,
          praticienId: form.praticienId,
        }),
      })
      onSuccess()
      onClose()
    } catch {}
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }

  return (
    <div className="modal-overlay" style={{ zIndex: 300, backdropFilter: 'blur(2px)', background: 'rgba(15,23,42,0.55)' }}>
      <div className="modal-sheet" style={{ padding: 28, width: 520, maxHeight: '90vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>Planifier une séance</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Type de séance *</label>
            <select value={form.typeSeance} onChange={e => setForm(f => ({ ...f, typeSeance: e.target.value }))} required style={inp}>
              <option value="">Sélectionner...</option>
              {seanceTypes.map((t: any) => (
                <option key={t.id} value={t.nom}>{t.nom} — {t.dureeDefaut} min — {t.tarifDefaut} MAD</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Praticien *</label>
            <select value={form.praticienId} onChange={e => setForm(f => ({ ...f, praticienId: e.target.value }))} required style={inp}>
              <option value="">Sélectionner...</option>
              {praticiens.map((p: any) => <option key={p.id} value={p.id}>Dr. {p.prenom} {p.nom}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required style={inp} />
            </div>
            <div>
              <label style={lbl}>Heure *</label>
              <input type="time" value={form.heure} onChange={e => setForm(f => ({ ...f, heure: e.target.value }))} required style={inp} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Salle</label>
              <select value={form.salle} onChange={e => setForm(f => ({ ...f, salle: e.target.value }))} style={inp}>
                {['Salle 1', 'Salle 2', 'Salle 3'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Durée (min)</label>
              <input type="number" value={form.duree} onChange={e => setForm(f => ({ ...f, duree: e.target.value }))} style={inp} min="15" step="5" />
            </div>
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              style={{ ...inp, resize: 'vertical' }} placeholder="Instructions ou observations..." />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '11px', border: '1px solid #E2E8F0', borderRadius: 10, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#64748B' }}>
              Annuler
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: '11px', border: 'none', borderRadius: 10, background: '#2563EB', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              {saving ? 'Planification...' : 'Planifier la séance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [patient, setPatient] = useState<any>(null)
  const [cabinet, setCabinet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('informations')
  const [showPlanifier, setShowPlanifier] = useState(false)
  const [showExercices, setShowExercices] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  async function openQr() {
    setShowQr(true)
    if (qrToken) return
    setQrLoading(true)
    try {
      const res = await fetch(`/api/patients/${id}/qr-token`)
      const data = await res.json()
      setQrToken(data.token)
    } catch {}
    setQrLoading(false)
  }

  const fetchPatient = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${id}`)
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setPatient(data)
    } catch {}
    setLoading(false)
  }, [id])

  useEffect(() => { fetchPatient() }, [fetchPatient])
  useEffect(() => {
    fetch('/api/cabinet').then(r => r.json()).then(d => setCabinet(d)).catch(() => {})
  }, [])

  if (loading) return (
    <div>
      <Topbar title="Chargement..." />
      <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Chargement du dossier...</div>
    </div>
  )

  if (!patient) return (
    <div>
      <Topbar title="Patient introuvable" />
      <div style={{ padding: 24 }}>
        <button onClick={() => router.push('/patients')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          <ArrowLeft size={14} /> Retour aux patients
        </button>
      </div>
    </div>
  )

  const seancesRealisees = patient.seances?.filter((s: any) => s.statut === 'realisee') || []
  const pct = patient.nbSeancesPrescrites
    ? Math.min(100, Math.round((seancesRealisees.length / patient.nbSeancesPrescrites) * 100))
    : null

  // Calcul âge
  let age: number | null = null
  if (patient.dateNaissance) {
    const birth = new Date(patient.dateNaissance)
    const today = new Date()
    age = today.getFullYear() - birth.getFullYear()
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  }

  return (
    <div>
      <Topbar title={`${patient.prenom} ${patient.nom}`} subtitle="Dossier patient" />
      <div style={{ padding: 24 }}>

        {/* Breadcrumb */}
        <button onClick={() => router.push('/patients')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 14, marginBottom: 20, padding: 0 }}>
          <ArrowLeft size={14} /> Retour aux patients
        </button>

        {/* Header card — desktop only (mobile renders a different header inside the Infos tab) */}
        <div className="patient-header-card desktop-only" style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', flex: 1, minWidth: 0 }}>
              {/* Avatar */}
              <div style={{
                width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB, #1E3A5F)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ color: 'white', fontSize: 26, fontWeight: 700 }}>{patient.prenom?.[0]}{patient.nom?.[0]}</span>
              </div>
              <div className="patient-header-info" style={{ flex: 1, minWidth: 0 }}>
                {/* Line 1: Name only */}
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {patient.prenom} {patient.nom}
                </h1>

                {/* Line 2: Status + Sexe badges — single line, nowrap */}
                <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, marginTop: 6, overflow: 'hidden' }}>
                  <span style={{
                    background: patient.actif ? '#DCFCE7' : '#F1F5F9',
                    color:      patient.actif ? '#15803D' : '#64748B',
                    padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {patient.actif ? '● Actif' : '● Inactif'}
                  </span>
                  {patient.sexe && (
                    <span style={{
                      background: '#EFF6FF', color: '#2563EB',
                      padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {patient.sexe}
                    </span>
                  )}
                </div>

                {/* Line 3+: contact meta */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', maxWidth: '100%', minWidth: 0, marginTop: 8 }}>
                  {age !== null && <span style={{ fontSize: 12.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}><User size={13} /> {age} ans</span>}
                  {patient.telephone && (
                    <a href={`tel:${patient.telephone}`} style={{ fontSize: 12.5, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600 }}>
                      <Phone size={13} /> {patient.telephone}
                    </a>
                  )}
                  {patient.email && (
                    <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, maxWidth: '100%' }}>
                      <Mail size={13} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{patient.email}</span>
                    </span>
                  )}
                  {patient.ville && <span style={{ fontSize: 12.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {patient.ville}</span>}
                </div>

                {patient.pathologie && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                      🩺 {patient.pathologie}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="action-grid-mobile" style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
              <button onClick={openQr}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', color: '#2563EB', border: '1.5px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                <QrCode size={15} /> QR Code
              </button>
              <button onClick={() => generateDossierPatientPDF(patient, cabinet)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', color: '#DC2626', border: '1.5px solid #FECACA', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                <Download size={15} /> PDF
              </button>
              {patient.telephone && (
                <button onClick={() => setShowExercices(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
                  💪 Exercices
                </button>
              )}
              <button onClick={() => setShowPlanifier(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1E293B', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 2px 8px rgba(30,41,59,0.25)' }}>
                <Calendar size={16} /> Planifier
              </button>
            </div>
          </div>

          {/* Quick stats — desktop only (mobile shows them inside the Séances tab) */}
          <div className="stats-grid-4 desktop-only" style={{ gap: 12, marginTop: 20, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
            {[
              { label: 'Séances réalisées', value: seancesRealisees.length, color: '#2563EB' },
              { label: 'Total séances', value: patient.seances?.length || 0, color: '#0F172A' },
              { label: 'Prescrites', value: patient.nbSeancesPrescrites || '—', color: '#16A34A' },
              { label: 'Factures', value: patient.factures?.length || 0, color: '#F59E0B' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="patient-tabs" style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: 4, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
                  background: active ? '#2563EB' : 'transparent',
                  color: active ? 'white' : '#64748B',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>
                <Icon size={14} />
                <span className="tab-label-full">{tab.label}</span>
                <span className="tab-label-short">{tab.short}</span>
              </button>
            )
          })}
        </div>

        {/* ── Tab: Informations ── */}
        {activeTab === 'informations' && (<>

        {/* ── MOBILE Infos: header card + info rows (mockup match) ── */}
        <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Header card */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#DBEAFE', color: '#1D4ED8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 600, flexShrink: 0,
              }}>
                {patient.prenom?.[0]}{patient.nom?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name + Actif + Sexe — same line, can wrap if needed */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 17, fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
                    {patient.prenom} {patient.nom}
                  </span>
                  <span style={{
                    background: patient.actif ? '#F0FDF4' : '#F1F5F9',
                    color:      patient.actif ? '#15803D' : '#64748B',
                    fontSize: 10, fontWeight: 600,
                    padding: '3px 8px', borderRadius: 20,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {patient.actif ? 'Actif' : 'Inactif'}
                  </span>
                  {patient.sexe && (
                    <span style={{
                      background: '#EFF6FF', color: '#2563EB',
                      fontSize: 10, fontWeight: 600,
                      padding: '3px 8px', borderRadius: 20,
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{patient.sexe}</span>
                  )}
                </div>
                {/* Age · Sexe text line */}
                {(age !== null || patient.sexe) && (
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                    {age !== null && `${age} ans`}
                    {age !== null && patient.sexe && ' · '}
                    {patient.sexe}
                  </div>
                )}
                {/* Phone — tappable blue */}
                {patient.telephone && (
                  <a href={`tel:${patient.telephone}`} style={{
                    fontSize: 13, color: '#2563EB', marginTop: 4,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    textDecoration: 'none',
                  }}>
                    📞 {patient.telephone}
                  </a>
                )}
              </div>
            </div>

            {/* Pathologie pill */}
            {patient.pathologie && (
              <div style={{ padding: '0 16px 12px' }}>
                <span style={{
                  background: '#FFF7ED', color: '#B45309',
                  fontSize: 12, fontWeight: 600,
                  padding: '6px 14px', borderRadius: 20,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  🏥 {patient.pathologie}
                </span>
              </div>
            )}

            {/* 2×2 action grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
              padding: 12, borderTop: '1px solid #F1F5F9',
            }}>
              <button onClick={openQr}
                style={mActionBtn({ bg: 'white', color: '#2563EB', border: '1px solid #E2E8F0' })}>
                <QrCode size={14} /> QR Code
              </button>
              <button onClick={() => generateDossierPatientPDF(patient, cabinet)}
                style={mActionBtn({ bg: 'white', color: '#DC2626', border: '1px solid #E2E8F0' })}>
                <Download size={14} /> PDF
              </button>
              {patient.telephone ? (
                <button onClick={() => setShowExercices(true)}
                  style={mActionBtn({ bg: '#2563EB', color: 'white' })}>
                  💪 Exercices
                </button>
              ) : <span />}
              <button onClick={() => setShowPlanifier(true)}
                style={mActionBtn({ bg: '#1E3A5F', color: 'white' })}>
                <Calendar size={14} /> Planifier
              </button>
            </div>
          </div>

          {/* Info rows card */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <MInfoRow label="Email"             value={patient.email}            link={patient.email ? `mailto:${patient.email}` : undefined} />
            <MInfoRow label="Adresse"           value={patient.adresse} />
            <MInfoRow label="Ville"             value={patient.ville} />
            <MInfoRow label="CIN"               value={patient.cin} />
            <MInfoRow label="Mutuelle"          value={patient.mutuelle} />
            <MInfoRow label="N° police"         value={patient.numeroPolice} />
            <MInfoRow label="Médecin référent"  value={patient.medecinReferent} />
            <MInfoRow label="Tél. médecin"      value={patient.medecinTelephone} link={patient.medecinTelephone ? `tel:${patient.medecinTelephone}` : undefined} />
            <MInfoRow label="Date de naissance" value={patient.dateNaissance ? formatDate(patient.dateNaissance) : null} />
            <MInfoRow label="Mode paiement"     value={patient.modePaiement} />
            <MInfoRow label="Tarif séance"      value={patient.tarifSeance ? `${patient.tarifSeance} MAD` : null} last />
          </div>
        </div>

        {/* ── DESKTOP Infos grid (unchanged) ── */}
        <div className="dashboard-grid-2 desktop-only" style={{ gap: 20 }}>
            {/* Infos personnelles */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
                👤 Informations personnelles
              </h3>
              <InfoRow label="Prénom" value={patient.prenom} />
              <InfoRow label="Nom" value={patient.nom} />
              <InfoRow label="Date de naissance" value={patient.dateNaissance ? `${formatDate(patient.dateNaissance)}${age !== null ? ` (${age} ans)` : ''}` : undefined} />
              <InfoRow label="Sexe" value={patient.sexe} />
              <InfoRow label="Téléphone" value={patient.telephone} />
              <InfoRow label="Email" value={patient.email} />
              <InfoRow label="Adresse" value={patient.adresse} />
              <InfoRow label="Ville" value={patient.ville} />
              <InfoRow label="CIN" value={patient.cin} />
            </div>
            {/* Infos médicales */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
                🩺 Informations médicales
              </h3>
              <InfoRow label="Pathologie" value={patient.pathologie} />
              <InfoRow label="Médecin référent" value={patient.medecinReferent} />
              <InfoRow label="Tél. médecin" value={patient.medecinTelephone} />
              <InfoRow label="Mutuelle" value={patient.mutuelle} />
              <InfoRow label="N° police" value={patient.numeroPolice} />
              <InfoRow label="Mode paiement" value={patient.modePaiement} />
              <InfoRow label="Tarif séance" value={patient.tarifSeance ? `${patient.tarifSeance} MAD` : undefined} />
              {patient.antecedents && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>ANTÉCÉDENTS</p>
                  <p style={{ fontSize: 13, color: '#374151', background: '#F8FAFC', padding: 10, borderRadius: 8, margin: 0 }}>{patient.antecedents}</p>
                </div>
              )}
              {patient.allergies && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#DC2626', marginBottom: 6 }}>⚠ ALLERGIES</p>
                  <p style={{ fontSize: 13, color: '#374151', background: '#FEF2F2', padding: 10, borderRadius: 8, margin: 0 }}>{patient.allergies}</p>
                </div>
              )}
              {patient.medicaments && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>MÉDICAMENTS EN COURS</p>
                  <p style={{ fontSize: 13, color: '#374151', background: '#F8FAFC', padding: 10, borderRadius: 8, margin: 0 }}>{patient.medicaments}</p>
                </div>
              )}
            </div>
          </div>
        </>)}

        {/* ── Tab: Séances ── */}
        {activeTab === 'seances' && (
          <div className="table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', margin: 0 }}>Historique des séances ({patient.seances?.length || 0})</h3>
              <button onClick={() => setShowPlanifier(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
                <Plus size={14} /> Planifier séance
              </button>
            </div>
            {patient.seances?.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 14 }}>Aucune séance enregistrée</div>
            ) : (
              <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    {['Date', 'Type', 'Durée', 'Praticien', 'Statut', 'Notes'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#64748B', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patient.seances?.map((s: any, i: number) => {
                    const st = statutSeance(s.statut)
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{formatDate(s.date)}</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>{formatTime(s.date)}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{s.typeSeance}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{s.duree} min</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>Dr. {s.praticien?.nom}</td>
                        <td style={{ padding: '12px 16px' }}><Badge {...st} /></td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B', maxWidth: 200 }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {s.notes || '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table></div>
            )}
          </div>
        )}

        {/* ── Tab: Plan de traitement ── */}
        {activeTab === 'plan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Progression */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>📈 Progression du traitement</h3>
              {pct !== null ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                      {seancesRealisees.length} séances réalisées sur {patient.nbSeancesPrescrites} prescrites
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: pct >= 80 ? '#16A34A' : '#2563EB' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 12, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#16A34A' : '#2563EB', borderRadius: 999, transition: 'width 0.5s ease' }} />
                  </div>
                  {pct >= 100 && (
                    <p style={{ marginTop: 10, fontSize: 13, color: '#16A34A', fontWeight: 500 }}>✅ Traitement complété !</p>
                  )}
                </div>
              ) : (
                <p style={{ color: '#64748B', fontSize: 14 }}>Aucun plan de traitement défini pour ce patient.</p>
              )}
            </div>

            {/* Détails du plan */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>📋 Détails du plan</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Séances prescrites', value: patient.nbSeancesPrescrites ? `${patient.nbSeancesPrescrites} séances` : null },
                  { label: 'Fréquence', value: patient.frequence },
                  { label: 'Types de séances', value: patient.typesSeances },
                  { label: 'Date de début', value: patient.dateDebutSouhaite ? formatDate(patient.dateDebutSouhaite) : null },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: 14, background: '#F8FAFC', borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>{label.toUpperCase()}</div>
                    <div style={{ fontSize: 14, color: '#0F172A', fontWeight: 500 }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
              {patient.objectifsTraitement && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 8 }}>OBJECTIFS DU TRAITEMENT</div>
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 16, fontSize: 14, color: '#1E40AF', lineHeight: 1.6 }}>
                    {patient.objectifsTraitement}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Facturation ── */}
        {activeTab === 'facturation' && (
          <div className="table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', margin: 0 }}>Factures ({patient.factures?.length || 0})</h3>
            </div>
            {patient.factures?.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 14 }}>Aucune facture</div>
            ) : (
              <>
                {/* Résumé financier */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, borderBottom: '1px solid #E2E8F0' }}>
                  {(() => {
                    const facs = patient.factures || []
                    const totalFacture = facs.reduce((s: number, f: any) => s + (f.montant || 0), 0)
                    const totalPaye    = facs.reduce((s: number, f: any) => s + (f.montantPaye ?? (f.statut === 'paye' ? f.montant : 0)), 0)
                    const reste        = Math.max(0, totalFacture - totalPaye)
                    return [
                      { label: 'Total facturé', value: formatMoney(totalFacture), color: '#0F172A' },
                      { label: 'Total payé',    value: formatMoney(totalPaye),    color: '#16A34A' },
                      { label: 'Reste dû',      value: formatMoney(reste),        color: reste > 0 ? '#DC2626' : '#16A34A' },
                      { label: 'Tarif séance',  value: patient.tarifSeance ? `${patient.tarifSeance} MAD` : '—', color: '#2563EB' },
                    ]
                  })().map(({ label, value, color }) => (
                    <div key={label} style={{ padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div className="table-scroll"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      {['Date', 'Montant', 'Statut', 'Date paiement'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#64748B', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {patient.factures?.map((f: any, i: number) => {
                      const st = statutFacture(f.statut)
                      return (
                        <tr key={f.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{formatDate(f.dateEmise)}</td>
                          <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{formatMoney(f.montant)}</td>
                          <td style={{ padding: '12px 16px' }}><Badge {...st} /></td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>{f.datePaiement ? formatDate(f.datePaiement) : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table></div>
              </>
            )}
          </div>
        )}

        {/* ── Tab: Progression ── */}
        {activeTab === 'progression' && (
          <ProgressionTab patient={patient} onScoresSaved={fetchPatient} />
        )}

        {/* ── Tab: Documents ── */}
        {activeTab === 'documents' && (
          <DocumentsTab patientId={id} />
        )}

        {/* ── Tab: Programmes IA ── */}
        {activeTab === 'programmes' && patient && (
          <ProgrammesTab patient={patient} cabinet={cabinet} />
        )}

      </div>

      {showPlanifier && (
        <PlanifierModal
          patientId={id}
          onClose={() => setShowPlanifier(false)}
          onSuccess={fetchPatient}
        />
      )}
      {showExercices && patient && (
        <ExercicesModal
          patient={{ id: patient.id, prenom: patient.prenom, nom: patient.nom, telephone: patient.telephone }}
          onClose={() => setShowExercices(false)}
        />
      )}

      {/* QR Code modal */}
      {showQr && (
        qrLoading ? (
          <div className="modal-overlay" style={{ zIndex: 200 }}>
            <div className="modal-sheet" style={{ padding: 40, width: 300, textAlign: 'center' }}>
              <p style={{ color: '#64748B', margin: 0 }}>Génération du QR code...</p>
            </div>
          </div>
        ) : qrToken && patient ? (
          <QrCodeModal
            url={`${APP_URL}/patient-public/${qrToken}`}
            title={`${patient.prenom} ${patient.nom}`}
            subtitle={`Patient · ${qrToken.slice(0, 8)}...`}
            onClose={() => setShowQr(false)}
          />
        ) : null
      )}
    </div>
  )
}

// ─── Mobile-only helpers ─────────────────────────────────────────────────────

function mActionBtn(opts: { bg: string; color: string; border?: string }): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 10, borderRadius: 12,
    background: opts.bg, color: opts.color,
    border: opts.border || 'none',
    fontSize: 13, fontWeight: 600,
    cursor: 'pointer', minHeight: 44,
  }
}

function MInfoRow({ label, value, link, last }: {
  label: string
  value?: string | null
  link?: string
  last?: boolean
}) {
  if (!value) return null
  const content = link
    ? <a href={link} style={{ color: '#2563EB', textDecoration: 'none' }}>{value}</a>
    : value
  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: last ? 'none' : '1px solid #F8FAFC',
    }}>
      <div style={{
        fontSize: 11, color: '#94A3B8',
        textTransform: 'uppercase', letterSpacing: 0.5,
        fontWeight: 600, marginBottom: 3,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 14, color: '#0F172A',
        overflowWrap: 'anywhere', wordBreak: 'break-word',
      }}>
        {content}
      </div>
    </div>
  )
}

// ─── Programmes IA Tab ───────────────────────────────────────────────────────

function ProgrammesTab({ patient, cabinet }: { patient: any; cabinet: any }) {
  const [programmes, setProgrammes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/patients/${patient.id}/exercise-programs`)
      const d = await r.json()
      if (Array.isArray(d)) setProgrammes(d)
    } finally { setLoading(false) }
  }, [patient.id])

  useEffect(() => { load() }, [load])

  function resend(p: any) {
    if (!patient.telephone) { alert('Aucun numéro de téléphone pour ce patient.'); return }
    const msg = formatWhatsAppMessage(p.contenu, {
      patientPrenom: patient.prenom,
      pathologie:    patient.pathologie || '—',
      cabinetNom:    cabinet?.nom ?? undefined,
      cabinetTel:    cabinet?.telephone ?? undefined,
      langue:        p.langue === 'ar' ? 'ar' : 'fr',
    })
    window.open(waUrl(patient.telephone, msg), '_blank')
    fetch(`/api/exercise-programs/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markSent: true }),
    }).then(load)
  }

  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={17} color="#7C3AED" />
            Programmes d'exercices
          </h2>
          <p style={{ fontSize: 12.5, color: '#64748B', margin: '3px 0 0' }}>
            Générés par Claude AI · envoyés au patient sur WhatsApp
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', borderRadius: 10,
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
          color: 'white', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
        }}>
          <Sparkles size={14} /> Nouveau programme
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 36, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Chargement…</div>
      ) : programmes.length === 0 ? (
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EDE9FE', color: '#7C3AED', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Sparkles size={24} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Aucun programme généré</div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 18 }}>
            Cliquez sur « Nouveau programme » pour créer un programme personnalisé avec Claude AI.
          </div>
        </div>
      ) : (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {programmes.map(p => (
            <div key={p.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>{p.titre}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  {formatDate(p.createdAt)} · {p.langue === 'ar' ? 'العربية' : 'Français'} · {p.contenu?.exercices?.length ?? 0} exercices
                </div>
              </div>
              {p.envoyeWhatsApp && (
                <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  ✓ Envoyé WA
                </span>
              )}
              <button onClick={() => resend(p)} title="Renvoyer sur WhatsApp" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                background: '#25D366', color: 'white', border: 'none',
                fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
              }}>
                <Send size={12} /> {p.envoyeWhatsApp ? 'Renvoyer' : 'Envoyer'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ExerciseProgramModal
          patient={{
            id: patient.id, prenom: patient.prenom, nom: patient.nom,
            pathologie: patient.pathologie, telephone: patient.telephone,
          }}
          cabinet={cabinet ? { nom: cabinet.nom, telephone: cabinet.telephone } : null}
          onClose={() => setShowModal(false)}
          onSent={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}
