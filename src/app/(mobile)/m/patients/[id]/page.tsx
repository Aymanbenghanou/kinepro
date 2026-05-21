'use client'

import { useState, useEffect, useCallback, useMemo, useRef, use as usePromise } from 'react'
import Link from 'next/link'
import MobileTopbar from '@/components/mobile/MobileTopbar'
import { QrCode, Download } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, ResponsiveContainer } from 'recharts'

const AVATAR_COLORS = [
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#DCFCE7', text: '#15803D' },
  { bg: '#FEF3C7', text: '#B45309' },
  { bg: '#F3E8FF', text: '#7C3AED' },
  { bg: '#FFE4E6', text: '#BE123C' },
  { bg: '#E0F2FE', text: '#0369A1' },
]
const avatarColor = (n: string) => AVATAR_COLORS[(n?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]

const TABS = ['Infos', 'Séances', 'Factures', 'Progrès', 'Docs', 'QR'] as const
type TabId = typeof TABS[number]

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'djouneyaq'
const UPLOAD_PRESET = 'kinepro_docs'
const MAX_SIZE_MB = 10
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'

function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtMoney(n: number): string {
  return `${(n || 0).toLocaleString('fr-MA')} MAD`
}

export default function MobilePatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params)
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('Infos')

  // Docs state
  const [docs, setDocs] = useState<any[]>([])
  const [docFilter, setDocFilter] = useState<'Tous' | 'Ordonnances' | 'Radios' | 'Autres'>('Tous')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const fetchPatient = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/patients/${id}`)
      const d = await r.json()
      if (!d.error) setPatient(d)
    } catch {}
    setLoading(false)
  }, [id])

  const fetchDocs = useCallback(async () => {
    try {
      const r = await fetch(`/api/patients/${id}/documents`)
      const d = await r.json()
      if (Array.isArray(d)) setDocs(d)
    } catch {}
  }, [id])

  useEffect(() => { fetchPatient() }, [fetchPatient])
  useEffect(() => { if (activeTab === 'Docs') fetchDocs() }, [activeTab, fetchDocs])

  // ── Derived data ──────────────────────────────────────────────────────────
  const seances = patient?.seances ?? []
  const factures = patient?.factures ?? []
  const feedbacks = patient?.feedbacks ?? []

  const seancesRealisees   = seances.filter((s: any) => s.statut === 'realisee').length
  const seancesPrescrites  = patient?.nbSeancesPrescrites ?? seances.length ?? 0
  const seancesRestantes   = Math.max(0, seancesPrescrites - seancesRealisees)
  const progressionTraitement = seancesPrescrites > 0 ? Math.round((seancesRealisees / seancesPrescrites) * 100) : 0

  const totalFacture = factures.reduce((s: number, f: any) => s + (f.montant || 0), 0)
  const totalPaye    = factures.reduce((s: number, f: any) => s + (f.montantPaye ?? (f.statut === 'paye' ? f.montant : 0)), 0)
  const resteTotal   = Math.max(0, totalFacture - totalPaye)

  const scoredAsc = useMemo(() => [...seances]
    .filter((s: any) => typeof s.douleurScore === 'number' || typeof s.mobiliteScore === 'number')
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()), [seances])
  const douleurArr  = scoredAsc.filter((s: any) => typeof s.douleurScore  === 'number').map((s: any) => s.douleurScore)
  const mobiliteArr = scoredAsc.filter((s: any) => typeof s.mobiliteScore === 'number').map((s: any) => s.mobiliteScore)
  const initialDouleur  = douleurArr[0] ?? null
  const lastDouleur     = douleurArr[douleurArr.length - 1] ?? null
  const initialMobilite = mobiliteArr[0] ?? null
  const lastMobilite    = mobiliteArr[mobiliteArr.length - 1] ?? null
  // Formule de progression — identique au desktop ProgressionTab.tsx l.130
  const progressPct: number | null = initialDouleur != null && lastDouleur != null && initialDouleur > 0
    ? Math.max(0, Math.round(((initialDouleur - lastDouleur) / initialDouleur) * 100))
    : null

  // Bar-chart data: une barre par séance scorée (S1..Sn) avec niveau de douleur
  const douleurChart = useMemo(() => scoredAsc
    .filter((s: any) => typeof s.douleurScore === 'number')
    .map((s: any, i: number) => ({ label: `S${i + 1}`, douleur: s.douleurScore as number })),
  [scoredAsc])

  // Objectifs — parsing texte libre du champ patient.objectifsTraitement
  // Convention de préfixe (cohérente avec MobileProgressionTab supprimé) :
  //   ✓ / ✔ / [x] = fait        →  / [~] = en cours        sinon = à venir
  const objectifs = useMemo(() => {
    const raw = (patient?.objectifsTraitement ?? '').trim()
    if (!raw) return []
    return raw.split(/\r?\n/).filter((l: string) => l.trim()).map((line: string) => {
      const done       = /^\s*[✓✔x]\s/i.test(line) || /^\s*\[x\]/i.test(line)
      const inProgress = /^\s*[→>]\s/.test(line)  || /^\s*\[~\]/.test(line)
      const label = line
        .replace(/^\s*[✓✔x→>]\s+/i, '')
        .replace(/^\s*\[[x~]\]\s*/i, '')
        .replace(/^\s*[-•]\s*/, '')
        .trim()
      return { label, done, inProgress }
    })
  }, [patient?.objectifsTraitement])

  const fbScores = feedbacks.map((f: any) => f.score).filter((n: any) => typeof n === 'number')
  const sScores  = seances.map((s: any) => s.scorePatient).filter((n: any) => typeof n === 'number')
  const allScores = fbScores.length ? fbScores : sScores
  const avgScore = allScores.length
    ? Math.round((allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length) * 10) / 10
    : null

  const filteredDocs = useMemo(() => {
    if (docFilter === 'Tous')        return docs
    if (docFilter === 'Ordonnances') return docs.filter(d => d.type === 'ordonnance')
    if (docFilter === 'Radios')      return docs.filter(d => d.type === 'radio' || d.type === 'irm')
    if (docFilter === 'Autres')      return docs.filter(d => d.type !== 'ordonnance' && d.type !== 'radio' && d.type !== 'irm')
    return docs
  }, [docs, docFilter])

  // ── Actions ───────────────────────────────────────────────────────────────
  // saveScores() retiré — PATCH /api/seances/:id est une mutation.
  // Seul l'upload de documents reste autorisé sur mobile (handleFileUpload).

  async function handleFileUpload(file: File) {
    setUploadError(null)
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setUploadError(`Max ${MAX_SIZE_MB} MB`); return }
    const ok = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!ok.includes(file.type)) { setUploadError('PDF/JPG/PNG uniquement'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', UPLOAD_PRESET)
      fd.append('folder', 'kinepro/documents')
      const c = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: 'POST', body: fd })
      const cd = await c.json()
      if (!c.ok) throw new Error(cd.error?.message || 'Erreur Cloudinary')
      const db = await fetch(`/api/patients/${id}/documents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: file.name.replace(/\.[^/.]+$/, ''),
          type: 'autre', url: cd.secure_url, size: cd.bytes,
        }),
      })
      if (!db.ok) throw new Error('Échec sauvegarde')
      await fetchDocs()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  if (loading) return (
    <div>
      <MobileTopbar title="Chargement…" />
      <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Chargement…</div>
    </div>
  )
  if (!patient) return (
    <div>
      <MobileTopbar title="Introuvable" />
      <div style={{ padding: 40, textAlign: 'center', color: '#DC2626', fontSize: 14 }}>Patient introuvable</div>
    </div>
  )

  const age = patient.dateNaissance ? Math.floor((Date.now() - new Date(patient.dateNaissance).getTime()) / (365.25 * 86400000)) : null
  const av = avatarColor(patient.nom)
  const qrUrl = patient.publicToken ? `${APP_URL}/patient-public/${patient.publicToken}` : null

  return (
    <div>
      <MobileTopbar title={`${patient.prenom} ${patient.nom}`} subtitle="Dossier patient" back={{ href: '/m/patients', label: 'Patients' }} />

      {/* Tabs */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 20,
        background: 'white', borderBottom: '0.5px solid #E2E8F0',
        display: 'flex', gap: 6, overflowX: 'auto',
        WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
        padding: '10px 16px',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                border: 'none', cursor: 'pointer',
                background: active ? '#2563EB' : '#F1F5F9',
                color:      active ? 'white'   : '#64748B',
              }}>
              {tab}
            </button>
          )
        })}
      </div>

      {/* ── INFOS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'Infos' && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ background: 'white', borderRadius: 16, border: '0.5px solid #E2E8F0', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: av.bg, color: av.text,
                fontSize: 20, fontWeight: 500, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {patient.prenom?.[0]}{patient.nom?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 17, fontWeight: 500, color: '#0F172A' }}>
                    {patient.prenom} {patient.nom}
                  </span>
                  <span style={{
                    background: patient.actif ? '#F0FDF4' : '#F1F5F9',
                    color:      patient.actif ? '#15803D' : '#64748B',
                    fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {patient.actif ? 'Actif' : 'Inactif'}
                  </span>
                  {patient.sexe && (
                    <span style={{
                      background: '#EFF6FF', color: '#2563EB',
                      fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{patient.sexe}</span>
                  )}
                </div>
                {(age !== null || patient.sexe) && (
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                    {age !== null && `${age} ans`}
                    {age !== null && patient.sexe && ' · '}
                    {patient.sexe}
                  </div>
                )}
                {patient.telephone && (
                  <a href={`tel:${patient.telephone}`} style={{ fontSize: 13, color: '#2563EB', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                    📞 {patient.telephone}
                  </a>
                )}
              </div>
            </div>

            {patient.pathologie && (
              <div style={{ padding: '0 16px 12px' }}>
                <span style={{
                  background: '#FFF7ED', color: '#B45309',
                  fontSize: 12, fontWeight: 500,
                  padding: '6px 14px', borderRadius: 20,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  🏥 {patient.pathologie}
                </span>
              </div>
            )}

            {/* Mode lecture seule : seules les actions de consultation sont conservées.
                "Exercices" (génère programme) et "Planifier" (crée RDV) retirées. */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 8, padding: 12, borderTop: '0.5px solid #F1F5F9',
            }}>
              <button type="button" onClick={() => setActiveTab('QR')} style={{
                ...actionBtn({ bg: 'white', color: '#2563EB', border: '0.5px solid #BFDBFE' }),
                cursor: 'pointer',
              }}>
                <QrCode size={14} /> QR Code
              </button>
              <Link href={`/patients/${id}`} style={actionBtn({ bg: 'white', color: '#DC2626', border: '0.5px solid #FECACA' })}>
                <Download size={14} /> PDF
              </Link>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 16, border: '0.5px solid #E2E8F0', overflow: 'hidden' }}>
            <InfoRow label="Email"             value={patient.email}            link={patient.email ? `mailto:${patient.email}` : undefined} />
            <InfoRow label="Adresse"           value={patient.adresse} />
            <InfoRow label="Ville"             value={patient.ville} />
            <InfoRow label="CIN"               value={patient.cin} />
            <InfoRow label="Mutuelle"          value={patient.mutuelle} />
            <InfoRow label="N° police"         value={patient.numeroPolice} />
            <InfoRow label="Médecin référent"  value={patient.medecinReferent} />
            <InfoRow label="Tél. médecin"      value={patient.medecinTelephone} link={patient.medecinTelephone ? `tel:${patient.medecinTelephone}` : undefined} />
            <InfoRow label="Mode paiement"     value={patient.modePaiement} />
            <InfoRow label="Tarif séance"      value={patient.tarifSeance ? `${patient.tarifSeance} MAD` : null} last />
          </div>
        </div>
      )}

      {/* ── SÉANCES TAB ────────────────────────────────────────────────── */}
      {activeTab === 'Séances' && (
        <div style={{ padding: '12px 16px' }}>
          {/* Progress bar */}
          <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0', padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>Progression traitement</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#2563EB', whiteSpace: 'nowrap' }}>
                {seancesRealisees} / {seancesPrescrites}
              </span>
            </div>
            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressionTraitement}%`, background: '#2563EB', borderRadius: 999, transition: 'width 0.4s' }} />
            </div>
            <p style={{ fontSize: 10, color: '#94A3B8', margin: '4px 0 0' }}>
              {seancesRestantes} séances restantes
            </p>
          </div>

          {seances.length === 0 ? (
            <div style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: 16 }}>
              Aucune séance enregistrée
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {seances.map((s: any) => {
                const pill =
                  s.statut === 'realisee' ? { bg: '#F0FDF4', color: '#15803D', label: '✓ Réalisée' } :
                  s.statut === 'annulee'  ? { bg: '#FEE2E2', color: '#B91C1C', label: '✕ Annulée'  } :
                                            { bg: '#FFFBEB', color: '#B45309', label: '⏳ En attente' }
                return (
                  <div key={s.id} style={{ background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.typeSeance}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: pill.bg, color: pill.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {pill.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748B', flexWrap: 'wrap' }}>
                        <span>📅 {fmtDate(s.date)}</span>
                        <span>⏱ {s.duree} min</span>
                        {s.praticien && <span>👨‍⚕️ Dr. {s.praticien.prenom}</span>}
                      </div>
                      {typeof s.scorePatient === 'number' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <span style={{ fontSize: 10, color: '#94A3B8' }}>Feedback :</span>
                          <span style={{
                            fontSize: 12, fontWeight: 600,
                            color: s.scorePatient >= 8 ? '#16A34A' : s.scorePatient >= 5 ? '#D97706' : '#DC2626',
                            whiteSpace: 'nowrap',
                          }}>
                            {s.scorePatient}/10
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Footer "⭐ Feedback" / "💪 Programme" retiré — mutations. */}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── FACTURES TAB ───────────────────────────────────────────────── */}
      {activeTab === 'Factures' && (
        <div style={{ padding: '12px 16px' }}>
          {/* Summary bar */}
          <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0', padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmtMoney(totalFacture)}</div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Total</div>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#16A34A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmtMoney(totalPaye)}</div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Payé</div>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: resteTotal > 0 ? '#DC2626' : '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmtMoney(resteTotal)}</div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Reste</div>
              </div>
            </div>
          </div>

          {factures.length === 0 ? (
            <div style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: 16 }}>
              Aucune facture
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {factures.map((f: any) => {
                const paye  = f.montantPaye ?? (f.statut === 'paye' ? f.montant : 0)
                const total = f.montant ?? 0
                const reste = Math.max(0, total - paye)
                const isPaid    = paye >= total && total > 0
                const isPartial = paye > 0 && paye < total
                const pill = isPaid    ? { bg: '#F0FDF4', color: '#15803D', label: '✓ Payée' } :
                             isPartial ? { bg: '#FFFBEB', color: '#B45309', label: '🔶 Partielle' } :
                             f.statut === 'en_retard' ? { bg: '#FEE2E2', color: '#B91C1C', label: '🔴 En retard' } :
                                                        { bg: '#FFFBEB', color: '#B45309', label: '⏳ En attente' }
                return (
                  <div key={f.id} style={{ background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A', whiteSpace: 'nowrap' }}>
                          Facture #{f.id.slice(-4)}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: pill.bg, color: pill.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {pill.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>
                        📅 {fmtDate(f.dateEmise ?? f.createdAt)}
                      </div>
                      {isPartial ? (
                        <>
                          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ height: '100%', width: `${(paye / total) * 100}%`, background: '#F59E0B', borderRadius: 999 }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                            <span style={{ color: '#64748B' }}>{fmtMoney(paye)} / {fmtMoney(total)}</span>
                            <span style={{ color: '#DC2626', fontWeight: 500, whiteSpace: 'nowrap' }}>Reste : {fmtMoney(reste)}</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>{fmtMoney(total)}</div>
                      )}
                    </div>
                    {/* "💰 Payer" retiré — encaissement = mutation.
                        "📄 PDF" conservé (lecture/téléchargement). */}
                    <div style={{ display: 'flex', borderTop: '0.5px solid #F1F5F9' }}>
                      <Link href={`/facturation/${f.id}`} style={cellBtn('#2563EB')}>📄 PDF</Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PROGRÈS TAB ────────────────────────────────────────────────── */}
      {activeTab === 'Progrès' && (
        <div style={{ padding: '12px 16px' }}>
          {/* KPI 2×2 — lecture seule, valeurs réelles uniquement, "—" si pas de source */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 8 }}>
            {/* Douleur — initiale + flèche → actuelle (lowerIsBetter) */}
            <Kpi label="Douleur initiale" color="#EF4444">
              <span style={{ whiteSpace: 'nowrap' }}>{initialDouleur ?? '—'}/10</span>
              {lastDouleur != null && initialDouleur != null && (
                <p style={{ fontSize: 11, color: '#16A34A', fontWeight: 500, margin: '4px 0 0', whiteSpace: 'nowrap' }}>
                  → {lastDouleur}/10 actuel
                </p>
              )}
            </Kpi>

            {/* Progression — uniquement si calculable */}
            <Kpi label="Progression" color="#16A34A">
              <span style={{ whiteSpace: 'nowrap' }}>{progressPct != null ? `${progressPct}%` : '—'}</span>
              {seancesPrescrites > 0 && (
                <p style={{ fontSize: 11, color: '#64748B', margin: '4px 0 0', whiteSpace: 'nowrap' }}>
                  {seancesRealisees}/{seancesPrescrites} séances
                </p>
              )}
            </Kpi>

            {/* Mobilité — actuelle + delta (higherIsBetter) */}
            <Kpi label="Mobilité" color="#2563EB">
              <span style={{ whiteSpace: 'nowrap' }}>{lastMobilite ?? '—'}/10</span>
              {lastMobilite != null && initialMobilite != null && (lastMobilite - initialMobilite) !== 0 && (
                <p style={{
                  fontSize: 11, fontWeight: 500, margin: '4px 0 0', whiteSpace: 'nowrap',
                  color: lastMobilite - initialMobilite > 0 ? '#16A34A' : '#DC2626',
                }}>
                  {lastMobilite - initialMobilite > 0 ? '↑ +' : '↓ '}{lastMobilite - initialMobilite} pts
                </p>
              )}
            </Kpi>

            {/* Satisfaction — moy. feedbacks (Feedback.score d'abord, fallback seance.scorePatient) */}
            <Kpi label="Satisfaction" color="#F59E0B">
              <span style={{ whiteSpace: 'nowrap' }}>{avgScore != null ? `${avgScore}/10` : '—'}</span>
              <p style={{ fontSize: 10, color: '#94A3B8', margin: '4px 0 0' }}>
                {avgScore != null ? 'Moy. feedbacks' : 'Aucun feedback'}
              </p>
            </Kpi>
          </div>

          {/* Évolution douleur — graphique barres par séance scorée */}
          <div style={{
            background: 'white', borderRadius: 16, border: '0.5px solid #E2E8F0',
            padding: '14px 14px 8px', marginTop: 12, marginBottom: 12,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: '0 0 12px' }}>
              Évolution douleur
            </h3>
            {douleurChart.length === 0 ? (
              <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                Aucune donnée de progression
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={douleurChart} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }}
                    axisLine={false} tickLine={false} interval={0} />
                  <Bar dataKey="douleur" radius={[4, 4, 0, 0]}>
                    {douleurChart.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.douleur >= 7 ? '#EF4444' : entry.douleur >= 4 ? '#F59E0B' : '#22C55E'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Objectifs — parsing texte libre, 3 statuts */}
          {objectifs.length > 0 && (
            <div style={{
              background: 'white', borderRadius: 16, border: '0.5px solid #E2E8F0',
              padding: 14, marginBottom: 16,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: '0 0 12px' }}>
                Objectifs
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {objectifs.map((obj: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600,
                      background: obj.done       ? '#F0FDF4' : obj.inProgress ? '#EFF6FF' : '#F1F5F9',
                      color:      obj.done       ? '#16A34A' : obj.inProgress ? '#2563EB' : '#94A3B8',
                    }}>
                      {obj.done ? '✓' : obj.inProgress ? '→' : '○'}
                    </div>
                    <span style={{
                      fontSize: 13.5,
                      color: obj.done ? '#94A3B8' : '#0F172A',
                      textDecoration: obj.done ? 'line-through' : 'none',
                      overflowWrap: 'anywhere',
                    }}>
                      {obj.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DOCS TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'Docs' && (
        <div style={{ padding: '12px 16px' }}>
          {/* Upload zone */}
          <div style={{
            background: 'white', borderRadius: 12,
            border: '2px dashed #E2E8F0', padding: 16,
            textAlign: 'center', marginBottom: 12,
          }}>
            <p style={{ fontSize: 20, margin: '0 0 4px' }}>📎</p>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#475569', margin: 0 }}>Ajouter un document</p>
            <p style={{ fontSize: 10, color: '#94A3B8', margin: '4px 0 0' }}>PDF, JPG, PNG · max {MAX_SIZE_MB} MB</p>
            <button
              onClick={() => fileInput.current?.click()} disabled={uploading}
              style={{
                marginTop: 8, background: '#2563EB', color: 'white',
                padding: '6px 16px', borderRadius: 8,
                fontSize: 12, fontWeight: 500,
                border: 'none', cursor: uploading ? 'wait' : 'pointer',
                opacity: uploading ? 0.7 : 1,
              }}>
              {uploading ? 'Envoi…' : '+ Uploader'}
            </button>
            <input ref={fileInput} type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
            />
            {uploadError && (
              <p style={{ fontSize: 11, color: '#DC2626', fontWeight: 500, margin: '8px 0 0' }}>{uploadError}</p>
            )}
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', marginBottom: 12 }}>
            {(['Tous', 'Ordonnances', 'Radios', 'Autres'] as const).map(f => {
              const active = docFilter === f
              return (
                <button key={f} onClick={() => setDocFilter(f)}
                  style={{
                    flexShrink: 0, padding: '6px 14px', borderRadius: 999,
                    fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                    border: 'none', cursor: 'pointer',
                    background: active ? '#2563EB' : '#F1F5F9',
                    color:      active ? 'white'   : '#64748B',
                  }}>
                  {f}
                </button>
              )
            })}
          </div>

          {/* Doc cards */}
          {filteredDocs.length === 0 ? (
            <div style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: 16 }}>
              Aucun document
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {filteredDocs.map((doc: any) => {
                const dtBg =
                  doc.type === 'ordonnance' ? '#EFF6FF' :
                  doc.type === 'radio' || doc.type === 'irm' ? '#F0F9FF' :
                  doc.type === 'compte_rendu' ? '#FFFBEB' : '#F8FAFC'
                const dtIcon =
                  doc.type === 'ordonnance' ? '📋' :
                  doc.type === 'radio' || doc.type === 'irm' ? '🩻' :
                  doc.type === 'compte_rendu' ? '📄' : '📎'
                return (
                  <div key={doc.id} style={{ background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0', overflow: 'hidden', minWidth: 0 }}>
                    <div style={{ padding: 12, textAlign: 'center' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: dtBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, margin: '0 auto 8px',
                      }}>
                        {dtIcon}
                      </div>
                      <p style={{
                        fontSize: 11, fontWeight: 500, color: '#0F172A',
                        margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {doc.nom}
                      </p>
                      <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>
                        {fmtDate(doc.createdAt)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', borderTop: '0.5px solid #F1F5F9' }}>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 500, color: '#2563EB', textDecoration: 'none' }}>
                        👁 Voir
                      </a>
                      <div style={{ width: 1, background: '#F1F5F9' }} />
                      <a href={doc.url} download
                        style={{ flex: 1, padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 500, color: '#64748B', textDecoration: 'none' }}>
                        ⬇
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── QR TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'QR' && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ background: 'white', borderRadius: 16, border: '0.5px solid #E2E8F0', padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', margin: '0 0 16px' }}>QR Code patient</p>
            {qrUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR Code patient" width={160} height={160}
                  style={{ display: 'inline-block', borderRadius: 8 }}
                />
                <p style={{ fontSize: 15, fontWeight: 500, color: '#0F172A', margin: '12px 0 2px' }}>
                  {patient.prenom} {patient.nom}
                </p>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                  Patient #{patient.id.slice(-4)}
                </p>
                <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <a href={`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(qrUrl)}&download=1`}
                    download={`qr-${patient.prenom}-${patient.nom}.png`}
                    style={{
                      background: '#EFF6FF', color: '#2563EB',
                      padding: '8px 18px', borderRadius: 12,
                      fontSize: 12, fontWeight: 500, textDecoration: 'none',
                    }}>
                    📥 Télécharger
                  </a>
                  <Link href={`/patients/${id}`} style={{
                    background: '#F1F5F9', color: '#475569',
                    padding: '8px 18px', borderRadius: 12,
                    fontSize: 12, fontWeight: 500, textDecoration: 'none',
                  }}>
                    🖨️ Imprimer
                  </Link>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12, color: '#94A3B8' }}>QR non disponible pour ce patient.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function actionBtn(opts: { bg: string; color: string; border?: string }): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 44, borderRadius: 12,
    background: opts.bg, color: opts.color,
    border: opts.border || 'none',
    fontSize: 13, fontWeight: 500,
    textDecoration: 'none', minWidth: 0,
  }
}

function cellBtn(color: string): React.CSSProperties {
  return {
    flex: 1, padding: '10px 4px', textAlign: 'center',
    fontSize: 12, fontWeight: 500, color,
    textDecoration: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  }
}

function InfoRow({ label, value, link, last }: {
  label: string; value?: string | null; link?: string; last?: boolean
}) {
  if (!value) return null
  const content = link
    ? <a href={link} style={{ color: '#2563EB', textDecoration: 'none' }}>{value}</a>
    : value
  return (
    <div style={{ padding: '12px 16px', borderBottom: last ? 'none' : '0.5px solid #F8FAFC' }}>
      <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#0F172A', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{content}</div>
    </div>
  )
}

function Kpi({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0', padding: 12, minWidth: 0, overflow: 'hidden' }}>
      <p style={{ fontSize: 10, fontWeight: 500, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>{label}</p>
      <div style={{ fontSize: 20, fontWeight: 600, color, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {children}
      </div>
    </div>
  )
}
