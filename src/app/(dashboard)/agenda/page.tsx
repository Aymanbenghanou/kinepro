'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import Topbar from '@/components/layout/Topbar'
import Toast from '@/components/ui/Toast'
import { formatTime } from '@/lib/utils'
import { Plus, ChevronLeft, ChevronRight, X, Check } from 'lucide-react'
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton'
import {
  msgConfirmationRDV, msgRappelRDV,
  buildWhatsAppUrl, formatPhoneForWhatsApp,
} from '@/lib/whatsapp'

// Fallback colours until API types load
const TYPES_SEANCE_FALLBACK = ['Rééducation fonctionnelle', 'Massage thérapeutique', 'Électrothérapie', 'Balnéothérapie']
const SALLES = ['Salle 1', 'Salle 2', 'Salle 3']
// Colour map is now built dynamically from API types (couleurMap in component state)

function getWeekDates(startDate: Date) {
  const dates = []
  const monday = new Date(startDate)
  const day = monday.getDay()
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + diff)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const HEURES = Array.from({ length: 12 }, (_, i) => i + 8)

function RappelBtn({ rdv }: { rdv: any }) {
  const [sent, setSent] = useState(false)
  if (!rdv.patient?.telephone) return null

  async function handleRappel(e: React.MouseEvent) {
    e.stopPropagation()
    const date = new Date(rdv.date)
    const heure = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
    const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    const msg = msgRappelRDV({
      prenom: rdv.patient.prenom,
      date: dateStr,
      heure,
      praticien: rdv.praticien ? `${rdv.praticien.prenom} ${rdv.praticien.nom}` : '',
      typeSeance: rdv.typeSeance,
    })
    try {
      await fetch('/api/whatsapp/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rappel_rdv',
          patientId: rdv.patient.id,
          patientNom: `${rdv.patient.prenom} ${rdv.patient.nom}`,
          telephone: rdv.patient.telephone,
          message: msg,
        }),
      })
    } catch {}
    setSent(true)
    setTimeout(() => setSent(false), 3000)
    window.open(buildWhatsAppUrl(rdv.patient.telephone, msg), '_blank')
  }

  return (
    <button onClick={handleRappel}
      style={{
        marginTop: 3, width: '100%',
        background: sent ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.22)',
        color: 'white', border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: 4, padding: '2px 4px', fontSize: 10, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
      }}>
      {sent ? '✓ Ouvert' : '📱 Rappel'}
    </button>
  )
}

// Contenu interne d'une carte RDV — réutilisé dans la carte de la grille
// ET dans le DragOverlay (le visuel coloré est porté par le conteneur parent).
function RdvCardBody({ rdv }: { rdv: any }) {
  // OWNER / SECRETAIRE / SUPER_ADMIN voient tous les RDV du cabinet → on leur
  // montre quel praticien assure chaque RDV. Un PRATICIEN ne voit que les siens,
  // donc cette info est inutile pour lui.
  const { data: session } = useSession()
  const role = session?.user?.role
  const canSeePraticien = role === 'CABINET_OWNER' || role === 'SECRETAIRE' || role === 'SUPER_ADMIN'

  const prenom       = rdv.praticien?.prenom?.trim() ?? ''
  const initialeNom  = rdv.praticien?.nom?.trim()?.[0]?.toUpperCase() ?? ''
  const praticienLabel = prenom && initialeNom ? `${prenom} ${initialeNom}.` : (prenom || '')
  const showPraticien = canSeePraticien && praticienLabel

  return (
    <>
      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
        {rdv.source === 'online' && <span style={{ fontSize: 9 }}>🌐</span>}
        {rdv.patient?.prenom} {rdv.patient?.nom}
      </div>
      <div style={{ opacity: 0.85 }}>
        {rdv.typeSeance} · {showPraticien && <>{praticienLabel} · </>}{rdv.duree}min
      </div>
      {rdv.patientNotes && (
        <div style={{ opacity: 0.75, fontSize: 10, fontStyle: 'italic', marginTop: 1 }}>
          {rdv.patientNotes.slice(0, 30)}{rdv.patientNotes.length > 30 ? '…' : ''}
        </div>
      )}
      <RappelBtn rdv={rdv} />
    </>
  )
}

