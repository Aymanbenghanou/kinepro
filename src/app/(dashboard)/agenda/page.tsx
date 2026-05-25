'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, pointerWithin,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
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
const BANDS = [0, 15, 30, 45]                 // snapping 15 min pour le drop
const ROW_H = 76                              // hauteur d'une case d'une heure (px)
const FROZEN = ['annule', 'annulee', 'realisee', 'termine', 'honore', 'absent', 'no_show']
const PAD_X = 6                               // marge intérieure horizontale d'une colonne
const COL_GAP = 6                             // espace entre RDV concurrents d'une même heure
const CARD_M = 5                              // marge verticale de la carte dans sa case

function isFrozen(rdv: any) {
  return !!rdv?.statut && FROZEN.includes(String(rdv.statut).toLowerCase())
}
// id de band droppable : "YYYY-M-D__hour__minute"
function bandId(date: Date, hour: number, minute: number) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}__${hour}__${minute}`
}
function parseBandId(id: string): Date {
  const [ymd, h, m] = id.split('__')
  const [y, mo, d] = ymd.split('-').map(Number)
  return new Date(y, mo, d, Number(h), Number(m), 0, 0)
}

// ── Carte RDV (draggable) — remplit sa case, texte tronqué. Tap = rappel/édition ──
function RdvBlock({ rdv, color, draggable, flash, onTap, posStyle }: {
  rdv: any; color: string; draggable: boolean; flash: boolean; onTap: () => void; posStyle: React.CSSProperties
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: rdv.id, disabled: !draggable, data: { rdv },
  })
  return (
    <div ref={setNodeRef} {...(draggable ? listeners : {})} {...attributes}
      onClick={e => { e.stopPropagation(); if (!isDragging) onTap() }}
      style={{
        ...posStyle,
        background: isDragging ? 'transparent' : (rdv.source === 'online' ? '#0D9488' : color),
        color: isDragging ? '#94A3B8' : 'white',
        borderRadius: 6, padding: '4px 7px', fontSize: 11,
        borderLeft: !isDragging && rdv.source === 'online' ? '3px solid #14B8A6' : undefined,
        border: isDragging ? '2px dashed #CBD5E1' : undefined,
        opacity: isDragging ? 0.6 : 1,
        cursor: draggable ? 'grab' : 'pointer', touchAction: 'none',
        overflow: 'hidden', boxSizing: 'border-box', lineHeight: 1.3,
        animation: flash ? 'rdvGreenFlash 0.7s ease-out' : undefined,
        boxShadow: flash ? '0 0 0 2px #22C55E' : undefined,
      }}>
      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {rdv.source === 'online' && <span style={{ fontSize: 9 }}>🌐</span>}
        {rdv.patient?.prenom} {rdv.patient?.nom}
      </div>
      <div style={{ opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rdv.typeSeance} · {rdv.duree}min</div>
    </div>
  )
}

// ── Cible de drop (créneau 15 min) — invisible, cliquable pour créer ──
function DropBand({ id, invalid, onSelect }: { id: string; invalid: boolean; onSelect: () => void }) {
  const { setNodeRef, isOver, active } = useDroppable({ id })
  const dragging = !!active
  let bg = 'transparent'
  if (dragging && isOver) bg = invalid ? 'rgba(239,68,68,0.18)' : 'rgba(37,99,235,0.20)'
  const [, h, m] = id.split('__')
  const timeLabel = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  return (
    <div ref={setNodeRef} onClick={onSelect}
      style={{ flex: 1, minHeight: 0, background: bg, transition: 'background 0.08s', position: 'relative', cursor: 'pointer' }}>
      {dragging && isOver && (
        <span style={{
          position: 'absolute', top: '50%', right: 4, transform: 'translateY(-50%)',
          fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, pointerEvents: 'none',
          background: invalid ? '#EF4444' : '#2563EB', color: 'white', zIndex: 5,
        }}>
          {invalid ? '✕' : timeLabel}
        </span>
      )}
    </div>
  )
}

export default function AgendaPage() {
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

  // ── Drag & drop ──
  const [now, setNow] = useState<number>(() => Date.now())
  const [activeRdv, setActiveRdv] = useState<any>(null)        // RDV en cours de drag
  const [pendingMove, setPendingMove] = useState<any>(null)    // { rdv, newDate } à confirmer
  const [editRdv, setEditRdv] = useState<any>(null)            // tap-to-edit (mobile/tactile)
  const [flashId, setFlashId] = useState<string | null>(null)  // flash vert après succès
  const [isTouch, setIsTouch] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

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
    // Tactile « pur » seulement (aucune souris/trackpad) → tap-to-edit ; sinon drag.
    setIsTouch(!window.matchMedia('(any-pointer: fine)').matches)
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

  function openModal(date: Date, hour: number, minute = 0) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
    setForm(f => ({ ...f, date: dateStr, heure: `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}` }))
    setShowModal(true)
  }

  // Validité d'un déplacement : pas dans le passé, pas de conflit (même praticien).
  const checkMove = useCallback((rdv: any, newDate: Date): { ok: boolean; reason?: string } => {
    if (newDate.getTime() < now - 60_000) return { ok: false, reason: 'Créneau passé' }
    const duree = rdv.duree ?? 45
    const start = newDate.getTime()
    const end = start + duree * 60_000
    const conflict = rdvList.some(o => {
      if (o.id === rdv.id || o.praticienId !== rdv.praticienId || isFrozen(o)) return false
      const oStart = new Date(o.date).getTime()
      return start < oStart + (o.duree ?? 45) * 60_000 && end > oStart
    })
    if (conflict) return { ok: false, reason: 'Ce créneau est déjà occupé' }
    return { ok: true }
  }, [rdvList, now])

  function handleDragStart(e: DragStartEvent) {
    setNow(Date.now())
    setActiveRdv(e.active.data.current?.rdv ?? null)
  }

  function handleDragEnd(e: DragEndEvent) {
    const rdv = activeRdv
    setActiveRdv(null)
    if (!rdv || !e.over) return
    const newDate = parseBandId(String(e.over.id))
    if (new Date(rdv.date).getTime() === newDate.getTime()) return
    const v = checkMove(rdv, newDate)
    if (!v.ok) { setToast({ message: v.reason || 'Déplacement impossible', type: 'error' }); return }
    setPendingMove({ rdv, newDate })
  }

  async function confirmMove() {
    const move = pendingMove
    setPendingMove(null)
    if (!move) return
    const { rdv, newDate } = move
    const prev = rdvList
    setRdvList(list => list.map(r => r.id === rdv.id ? { ...r, date: newDate.toISOString() } : r))
    try {
      const res = await fetch(`/api/rendez-vous/${rdv.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate.toISOString() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      setRdvList(list => list.map(r => r.id === rdv.id ? { ...r, ...data } : r))
      setFlashId(rdv.id)
      setTimeout(() => setFlashId(null), 800)
      setToast({ message: 'RDV déplacé avec succès ✓', type: 'success' })
    } catch (err) {
      setRdvList(prev)
      setToast({ message: err instanceof Error ? err.message : 'Erreur serveur', type: 'error' })
    }
  }

  function onTapRdv(rdv: any) {
    if (isTouch) openEditTime(rdv); else sendRappel(rdv)
  }

  function openEditTime(rdv: any) {
    const d = new Date(rdv.date)
    setEditRdv({
      ...rdv,
      _date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
      _heure: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
    })
  }

  async function saveEditTime() {
    if (!editRdv) return
    const newDate = new Date(`${editRdv._date}T${editRdv._heure}:00`)
    const v = checkMove(editRdv, newDate)
    if (!v.ok) { setToast({ message: v.reason || 'Impossible', type: 'error' }); return }
    const id = editRdv.id
    setEditRdv(null)
    const prev = rdvList
    setRdvList(list => list.map(r => r.id === id ? { ...r, date: newDate.toISOString() } : r))
    try {
      const res = await fetch(`/api/rendez-vous/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate.toISOString() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      setRdvList(list => list.map(r => r.id === id ? { ...r, ...data } : r))
      setToast({ message: 'RDV déplacé avec succès ✓', type: 'success' })
    } catch (err) {
      setRdvList(prev)
      setToast({ message: err instanceof Error ? err.message : 'Erreur serveur', type: 'error' })
    }
  }

  async function sendRappel(rdv: any) {
    if (!rdv?.patient?.telephone) { setToast({ message: 'Aucun numéro pour ce patient', type: 'error' }); return }
    const date = new Date(rdv.date)
    const heure = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
    const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    const msg = msgRappelRDV({
      prenom: rdv.patient.prenom, date: dateStr, heure,
      praticien: rdv.praticien ? `${rdv.praticien.prenom} ${rdv.praticien.nom}` : '',
      typeSeance: rdv.typeSeance,
    })
    try {
      await fetch('/api/whatsapp/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rappel_rdv', patientId: rdv.patient.id,
          patientNom: `${rdv.patient.prenom} ${rdv.patient.nom}`,
          telephone: rdv.patient.telephone, message: msg,
        }),
      })
    } catch {}
    window.open(buildWhatsAppUrl(rdv.patient.telephone, msg), '_blank')
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
          <span style={{ fontSize: 12, color: '#94A3B8', paddingLeft: 8, borderLeft: '1px solid #E2E8F0' }}>
            {isTouch ? '👆 Touchez un RDV pour changer l\'heure' : '✋ Glissez un RDV pour le déplacer'}
          </span>
        </div>

        <style>{`@keyframes rdvGreenFlash { 0%{background:#22C55E} 100%{} }`}</style>

        {/* Calendrier + DnD */}
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
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
            <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid #F1F5F9', height: ROW_H }}>
              <div style={{ padding: '8px 8px 0', fontSize: 12, color: '#94A3B8', textAlign: 'right', paddingRight: 8 }}>
                {String(hour).padStart(2,'0')}:00
              </div>
              {weekDates.map((date, di) => {
                const rdvs = getRdvForSlot(date, hour)   // RDV démarrant dans cette heure
                const cols = Math.max(1, rdvs.length)
                const colW = 100 / cols
                return (
                  <div key={di} style={{ borderLeft: '1px solid #F1F5F9', height: ROW_H, position: 'relative', overflow: 'hidden' }}>
                    {/* Cibles de drop (15 min) — invisibles, cliquables pour créer */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
                      {BANDS.map(minute => {
                        const id = bandId(date, hour, minute)
                        const slot = new Date(date); slot.setHours(hour, minute, 0, 0)
                        const invalid = activeRdv ? !checkMove(activeRdv, slot).ok : false
                        return <DropBand key={minute} id={id} invalid={invalid} onSelect={() => openModal(date, hour, minute)} />
                      })}
                    </div>
                    {/* Cartes RDV : remplissent la case ; concurrents côte à côte.
                        Calque inséré de PAD_X + largeurs en calc() → aucun débordement. */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: PAD_X, right: PAD_X, pointerEvents: 'none' }}>
                      {rdvs.map((rdv, idx) => {
                        const posStyle: React.CSSProperties = {
                          position: 'absolute',
                          top: CARD_M, height: ROW_H - CARD_M * 2,
                          left: cols === 1 ? 0 : `${idx * colW}%`,
                          width: cols === 1 ? '100%' : `calc(${colW}% - ${COL_GAP}px)`,
                          maxWidth: '100%',
                          display: 'flex', flexDirection: 'column', justifyContent: 'center',
                          pointerEvents: 'auto', zIndex: 2,
                        }
                        return (
                          <RdvBlock
                            key={rdv.id} rdv={rdv}
                            color={couleurMap[rdv.typeSeance] || '#2563EB'}
                            draggable={!isTouch && !isFrozen(rdv)}
                            flash={flashId === rdv.id}
                            onTap={() => onTapRdv(rdv)}
                            posStyle={posStyle}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Ghost suivant le curseur pendant le drag */}
        <DragOverlay modifiers={[restrictToWindowEdges]} dropAnimation={null}>
          {activeRdv ? (
            <div style={{
              background: activeRdv.source === 'online' ? '#0D9488' : (couleurMap[activeRdv.typeSeance] || '#2563EB'),
              color: 'white', borderRadius: 6, padding: '4px 7px', fontSize: 11, width: 150,
              boxShadow: '0 8px 20px rgba(0,0,0,0.25)', opacity: 0.95, cursor: 'grabbing',
            }}>
              <div style={{ fontWeight: 600 }}>{activeRdv.patient?.prenom} {activeRdv.patient?.nom}</div>
              <div style={{ opacity: 0.85 }}>{activeRdv.typeSeance} · {activeRdv.duree}min</div>
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
              ].map(([field, label, opts, fmt]: any) => (
                <div key={field}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
                  <select value={(form as any)[field]} onChange={e => setForm(f => ({...f, [field]: e.target.value}))} required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}>
                    <option value="">Sélectionner...</option>
                    {opts.map((o: any) => <option key={o.id} value={o.id}>{fmt(o)}</option>)}
                  </select>
                </div>
              ))}
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

      {/* ── Confirmation de déplacement (drag & drop) ── */}
      {pendingMove && (
        <div className="modal-overlay" style={{ zIndex: 220 }} onClick={() => setPendingMove(null)}>
          <div className="modal-sheet" style={{ padding: 26, width: 400 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>Déplacer le RDV ?</h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px' }}>
              Déplacer le RDV de <strong style={{ color: '#0F172A' }}>{pendingMove.rdv.patient?.prenom} {pendingMove.rdv.patient?.nom}</strong> au{' '}
              <strong style={{ color: '#0F172A' }}>
                {new Date(pendingMove.newDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {String(new Date(pendingMove.newDate).getHours()).padStart(2,'0')}:{String(new Date(pendingMove.newDate).getMinutes()).padStart(2,'0')}
              </strong> ?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPendingMove(null)}
                style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#64748B' }}>
                Annuler
              </button>
              <button onClick={confirmMove}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#2563EB', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Édition de l'heure (tap tactile) ── */}
      {editRdv && (
        <div className="modal-overlay" style={{ zIndex: 220 }} onClick={() => setEditRdv(null)}>
          <div className="modal-sheet" style={{ padding: 26, width: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>Changer l'heure</h2>
              <button onClick={() => setEditRdv(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
              {editRdv.patient?.prenom} {editRdv.patient?.nom} · {editRdv.typeSeance}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Date</label>
                <input type="date" value={editRdv._date} onChange={e => setEditRdv((r: any) => ({ ...r, _date: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Heure</label>
                <input type="time" step={900} value={editRdv._heure} onChange={e => setEditRdv((r: any) => ({ ...r, _heure: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
              </div>
            </div>
            <button onClick={saveEditTime}
              style={{ width: '100%', padding: '11px', border: 'none', borderRadius: 8, background: '#2563EB', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
