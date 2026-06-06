'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import Toast from '@/components/ui/Toast'
import { formatDate, formatTime } from '@/lib/utils'
import { Plus, X } from 'lucide-react'
import { scoreColor, scoreBadge } from '@/lib/whatsapp'
import { useCan } from '@/lib/use-permissions'
import { SeanceStatut } from '@prisma/client'

// Fallback if API fails
const TYPES_FALLBACK = ['Rééducation fonctionnelle', 'Massage thérapeutique', 'Électrothérapie', 'Balnéothérapie']

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    planifiee: { label: 'Planifiée', bg: '#DBEAFE', color: '#1D4ED8' },
    realisee:  { label: 'Réalisée',  bg: '#DCFCE7', color: '#16A34A' },
    annulee:   { label: 'Annulée',   bg: '#FEE2E2', color: '#DC2626' },
    no_show:   { label: 'Absent',    bg: '#FEF3C7', color: '#D97706' },
  }
  const s = map[statut] || { label: statut, bg: '#F1F5F9', color: '#64748B' }
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>
      {s.label}
    </span>
  )
}

function FeedbackBadge({ seance }: { seance: any }) {
  if (seance.statut !== SeanceStatut.realisee) return null

  if (seance.scorePatient === null || seance.scorePatient === undefined) {
    return (
      <span
        style={{
          background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D',
          padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
          whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4,
        }}
      >
        ⏳ En attente du patient
      </span>
    )
  }

  const score = seance.scorePatient as number
  const badge = scoreBadge(score)
  return (
    <span style={{
      background: badge.bg, color: badge.color,
      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {badge.emoji} {score}/10
    </span>
  )
}

export default function SeancesClient({ initialSeances }: { initialSeances: any[] }) {
  const [seances, setSeances]     = useState<any[]>(initialSeances)
  const [patients, setPatients]   = useState<any[]>([])
  const [praticiens, setPraticiens] = useState<any[]>([])
  const [seanceTypes, setSeanceTypes] = useState<any[]>([])
  // Data initiale fournie en SSR (perf P2) → pas de loading au 1er rendu.
  const [loading, setLoading]     = useState(false)
  const skipFirstFetch            = useRef(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedSeance, setSelectedSeance] = useState<any>(null)
  const [progScores, setProgScores] = useState({ douleur: 5, mobilite: 5, force: 5, notes: '' })
  const [terminating, setTerminating] = useState(false)
  const [terminateDone, setTerminateDone] = useState(false)
  // Statut choisi dans la modal Terminer (radio buttons).
  const [terminerStatut, setTerminerStatut] = useState<SeanceStatut>(SeanceStatut.realisee)
  const [filterPatient, setFilterPatient]   = useState('')
  const [filterPraticien, setFilterPraticien] = useState('')
  const [filterStatut, setFilterStatut]     = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const can = useCan()
  const canTerminer = can('dossierMedical')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{
    patientId: string; praticienId: string; typeSeance: string;
    date: string; heure: string; duree: string; notes: string;
    statut: SeanceStatut;
  }>({
    patientId: '', praticienId: '', typeSeance: '',
    date: '', heure: '09:00', duree: '45', notes: '', statut: SeanceStatut.realisee,
  })

  async function fetchData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterPatient)   params.append('patientId', filterPatient)
      if (filterPraticien) params.append('praticienId', filterPraticien)
      if (filterStatut)    params.append('statut', filterStatut)
      const res = await fetch(`/api/seances?${params}`)
      const data = await res.json()
      setSeances(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  // Premier rendu : on consomme `initialSeances` (SSR), on évite le double
  // fetch. Les changements de filtres déclenchent un fetch normal.
  useEffect(() => {
    if (skipFirstFetch.current) { skipFirstFetch.current = false; return }
    fetchData()
  }, [filterPatient, filterPraticien, filterStatut])
  useEffect(() => {
    fetch('/api/patients').then(r => r.json()).then(d => setPatients(Array.isArray(d) ? d : []))
    fetch('/api/praticiens').then(r => r.json()).then(d => setPraticiens(Array.isArray(d) ? d : []))
    fetch('/api/seance-types').then(r => r.json()).then(d => {
      const types = Array.isArray(d) ? d : TYPES_FALLBACK.map(n => ({ nom: n, dureeDefaut: 45, tarifDefaut: 300 }))
      setSeanceTypes(types)
      // Set initial form type
      if (types.length > 0) setForm(f => ({ ...f, typeSeance: types[0].nom, duree: String(types[0].dureeDefaut) }))
    })
  }, [])

  // Auto-fill duration when type changes
  function handleTypeChange(nom: string) {
    const found = seanceTypes.find(t => t.nom === nom)
    setForm(f => ({
      ...f,
      typeSeance: nom,
      duree: found ? String(found.dureeDefaut) : f.duree,
    }))
  }

  const pendingCount = seances.filter(
    s => s.statut === SeanceStatut.realisee && (s.scorePatient === null || s.scorePatient === undefined)
  ).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/seances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: `${form.date}T${form.heure}:00`,
          duree: parseInt(form.duree),
          typeSeance: form.typeSeance,
          notes: form.notes,
          statut: form.statut,
          patientId: form.patientId,
          praticienId: form.praticienId,
        }),
      })
      setShowModal(false)
      const firstType = seanceTypes[0]
      setForm({ patientId: '', praticienId: '', typeSeance: firstType?.nom || '', date: '', heure: '09:00', duree: String(firstType?.dureeDefaut || 45), notes: '', statut: SeanceStatut.realisee })
      fetchData()
    } catch {}
    setSaving(false)
  }

  // Pre-fill progression scores when a seance is selected
  useEffect(() => {
    if (selectedSeance) {
      setProgScores({
        douleur:  selectedSeance.douleurScore  ?? 5,
        mobilite: selectedSeance.mobiliteScore ?? 5,
        force:    selectedSeance.forceScore    ?? 5,
        notes:    selectedSeance.notesProgression ?? '',
      })
      setTerminateDone(false)
      setTerminerStatut(SeanceStatut.realisee)
    }
  }, [selectedSeance])

  // PATCH /api/seances/[id]/terminer — finalise une séance planifiee avec le
  // statut choisi (radio). Scores envoyés uniquement si statut === realisee.
  async function terminerSeance() {
    if (!selectedSeance) return
    setTerminating(true)
    try {
      const body: Record<string, unknown> = { statut: terminerStatut }
      if (terminerStatut === SeanceStatut.realisee) {
        body.douleurScore     = progScores.douleur
        body.mobiliteScore    = progScores.mobilite
        body.forceScore       = progScores.force
        body.notesProgression = progScores.notes || null
      }
      const res = await fetch(`/api/seances/${selectedSeance.id}/terminer`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      if (res.ok) {
        const updated = await res.json()
        setSelectedSeance((prev: any) => ({ ...prev, ...updated }))
        setTerminateDone(true)
        const label = terminerStatut === SeanceStatut.realisee ? 'Séance terminée ✓'
                    : terminerStatut === SeanceStatut.no_show  ? 'Patient marqué absent ✓'
                    : 'Séance annulée ✓'
        setToast({ message: label, type: 'success' })
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        const msg = err?.error === 'statut_already_set'
          ? `Cette séance est déjà ${err.current}.`
          : err?.message || err?.error || 'Impossible de terminer la séance'
        setToast({ message: msg, type: 'error' })
      }
    } catch {
      setToast({ message: 'Erreur réseau', type: 'error' })
    }
    setTerminating(false)
  }

  return (
    <div>
      <Topbar
        title="Séances"
        subtitle={
          pendingCount > 0
            ? `${seances.length} séances · ⚡ ${pendingCount} feedback${pendingCount > 1 ? 's' : ''} en attente`
            : `${seances.length} séances`
        }
      />
      <div style={{ padding: 24 }}>

        {/* Alerte feedbacks en attente */}
        {pendingCount > 0 && (
          <div style={{
            background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10,
            padding: '12px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#92400E' }}>
                {pendingCount} séance{pendingCount > 1 ? 's' : ''} sans feedback patient
              </div>
              <div style={{ fontSize: 13, color: '#B45309' }}>
                Cliquez sur le badge jaune pour enregistrer le score et envoyer un message WhatsApp.
              </div>
            </div>
          </div>
        )}

        {/* Filtres + bouton */}
        <div className="page-header-row" style={{ flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={filterPatient} onChange={e => setFilterPatient(e.target.value)}
              style={{ padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: 'white', color: '#374151', minWidth: 160 }}>
              <option value="">Tous les patients</option>
              {patients.map((p: any) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
            </select>
            <select value={filterPraticien} onChange={e => setFilterPraticien(e.target.value)}
              style={{ padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: 'white', color: '#374151', minWidth: 160 }}>
              <option value="">Tous les praticiens</option>
              {praticiens.map((p: any) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
            </select>
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
              style={{ padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: 'white', color: '#374151' }}>
              <option value="">Tous les statuts</option>
              <option value={SeanceStatut.planifiee}>Planifiée</option>
              <option value={SeanceStatut.realisee}>Réalisée</option>
              <option value={SeanceStatut.annulee}>Annulée</option>
              <option value={SeanceStatut.no_show}>Absent</option>
            </select>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>
            <Plus size={16} /> Nouvelle séance
          </button>
        </div>

        {/* Table */}
        <div className="table-container">
          <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Patient', 'Date & Heure', 'Type', 'Durée', 'Praticien', 'Statut', 'Feedback', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748B', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 14 }}>Chargement...</td></tr>
              ) : seances.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 14 }}>Aucune séance trouvée</td></tr>
              ) : seances.map((s: any, i: number) => (
                <tr key={s.id}
                  style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? 'white' : '#FAFAFA', cursor: 'pointer' }}
                  onClick={() => setSelectedSeance(s)}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{s.patient?.prenom} {s.patient?.nom}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{formatDate(s.date)}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{formatTime(s.date)}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151' }}>{s.typeSeance}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151' }}>{s.duree} min</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151' }}>Dr. {s.praticien?.nom}</td>
                  <td style={{ padding: '14px 16px' }}><StatutBadge statut={s.statut} /></td>
                  <td style={{ padding: '14px 16px' }}>
                    <FeedbackBadge seance={s} />
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#2563EB' }}>Détail →</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>{/* /table-scroll */}
        </div>
      </div>

      {/* FAB: mobile only */}
      <button className="fab-btn" onClick={() => setShowModal(true)} aria-label="Nouvelle séance">
        +
      </button>

      {/* Modal détail séance */}
      {selectedSeance && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-sheet" style={{ padding: 28, width: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>Détail de la séance</h2>
              <button onClick={() => setSelectedSeance(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Patient', `${selectedSeance.patient?.prenom} ${selectedSeance.patient?.nom}`],
                ['Date', `${formatDate(selectedSeance.date)} à ${formatTime(selectedSeance.date)}`],
                ['Type', selectedSeance.typeSeance],
                ['Durée', `${selectedSeance.duree} minutes`],
                ['Praticien', `Dr. ${selectedSeance.praticien?.prenom} ${selectedSeance.praticien?.nom}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 13, color: '#64748B', minWidth: 80 }}>{label}</span>
                  <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748B', minWidth: 80 }}>Statut</span>
                <StatutBadge statut={selectedSeance.statut} />
              </div>

              {/* Terminer la séance — choix de statut puis (si Réalisée) scores.
                  Le statut décidé est définitif : impossible de le changer après. */}
              {selectedSeance.statut === SeanceStatut.planifiee && canTerminer && (
                <div style={{ marginTop: 4 }}>
                  {terminateDone ? (
                    <div style={{
                      background: '#F0FDF4', border: '1px solid #BBF7D0',
                      borderRadius: 10, padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ fontSize: 18 }}>✅</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#16A34A', fontSize: 13 }}>Séance finalisée</p>
                        <p style={{ margin: 0, color: '#166534', fontSize: 12 }}>
                          {terminerStatut === SeanceStatut.realisee && 'Statut « réalisée » figé. RDV lié → « réalisé ».'}
                          {terminerStatut === SeanceStatut.no_show  && 'Patient marqué absent. Statut figé.'}
                          {terminerStatut === SeanceStatut.annulee  && 'Séance annulée. RDV lié → « annulé ».'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: 14, background: '#EFF6FF', borderRadius: 10, borderLeft: '3px solid #2563EB' }}>
                      <div style={{ fontSize: 12, color: '#1D4ED8', marginBottom: 12, fontWeight: 700 }}>
                        🏁 TERMINER LA SÉANCE
                      </div>

                      {/* Radio statut — décision définitive */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                        {([
                          { v: SeanceStatut.realisee, label: '✓ Réalisée',  desc: 'La séance a eu lieu' },
                          { v: SeanceStatut.no_show,  label: '✗ Absent',     desc: 'Le patient ne s\'est pas présenté' },
                          { v: SeanceStatut.annulee,  label: '○ Annulée',    desc: 'La séance n\'a pas eu lieu' },
                        ] as const).map(opt => (
                          <label key={opt.v} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                            background: terminerStatut === opt.v ? 'white' : 'transparent',
                            border: `1px solid ${terminerStatut === opt.v ? '#2563EB' : 'transparent'}`,
                          }}>
                            <input type="radio" name="terminerStatut" value={opt.v}
                              checked={terminerStatut === opt.v}
                              onChange={() => setTerminerStatut(opt.v)}
                              style={{ marginTop: 2, accentColor: '#2563EB' }}
                            />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{opt.label}</div>
                              <div style={{ fontSize: 11, color: '#64748B' }}>{opt.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* Scores : uniquement si Réalisée */}
                      {terminerStatut === SeanceStatut.realisee ? (
                        <>
                          {(['douleur', 'mobilite', 'force'] as const).map(key => {
                            const labels: Record<string, string> = { douleur: '🔴 Douleur', mobilite: '🔵 Mobilité', force: '🟢 Force' }
                            const colors: Record<string, string> = { douleur: '#DC2626', mobilite: '#2563EB', force: '#16A34A' }
                            return (
                              <div key={key} style={{ marginBottom: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{labels[key]}</span>
                                  <span style={{ fontSize: 14, fontWeight: 800, color: colors[key] }}>
                                    {progScores[key]}<span style={{ fontSize: 10, color: '#94A3B8' }}>/10</span>
                                  </span>
                                </div>
                                <input type="range" min={0} max={10} value={progScores[key]}
                                  onChange={e => setProgScores(s => ({ ...s, [key]: Number(e.target.value) }))}
                                  style={{ width: '100%', accentColor: colors[key] }}
                                />
                              </div>
                            )
                          })}
                          <textarea
                            value={progScores.notes}
                            onChange={e => setProgScores(s => ({ ...s, notes: e.target.value }))}
                            placeholder="Progression / observations…"
                            rows={3}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 13, resize: 'vertical', marginBottom: 10, boxSizing: 'border-box' }}
                          />
                        </>
                      ) : (
                        <p style={{ margin: '0 0 12px', fontSize: 12, color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 10px' }}>
                          ⚠ Cette action est définitive : le statut ne pourra plus être modifié.
                        </p>
                      )}

                      <button
                        onClick={terminerSeance}
                        disabled={terminating}
                        style={{
                          width: '100%', padding: '11px',
                          background: terminating ? '#93C5FD' : '#2563EB',
                          color: 'white', border: 'none', borderRadius: 10,
                          cursor: terminating ? 'not-allowed' : 'pointer',
                          fontWeight: 700, fontSize: 14,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        {terminating ? '⏳ Enregistrement…' : '✓ Enregistrer'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback status indicator */}
              {selectedSeance.feedbackStatus === 'ready' && !selectedSeance.feedbackEnvoye && (
                <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🔔</span>
                    <span style={{ fontSize: 13, color: '#5B21B6', fontWeight: 600 }}>Feedback prêt à envoyer !</span>
                  </div>
                  <Link href="/whatsapp?tab=ready"
                    style={{ background: '#7C3AED', color: 'white', padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    Ouvrir WhatsApp Center →
                  </Link>
                </div>
              )}

              {/* Feedback section in detail modal */}
              {selectedSeance.statut === SeanceStatut.realisee && (
                <div style={{ marginTop: 8, padding: 14, background: '#F8FAFC', borderRadius: 10, borderLeft: '3px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8, fontWeight: 600 }}>FEEDBACK PATIENT</div>
                  {selectedSeance.scorePatient !== null && selectedSeance.scorePatient !== undefined ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {(() => {
                        const badge = scoreBadge(selectedSeance.scorePatient)
                        return (
                          <span style={{ background: badge.bg, color: badge.color, padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
                            {badge.emoji} {badge.label} — {selectedSeance.scorePatient}/10
                          </span>
                        )
                      })()}
                      {selectedSeance.feedbackEnvoye && (
                        <span style={{ fontSize: 12, color: '#16A34A' }}>✓ WhatsApp envoyé</span>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic' }}>
                      En attente — le patient saisira son score via le lien WhatsApp envoyé depuis le WhatsApp Center.
                    </div>
                  )}
                  {selectedSeance.notesInternes && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                      <span style={{ color: '#64748B', fontWeight: 500 }}>Notes internes : </span>
                      {selectedSeance.notesInternes}
                    </div>
                  )}
                </div>
              )}
              {selectedSeance.notes && (
                <div style={{ marginTop: 4, padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6, fontWeight: 500 }}>NOTES</div>
                  <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{selectedSeance.notes}</div>
                </div>
              )}

              {/* Scores de progression — read-only. La saisie se fait UNE SEULE FOIS
                  dans le bloc "TERMINER LA SÉANCE" ci-dessus. Ici on n'affiche que
                  les valeurs déjà persistées (douleurScore/mobiliteScore/forceScore
                  /notesProgression), ou un état neutre si rien n'a été saisi. */}
              {selectedSeance.statut === SeanceStatut.realisee && (() => {
                const d = selectedSeance.douleurScore
                const m = selectedSeance.mobiliteScore
                const f = selectedSeance.forceScore
                const notes = selectedSeance.notesProgression
                const hasAnyScore = d != null || m != null || f != null
                return (
                  <div style={{ marginTop: 8, padding: 14, background: '#F0FDF4', borderRadius: 10, borderLeft: '3px solid #16A34A' }}>
                    <div style={{ fontSize: 12, color: '#166534', fontWeight: 700, marginBottom: 12 }}>
                      📈 SCORES DE PROGRESSION
                    </div>
                    {hasAnyScore ? (
                      <>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: notes ? 12 : 0 }}>
                          {([
                            { key: 'douleur',  label: '🔴 Douleur',  value: d, color: '#DC2626', bg: '#FEE2E2' },
                            { key: 'mobilite', label: '🔵 Mobilité', value: m, color: '#2563EB', bg: '#DBEAFE' },
                            { key: 'force',    label: '🟢 Force',    value: f, color: '#16A34A', bg: '#DCFCE7' },
                          ] as const).map(s => (
                            <div key={s.key} style={{ flex: '1 1 120px', background: s.bg, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{s.label}</span>
                              <span style={{ fontSize: 16, fontWeight: 800, color: s.color }}>
                                {s.value != null ? s.value : '—'}
                                <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 2 }}>/10</span>
                              </span>
                            </div>
                          ))}
                        </div>
                        {notes && (
                          <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'white', padding: '8px 10px', borderRadius: 6, border: '1px solid #BBF7D0' }}>
                            <span style={{ color: '#65A30D', fontWeight: 600 }}>Notes : </span>
                            {notes}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: '#65A30D', fontStyle: 'italic' }}>
                        Aucun score renseigné au moment de la finalisation de la séance.
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal nouvelle séance */}
      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-sheet" style={{ padding: 28, width: 480, maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>Nouvelle séance</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Patient *</label>
                <select value={form.patientId} onChange={e => setForm(f => ({...f, patientId: e.target.value}))} required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}>
                  <option value="">Sélectionner...</option>
                  {patients.map((p: any) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Praticien *</label>
                <select value={form.praticienId} onChange={e => setForm(f => ({...f, praticienId: e.target.value}))} required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}>
                  <option value="">Sélectionner...</option>
                  {praticiens.map((p: any) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Type de séance</label>
                <select value={form.typeSeance} onChange={e => handleTypeChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}>
                  {seanceTypes.map((t: any) => (
                    <option key={t.id || t.nom} value={t.nom}>
                      {t.nom}{t.dureeDefaut ? ` (${t.dureeDefaut} min — ${t.tarifDefaut} MAD)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Heure</label>
                  <input type="time" value={form.heure} onChange={e => setForm(f => ({...f, heure: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Durée (min)</label>
                  <select value={form.duree} onChange={e => setForm(f => ({...f, duree: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Statut</label>
                  <select value={form.statut} onChange={e => setForm(f => ({...f, statut: e.target.value as SeanceStatut}))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}>
                    <option value={SeanceStatut.realisee}>Réalisée</option>
                    <option value={SeanceStatut.annulee}>Annulée</option>
                    <option value={SeanceStatut.no_show}>Absent</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#64748B' }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#2563EB', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  {saving ? 'Création...' : 'Créer la séance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