// Cellule jour+heure = zone droppable. Conserve le onClick (ouverture du modal
// de création sur clic d'une cellule vide). Surligne en #EFF6FF au survol d'un drag.
function DroppableCell({ date, hour, onClick, children }: {
  date: Date; hour: number; onClick: () => void; children?: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell|${date.toISOString()}|${hour}`,
    data: { date, hour },
  })
  return (
    <div ref={setNodeRef} onClick={onClick}
      style={{
        borderLeft: '1px solid #F1F5F9', padding: 4, cursor: 'pointer', minHeight: 64,
        background: isOver ? '#EFF6FF' : undefined, transition: 'background 0.08s',
      }}>
      {children}
    </div>
  )
}

// Carte RDV = élément draggable. La source en grille se contente de s'estomper
// (opacity 0.4) — on n'applique PAS le transform de useDraggable ici, c'est le
// DragOverlay qui suit le curseur.
function DraggableRdv({ rdv, color, children }: {
  rdv: any; color: string; children?: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: rdv.id, data: { rdv },
  })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      onClick={e => e.stopPropagation()}
      style={{
        background: color, color: 'white', borderRadius: 6, padding: '4px 6px',
        fontSize: 11, marginBottom: 2,
        borderLeft: rdv.source === 'online' ? '3px solid #14B8A6' : undefined,
        cursor: 'grab', opacity: isDragging ? 0.4 : 1, touchAction: 'none',
      }}>
      {children}
    </div>
  )
}

export default function AgendaPage() {
  // Session pour scope par praticien : un PRATICIEN ne voit/crée que ses propres RDV.
  const { data: session } = useSession()
  const sessionRole         = session?.user?.role
  const sessionPraticienId  = session?.user?.praticienId
  const isPraticienScoped   = sessionRole === 'PRATICIEN' && !!sessionPraticienId

  const [currentDate, setCurrentDate] = useState(new Date())
  const [rdvList, setRdvList]         = useState<any[]>([])
  const [patients, setPatients]       = useState<any[]>([])
  const [praticiens, setPraticiens]   = useState<any[]>([])
  const [seanceTypes, setSeanceTypes] = useState<any[]>([])
  const [showModal, setShowModal]     = useState(false)
  const [loading, setLoading]         = useState(false)
  const [confirmationRdv, setConfirmationRdv] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [form, setForm] = useState({
    patientId: '', praticienId: '', typeSeance: '',
    date: '', heure: '09:00', duree: '45', salle: 'Salle 1', notes: ''
  })

  // Pour un PRATICIEN, on pré-remplit form.praticienId avec son propre id.
  useEffect(() => {
    if (isPraticienScoped && sessionPraticienId) {
      setForm(f => f.praticienId === sessionPraticienId ? f : { ...f, praticienId: sessionPraticienId })
    }
  }, [isPraticienScoped, sessionPraticienId])

  // Drag & drop : carte en cours de déplacement (pour le DragOverlay)
  const [activeRdv, setActiveRdv] = useState<any>(null)
  // distance:8 → un clic reste un clic (RappelBtn, ouverture du modal) ;
  // le drag ne démarre qu'après 8px de mouvement.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const weekDates = getWeekDates(currentDate)

  // Build a colour map from loaded types
  const couleurMap: Record<string, string> = {}
  seanceTypes.forEach((t: any) => { couleurMap[t.nom] = t.couleur || '#2563EB' })

  const fetchRdv = useCallback(async () => {
    try {
      const res = await fetch('/api/rendez-vous')
      const data = await res.json()
      setRdvList(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchRdv()
    fetch('/api/patients').then(r => r.json()).then(d => setPatients(Array.isArray(d) ? d : []))
    fetch('/api/praticiens').then(r => r.json()).then(d => setPraticiens(Array.isArray(d) ? d : []))
    fetch('/api/seance-types').then(r => r.json()).then(d => {
      const types = Array.isArray(d) ? d : TYPES_SEANCE_FALLBACK.map(n => ({ nom: n, dureeDefaut: 45, couleur: '#2563EB' }))
      setSeanceTypes(types)
      if (types.length > 0) setForm(f => ({ ...f, typeSeance: types[0].nom, duree: String(types[0].dureeDefaut) }))
    })
  }, [fetchRdv])

  function handleTypeChange(nom: string) {
    const found = seanceTypes.find((t: any) => t.nom === nom)
    setForm(f => ({
      ...f,
      typeSeance: nom,
      duree: found ? String(found.dureeDefaut) : f.duree,
    }))
  }

  function getRdvForSlot(date: Date, hour: number) {
    return rdvList.filter(rdv => {
      const d = new Date(rdv.date)
      return d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate() &&
        d.getHours() === hour
    })
  }

  function openModal(date: Date, hour: number) {
    const d = new Date(date)
    d.setHours(hour, 0, 0, 0)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    setForm(f => ({ ...f, date: dateStr, heure: `${String(hour).padStart(2,'0')}:00` }))
    setShowModal(true)
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveRdv(e.active.data.current?.rdv ?? null)
  }

  // Déplacement d'un RDV : conserve les minutes, refuse les créneaux passés,
  // mise à jour optimiste + PUT, rollback si échec.
  async function handleDragEnd(e: DragEndEvent) {
    setActiveRdv(null)
    const rdv = e.active?.data?.current?.rdv
    const target = e.over?.data?.current as { date: Date; hour: number } | undefined
    if (!rdv || !target) return

    const oldDate = new Date(rdv.date)
    const newDate = new Date(target.date)
    newDate.setHours(target.hour, oldDate.getMinutes(), 0, 0) // garde les minutes
    if (newDate.getTime() === oldDate.getTime()) return        // même créneau → no-op
    if (newDate < new Date()) {
      setToast({ message: 'Créneau passé impossible', type: 'error' })
      return
    }

    const prev = rdvList
    setRdvList(list => list.map(r => r.id === rdv.id ? { ...r, date: newDate.toISOString() } : r))
    try {
      const res = await fetch(`/api/rendez-vous/${rdv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate.toISOString() }),
      })
      if (!res.ok) throw new Error()
      setToast({ message: 'RDV déplacé', type: 'success' })
    } catch {
      setRdvList(prev)
      setToast({ message: 'Échec du déplacement', type: 'error' })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patientId || !form.praticienId) return
    setLoading(true)
    try {
      const dateTime = `${form.date}T${form.heure}:00`
      const res = await fetch('/api/rendez-vous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateTime, duree: parseInt(form.duree),
          typeSeance: form.typeSeance, salle: form.salle,
          notes: form.notes, patientId: form.patientId,
          praticienId: form.praticienId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      const patient = patients.find(p => p.id === form.patientId)
      const praticien = praticiens.find(p => p.id === form.praticienId)
      setShowModal(false)
      fetchRdv()
      // Show WhatsApp confirmation panel
      setConfirmationRdv({ rdv: data, patient, praticien })
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur serveur', type: 'error' })
    }
    setLoading(false)
  }

  const today = new Date()

  return (
    <div>
      <Topbar title="Agenda" subtitle="Calendrier hebdomadaire" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ padding: 24 }}>

        {/* Header */}
        <div className="page-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate()-7); setCurrentDate(d) }}
              style={{ padding: 8, border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer' }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#0F172A' }}>
              {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} – {weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate()+7); setCurrentDate(d) }}
              style={{ padding: 8, border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer' }}>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setCurrentDate(new Date())}
              style={{ padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, color: '#64748B' }}>
              Aujourd'hui
            </button>
          </div>
          <button onClick={() => { setForm(f => ({...f, date: '', heure: '09:00'})); setShowModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>
            <Plus size={16} /> Nouveau RDV
          </button>
        </div>

        {/* Légende */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {seanceTypes.map((t: any) => (
            <div key={t.id || t.nom} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.couleur || '#2563EB' }} />
              <span style={{ fontSize: 12, color: '#64748B' }}>{t.nom}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8, borderLeft: '1px solid #E2E8F0' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0D9488' }} />
            <span style={{ fontSize: 12, color: '#64748B' }}>🌐 En ligne</span>
          </div>
        </div>

        {/* Calendrier */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveRdv(null)}
        >
          <div className="agenda-week-outer">
            <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ padding: '12px 8px', background: '#F8FAFC' }} />
              {weekDates.map((date, i) => {
                const isToday = date.toDateString() === today.toDateString()
                return (
                  <div key={i} style={{ padding: '12px 8px', textAlign: 'center', background: '#F8FAFC', borderLeft: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{JOURS[i]}</div>
                    <div style={{
                      fontSize: 16, fontWeight: 700, color: isToday ? 'white' : '#0F172A',
                      background: isToday ? '#2563EB' : 'transparent',
                      borderRadius: '50%', width: 32, height: 32,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 0'
                    }}>{date.getDate()}</div>
                  </div>
                )
              })}
            </div>
            {HEURES.map(hour => (
              <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid #F1F5F9', minHeight: 64 }}>
                <div style={{ padding: '8px 8px 0', fontSize: 12, color: '#94A3B8', textAlign: 'right', paddingRight: 8 }}>
                  {String(hour).padStart(2,'0')}:00
                </div>
                {weekDates.map((date, di) => {
                  const rdvs = getRdvForSlot(date, hour)
                  return (
                    <DroppableCell key={di} date={date} hour={hour} onClick={() => openModal(date, hour)}>
                      {rdvs.map(rdv => {
                        const color = rdv.source === 'online' ? '#0D9488' : (couleurMap[rdv.typeSeance] || '#2563EB')
                        return (
                          <DraggableRdv key={rdv.id} rdv={rdv} color={color}>
                            <RdvCardBody rdv={rdv} />
                          </DraggableRdv>
                        )
                      })}
                    </DroppableCell>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Ghost qui suit le curseur pendant le drag */}
          <DragOverlay>
            {activeRdv ? (
              <div style={{
                background: activeRdv.source === 'online' ? '#0D9488' : (couleurMap[activeRdv.typeSeance] || '#2563EB'),
                color: 'white', borderRadius: 6, padding: '4px 6px', fontSize: 11, width: 150,
                borderLeft: activeRdv.source === 'online' ? '3px solid #14B8A6' : undefined,
                cursor: 'grabbing', boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
              }}>
                <RdvCardBody rdv={activeRdv} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* FAB: mobile only */}
      <button className="fab-btn" onClick={() => { setForm(f => ({...f, date: '', heure: '09:00'})); setShowModal(true) }} aria-label="Nouveau RDV">
        +
      </button>

      {/* ── Modal Nouveau RDV ── */}
      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-sheet" style={{ padding: 28, width: 480, maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>Nouveau rendez-vous</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['patientId', 'Patient *', patients, (p: any) => `${p.prenom} ${p.nom}`],
                ['praticienId', 'Praticien *', praticiens, (p: any) => `Dr. ${p.prenom} ${p.nom}`],
              ].map(([field, label, opts, fmt]: any) => {
                // Pour un PRATICIEN, on verrouille le champ "Praticien" sur lui-même.
                const isLockedPraticienField = field === 'praticienId' && isPraticienScoped
                return (
                  <div key={field}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
                    <select
                      value={(form as any)[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      required
                      disabled={isLockedPraticienField}
                      style={{
                        width: '100%', padding: '10px 12px',
                        border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14,
                        background: isLockedPraticienField ? '#F1F5F9' : 'white',
                        color: isLockedPraticienField ? '#475569' : undefined,
                        cursor: isLockedPraticienField ? 'not-allowed' : undefined,
                      }}
                    >
                      <option value="">Sélectionner...</option>
                      {opts.map((o: any) => <option key={o.id} value={o.id}>{fmt(o)}</option>)}
                    </select>
                    {isLockedPraticienField && (
                      <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                        Vous ne pouvez créer des RDV que pour vous-même.
                      </p>
                    )}
                  </div>
                )
              })}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Type de séance</label>
                <select value={form.typeSeance} onChange={e => handleTypeChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}>
                  {seanceTypes.map((t: any) => (
                    <option key={t.id || t.nom} value={t.nom}>{t.nom} ({t.dureeDefaut}min)</option>
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
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Heure *</label>
                  <input type="time" value={form.heure} onChange={e => setForm(f => ({...f, heure: e.target.value}))} required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Durée (min)</label>
                  <select value={form.duree} onChange={e => setForm(f => ({...f, duree: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}>
                    <option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Salle</label>
                  <select value={form.salle} onChange={e => setForm(f => ({...f, salle: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}>
                    {SALLES.map(s => <option key={s} value={s}>{s}</option>)}
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
                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#2563EB', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  {loading ? 'Création...' : 'Créer le RDV'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── WhatsApp Confirmation Panel ── */}
      {confirmationRdv && (
        <div className="modal-overlay" style={{ zIndex: 200 }}>
          <div className="modal-sheet" style={{ padding: 32, width: 440 }}>
            {/* Success icon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Check size={28} color="#16A34A" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>RDV créé avec succès !</h2>
              <p style={{ fontSize: 14, color: '#64748B', margin: 0, textAlign: 'center' }}>
                {confirmationRdv.patient?.prenom} {confirmationRdv.patient?.nom} —{' '}
                {new Date(confirmationRdv.rdv?.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {/* WhatsApp actions */}
            {confirmationRdv.patient?.telephone ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>
                  📱 Envoyer via WhatsApp :
                </p>
                <WhatsAppButton
                  phone={confirmationRdv.patient.telephone}
                  message={msgConfirmationRDV({
                    prenom: confirmationRdv.patient.prenom,
                    date: new Date(confirmationRdv.rdv?.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
                    heure: formatTime(confirmationRdv.rdv?.date),
                    typeSeance: confirmationRdv.rdv?.typeSeance,
                    praticien: `${confirmationRdv.praticien?.prenom} ${confirmationRdv.praticien?.nom}`,
                    duree: confirmationRdv.rdv?.duree || 45,
                  })}
                  type="confirmation_rdv"
                  patientId={confirmationRdv.patient.id}
                  patientNom={`${confirmationRdv.patient.prenom} ${confirmationRdv.patient.nom}`}
                  label="Envoyer confirmation WhatsApp"
                />
                <WhatsAppButton
                  phone={confirmationRdv.patient.telephone}
                  message={msgRappelRDV({
                    prenom: confirmationRdv.patient.prenom,
                    date: new Date(confirmationRdv.rdv?.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
                    heure: formatTime(confirmationRdv.rdv?.date),
                    praticien: `${confirmationRdv.praticien?.prenom} ${confirmationRdv.praticien?.nom}`,
                    typeSeance: confirmationRdv.rdv?.typeSeance,
                  })}
                  type="rappel_rdv"
                  patientId={confirmationRdv.patient.id}
                  patientNom={`${confirmationRdv.patient.prenom} ${confirmationRdv.patient.nom}`}
                  label="Envoyer rappel WhatsApp"
                />
              </div>
            ) : (
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: 12, marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>
                  ⚠️ Aucun numéro de téléphone enregistré pour ce patient.
                </p>
              </div>
            )}

            <button onClick={() => setConfirmationRdv(null)}
              style={{ width: '100%', padding: '11px', border: '1px solid #E2E8F0', borderRadius: 10, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#374151', fontSize: 14 }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
