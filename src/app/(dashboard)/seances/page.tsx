'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/layout/Topbar'
import { formatDate, formatTime } from '@/lib/utils'
import { Plus, X } from 'lucide-react'
import FeedbackModal from '@/components/whatsapp/FeedbackWidget'
import { scoreColor, scoreBadge } from '@/lib/whatsapp'

// Fallback if API fails
const TYPES_FALLBACK = ['Rééducation fonctionnelle', 'Massage thérapeutique', 'Électrothérapie', 'Balnéothérapie']

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    realisee: { label: 'Réalisée', bg: '#DCFCE7', color: '#16A34A' },
    annulee:  { label: 'Annulée',  bg: '#FEE2E2', color: '#DC2626' },
    no_show:  { label: 'Absent',   bg: '#FEF3C7', color: '#D97706' },
  }
  const s = map[statut] || { label: statut, bg: '#F1F5F9', color: '#64748B' }
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>
      {s.label}
    </span>
  )
}

function FeedbackBadge({ seance, onClick }: { seance: any; onClick: () => void }) {
  if (seance.statut !== 'realisee') return null

  if (seance.scorePatient === null || seance.scorePatient === undefined) {
    return (
      <button
        onClick={e => { e.stopPropagation(); onClick() }}
        style={{
          background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D',
          padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
          cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4,
        }}
      >
        ⚡ Feedback en attente
      </button>
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

export default function SeancesPage() {
  const [seances, setSeances]     = useState<any[]>([])
  const [patients, setPatients]   = useState<any[]>([])
  const [praticiens, setPraticiens] = useState<any[]>([])
  const [seanceTypes, setSeanceTypes] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedSeance, setSelectedSeance] = useState<any>(null)
  const [feedbackTarget, setFeedbackTarget] = useState<{ seance: any; patient: any } | null>(null)
  const [progScores, setProgScores] = useState({ douleur: 5, mobilite: 5, force: 5, notes: '' })
  const [savingScores, setSavingScores] = useState(false)
  const [scoresSaved, setScoresSaved] = useState(false)
  const [filterPatient, setFilterPatient]   = useState('')
  const [filterPraticien, setFilterPraticien] = useState('')
  const [filterStatut, setFilterStatut]     = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    patientId: '', praticienId: '', typeSeance: '',
    date: '', heure: '09:00', duree: '45', notes: '', statut: 'realisee',
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

  useEffect(() => { fetchData() }, [filterPatient, filterPraticien, filterStatut])
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
    s => s.statut === 'realisee' && (s.scorePatient === null || s.scorePatient === undefined)
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
      setForm({ patientId: '', praticienId: '', typeSeance: firstType?.nom || '', date: '', heure: '09:00', duree: String(firstType?.dureeDefaut || 45), notes: '', statut: 'realisee' })
      fetchData()
    } catch {}
    setSaving(false)
  }

  function openFeedback(s: any) {
    setFeedbackTarget({ seance: s, patient: s.patient })
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
      setScoresSaved(false)
    }
  }, [selectedSeance])

  async function saveProgScores() {
    if (!selectedSeance) return
    setSavingScores(true)
    try {
      await fetch(`/api/seances/${selectedSeance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          douleurScore:     progScores.douleur,
          mobiliteScore:    progScores.mobilite,
          forceScore:       progScores.force,
          notesProgression: progScores.notes || null,
        }),
      })
      setScoresSaved(true)
      fetchData()
    } catch {}
    setSavingScores(false)
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
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
              <option value="realisee">Réalisée</option>
              <option value="annulee">Annulée</option>
              <option value="no_show">Absent</option>
            </select>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>
            <Plus size={16} /> Nouvelle séance
          </button>
        </div>

        {/* Table */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
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
                    <FeedbackBadge seance={s} onClick={() => openFeedback(s)} />
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#2563EB' }}>Détail →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détail séance */}
      {selectedSeance && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
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
              {/* Feedback section in detail modal */}
              {selectedSeance.statut === 'realisee' && (
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
                    <button onClick={() => { setSelectedSeance(null); openFeedback(selectedSeance) }}
                      style={{ background: '#F59E0B', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      ⚡ Enregistrer le feedback
                    </button>
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

              {/* Progression scores */}
              {selectedSeance.statut === 'realisee' && (
                <div style={{ marginTop: 8, padding: 14, background: '#F0FDF4', borderRadius: 10, borderLeft: '3px solid #16A34A' }}>
                  <div style={{ fontSize: 12, color: '#166534', marginBottom: 12, fontWeight: 700 }}>📈 SCORES DE PROGRESSION</div>
                  {(['douleur', 'mobilite', 'force'] as const).map(key => {
                    const labels: Record<string, string> = { douleur: '🔴 Douleur', mobilite: '🔵 Mobilité', force: '🟢 Force' }
                    const colors: Record<string, string> = { douleur: '#DC2626', mobilite: '#2563EB', force: '#16A34A' }
                    return (
                      <div key={key} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{labels[key]}</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: colors[key] }}>{progScores[key]}<span style={{ fontSize: 10, color: '#94A3B8' }}>/10</span></span>
                        </div>
                        <input type="range" min={1} max={10} value={progScores[key]}
                          onChange={e => setProgScores(s => ({ ...s, [key]: Number(e.target.value) }))}
                          style={{ width: '100%', accentColor: colors[key] }}
                        />
                      </div>
                    )
                  })}
                  <textarea
                    value={progScores.notes}
                    onChange={e => setProgScores(s => ({ ...s, notes: e.target.value }))}
                    placeholder="Notes de progression..."
                    rows={2}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 12, resize: 'vertical', marginBottom: 10, boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={saveProgScores} disabled={savingScores}
                      style={{ padding: '8px 16px', background: savingScores ? '#86EFAC' : '#16A34A', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                      {savingScores ? 'Enregistrement...' : 'Enregistrer scores'}
                    </button>
                    {scoresSaved && <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>✅ Enregistré</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal nouvelle séance */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
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
                  <select value={form.statut} onChange={e => setForm(f => ({...f, statut: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}>
                    <option value="realisee">Réalisée</option>
                    <option value="annulee">Annulée</option>
                    <option value="no_show">Absent</option>
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

      {/* FeedbackModal */}
      {feedbackTarget && (
        <FeedbackModal
          seance={feedbackTarget.seance}
          patient={feedbackTarget.patient}
          praticienNom={
            feedbackTarget.seance.praticien
              ? `${feedbackTarget.seance.praticien.prenom} ${feedbackTarget.seance.praticien.nom}`
              : undefined
          }
          onClose={() => setFeedbackTarget(null)}
          onSaved={() => { setFeedbackTarget(null); fetchData() }}
        />
      )}
    </div>
  )
}
