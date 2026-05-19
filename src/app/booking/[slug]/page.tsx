'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type SeanceType = {
  id: string; nom: string; dureeDefaut: number; tarifDefaut: number; couleur: string
}
type Praticien = {
  id: string; nom: string; prenom: string; specialite: string
}
type Cabinet = {
  id: string; nom: string; ville: string; telephone: string
  bookingEnabled: boolean; bookingMessage: string | null
  workStartTime: string; workEndTime: string
  lunchStartTime: string; lunchEndTime: string
  workingDays: string
  seanceTypes: SeanceType[]; praticiens: Praticien[]
}
type Slot = { time: string; available: boolean }
type PatientForm = {
  prenom: string; nom: string; telephone: string; email: string; notes: string; consent: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS_FR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function formatDateLong(ymd: string): string {
  return new Date(ymd+'T00:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })
}
function isoWeekday(d: Date): number {
  const day = d.getDay()
  return day === 0 ? 6 : day - 1
}
function getInitials(prenom: string, nom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'24px 0' }}>
      <div style={{ width:32, height:32, border:'3px solid #E2E8F0', borderTop:'3px solid #2563EB', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:20, marginBottom:8 }}>
      {Array.from({ length: total }, (_,i) => (
        <div key={i} style={{ width: i+1===step ? 24 : 8, height:8, borderRadius:4, background: i+1<=step ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)', transition:'all 0.3s' }} />
      ))}
    </div>
  )
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function Calendar({ calendarDate, setCalendarDate, selectedDate, onSelectDate, workingDays }: {
  calendarDate: Date; setCalendarDate: (d:Date) => void
  selectedDate: string; onSelectDate: (ymd:string) => void
  workingDays: string
}) {
  const today = new Date(); today.setHours(0,0,0,0)
  const enabledIso = new Set(workingDays.split(',').map(s => parseInt(s.trim(),10)))
  const year  = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const firstDay    = new Date(year, month, 1)
  const firstOffset = isoWeekday(firstDay)
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  const cells: (number|null)[] = [
    ...Array(firstOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_,i) => i+1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayYMD = toYMD(today)

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <button onClick={() => { const d=new Date(year,month-1,1); const n=new Date(); n.setDate(1); n.setHours(0,0,0,0); if(d>=n) setCalendarDate(d) }}
          disabled={isCurrentMonth}
          style={{ background:'none', border:'none', fontSize:22, cursor: isCurrentMonth ? 'not-allowed' : 'pointer', color: isCurrentMonth ? '#CBD5E1' : '#1E3A5F', padding:'4px 10px', borderRadius:8 }}>
          ‹
        </button>
        <span style={{ fontWeight:700, color:'#0F172A', fontSize:16 }}>{MONTHS_FR[month]} {year}</span>
        <button onClick={() => setCalendarDate(new Date(year,month+1,1))}
          style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#1E3A5F', padding:'4px 10px', borderRadius:8 }}>
          ›
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:6 }}>
        {DAYS_FR.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color:'#94A3B8', padding:'4px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} />
          const cellDate = new Date(year, month, day); cellDate.setHours(0,0,0,0)
          const isPast     = cellDate < today
          const isoDay     = isoWeekday(cellDate) + 1
          const isWorkday  = enabledIso.has(isoDay)
          const disabled   = isPast || !isWorkday
          const ymd        = toYMD(cellDate)
          const isSelected = ymd === selectedDate
          const isToday    = ymd === todayYMD
          return (
            <button key={day} onClick={() => !disabled && onSelectDate(ymd)} disabled={disabled}
              style={{
                aspectRatio:'1', borderRadius:'50%', border:'none',
                background: isSelected ? '#2563EB' : isToday ? '#EFF6FF' : 'transparent',
                color: isSelected ? 'white' : disabled ? '#CBD5E1' : '#0F172A',
                fontWeight: isSelected || isToday ? 700 : 400,
                fontSize:14, cursor: disabled ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'background 0.15s',
              }}>
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, bold }: { icon: string; label: string; bold?: boolean }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <span style={{ fontSize:18, minWidth:26, textAlign:'center' }}>{icon}</span>
      <span style={{ fontSize:14, color:'#0F172A', fontWeight: bold ? 700 : 500 }}>{label}</span>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const params = useParams()
  const slug = params.slug as string

  const [cabinet, setCabinet]   = useState<Cabinet | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [step, setStep]                         = useState(1)
  const [selectedType, setSelectedType]         = useState<SeanceType | null>(null)
  const [selectedPraticien, setSelectedPraticien] = useState<Praticien | 'none'>('none')
  const [selectedDate, setSelectedDate]         = useState('')
  const [selectedTime, setSelectedTime]         = useState('')
  const [calendarDate, setCalendarDate]         = useState(new Date())
  const [slots, setSlots]                       = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading]         = useState(false)
  const [patient, setPatient]                   = useState<PatientForm>({
    prenom:'', nom:'', telephone:'', email:'', notes:'', consent: false
  })
  const [booking, setBooking]       = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmed, setConfirmed]   = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/booking/${slug}`)
      .then(async r => { if (!r.ok) throw new Error(); return r.json() })
      .then((d: Cabinet) => { setCabinet(d); setLoading(false) })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [slug])

  const fetchSlots = useCallback(async (date: string) => {
    if (!cabinet || !selectedType) return
    setSlotsLoading(true); setSlots([]); setSelectedTime('')
    try {
      const praticienId = typeof selectedPraticien === 'object' ? selectedPraticien.id : ''
      const qs = new URLSearchParams({ date, seanceTypeId: selectedType.id, ...(praticienId ? { praticienId } : {}) })
      const res = await fetch(`/api/booking/${slug}/slots?${qs}`)
      setSlots(await res.json())
    } catch { setSlots([]) }
    setSlotsLoading(false)
  }, [cabinet, selectedType, selectedPraticien, slug])

  function handleDateSelect(ymd: string) { setSelectedDate(ymd); fetchSlots(ymd) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cabinet || !selectedType || !selectedDate || !selectedTime) return
    setBooking(true); setSubmitError('')
    try {
      const praticienId = typeof selectedPraticien === 'object' ? selectedPraticien.id : null
      const res = await fetch(`/api/booking/${slug}`, {
        method:'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          seanceTypeId: selectedType.id, praticienId,
          date: selectedDate, time: selectedTime,
          patient: { prenom: patient.prenom, nom: patient.nom, telephone: patient.telephone, email: patient.email || undefined, notes: patient.notes || undefined },
        }),
      })
      if (!res.ok) { const e = await res.json(); setSubmitError(e.error || 'Erreur'); setBooking(false); return }
      setConfirmed(true); setStep(5)
    } catch { setSubmitError('Erreur de connexion. Veuillez réessayer.') }
    setBooking(false)
  }

  function reset() {
    setStep(1); setSelectedType(null); setSelectedPraticien('none')
    setSelectedDate(''); setSelectedTime(''); setSlots([])
    setCalendarDate(new Date()); setConfirmed(false); setSubmitError('')
    setPatient({ prenom:'', nom:'', telephone:'', email:'', notes:'', consent: false })
  }

  // Shared styles
  const card: React.CSSProperties = { background:'white', borderRadius:16, padding:24, boxShadow:'0 4px 24px rgba(0,0,0,0.10)' }
  const btnPrimary: React.CSSProperties = { width:'100%', padding:'14px', background:'#2563EB', color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:15, cursor:'pointer' }
  const btnGhost: React.CSSProperties = { width:'100%', padding:'12px', background:'transparent', color:'#64748B', border:'1px solid #E2E8F0', borderRadius:12, fontWeight:500, fontSize:14, cursor:'pointer' }
  const inputSt: React.CSSProperties = { width:'100%', padding:'11px 14px', border:'2px solid #E2E8F0', borderRadius:10, fontSize:15, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1E3A5F,#2563EB)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Spinner />
    </div>
  )

  if (notFound || !cabinet || !cabinet.bookingEnabled) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1E3A5F,#2563EB)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:'40px 32px', maxWidth:380, width:'100%', textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🚫</div>
        <p style={{ fontSize:20, fontWeight:700, color:'#0F172A', margin:'0 0 8px', lineHeight:1.4 }}>
          Ce cabinet n&apos;accepte pas<br />encore de réservations en ligne.
        </p>
        {cabinet && (
          <>
            <p style={{ fontSize:15, fontWeight:600, color:'#2563EB', margin:'20px 0 4px' }}>{cabinet.nom}</p>
            <p style={{ fontSize:14, color:'#64748B', margin:0 }}>📞 {cabinet.telephone}</p>
          </>
        )}
      </div>
    </div>
  )

  const header = (
    <div style={{ background:'linear-gradient(135deg,#1E3A5F,#2563EB)', padding:'28px 20px 0', textAlign:'center' }}>
      <div style={{ width:56, height:56, borderRadius:16, background:'white', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
        <span style={{ color:'#1E3A5F', fontSize:26, fontWeight:800, fontFamily:'Georgia,serif' }}>K</span>
      </div>
      <p style={{ color:'white', fontSize:18, fontWeight:700, margin:'0 0 2px' }}>{cabinet.nom}</p>
      <p style={{ color:'rgba(255,255,255,0.65)', fontSize:13, margin:0 }}>Réservation en ligne</p>
      {step < 5 && <ProgressDots step={step} total={4} />}
    </div>
  )

  // ── Step 1: Choisir le service ──────────────────────────────────────────────
  const step1 = (
    <div style={card}>
      <p style={{ fontWeight:700, fontSize:17, color:'#0F172A', margin:'0 0 4px' }}>Choisir le service</p>
      <p style={{ fontSize:13, color:'#64748B', margin:'0 0 20px' }}>Quel type de séance souhaitez-vous réserver ?</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
        {cabinet.seanceTypes.map(st => {
          const sel = selectedType?.id === st.id
          return (
            <button key={st.id} onClick={() => setSelectedType(st)}
              style={{ padding:'14px 12px', border:`2px solid ${sel ? '#2563EB' : '#E2E8F0'}`, borderRadius:12, background: sel ? '#EFF6FF' : 'white', cursor:'pointer', textAlign:'left', position:'relative', transition:'all 0.15s' }}>
              {sel && <div style={{ position:'absolute', top:8, right:8, width:20, height:20, borderRadius:'50%', background:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'white', fontWeight:700 }}>✓</div>}
              <div style={{ width:10, height:10, borderRadius:'50%', background:st.couleur, marginBottom:8 }} />
              <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:4, lineHeight:1.3 }}>{st.nom}</div>
              <div style={{ fontSize:11, color:'#64748B' }}>{st.dureeDefaut} min</div>
              <div style={{ fontSize:12, fontWeight:600, color:'#2563EB', marginTop:2 }}>{st.tarifDefaut} MAD</div>
            </button>
          )
        })}
      </div>
      <button onClick={() => setStep(2)} disabled={!selectedType}
        style={{ ...btnPrimary, opacity: selectedType ? 1 : 0.5, cursor: selectedType ? 'pointer' : 'not-allowed' }}>
        Suivant →
      </button>
    </div>
  )

  // ── Step 2: Choisir le praticien ────────────────────────────────────────────
  const step2 = (
    <div style={card}>
      <p style={{ fontWeight:700, fontSize:17, color:'#0F172A', margin:'0 0 4px' }}>Choisir le praticien</p>
      <p style={{ fontSize:13, color:'#64748B', margin:'0 0 20px' }}>Avec qui souhaitez-vous prendre RDV ?</p>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
        {/* No preference */}
        {[null].map(() => {
          const sel = selectedPraticien === 'none'
          return (
            <button key="none" onClick={() => setSelectedPraticien('none')}
              style={{ padding:'14px 16px', border:`2px solid ${sel ? '#2563EB' : '#E2E8F0'}`, borderRadius:12, background: sel ? '#EFF6FF' : 'white', cursor:'pointer', display:'flex', alignItems:'center', gap:14, textAlign:'left', transition:'all 0.15s' }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🔀</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Pas de préférence</div>
                <div style={{ fontSize:12, color:'#64748B' }}>Premier praticien disponible</div>
              </div>
              {sel && <div style={{ marginLeft:'auto', width:22, height:22, borderRadius:'50%', background:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'white', fontWeight:700, flexShrink:0 }}>✓</div>}
            </button>
          )
        })}
        {cabinet.praticiens.map(pr => {
          const sel = typeof selectedPraticien === 'object' && selectedPraticien?.id === pr.id
          return (
            <button key={pr.id} onClick={() => setSelectedPraticien(pr)}
              style={{ padding:'14px 16px', border:`2px solid ${sel ? '#2563EB' : '#E2E8F0'}`, borderRadius:12, background: sel ? '#EFF6FF' : 'white', cursor:'pointer', display:'flex', alignItems:'center', gap:14, textAlign:'left', transition:'all 0.15s' }}>
              <div style={{ width:44, height:44, borderRadius:'50%', background:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'white', flexShrink:0 }}>
                {getInitials(pr.prenom, pr.nom)}
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>{pr.prenom} {pr.nom}</div>
                <div style={{ fontSize:12, color:'#64748B' }}>{pr.specialite}</div>
              </div>
              {sel && <div style={{ marginLeft:'auto', width:22, height:22, borderRadius:'50%', background:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'white', fontWeight:700, flexShrink:0 }}>✓</div>}
            </button>
          )
        })}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <button onClick={() => setStep(3)} style={btnPrimary}>Suivant →</button>
        <button onClick={() => setStep(1)} style={btnGhost}>← Retour</button>
      </div>
    </div>
  )

  // ── Step 3: Date & heure ────────────────────────────────────────────────────
  const step3 = (
    <div style={card}>
      <p style={{ fontWeight:700, fontSize:17, color:'#0F172A', margin:'0 0 4px' }}>Choisir date et heure</p>
      <p style={{ fontSize:13, color:'#64748B', margin:'0 0 20px' }}>Sélectionnez un jour puis un créneau disponible.</p>

      <Calendar calendarDate={calendarDate} setCalendarDate={setCalendarDate}
        selectedDate={selectedDate} onSelectDate={handleDateSelect}
        workingDays={cabinet.workingDays} />

      {selectedDate && (
        <div style={{ marginTop:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>
            Créneaux disponibles
          </div>
          {slotsLoading ? <Spinner /> : slots.length === 0 ? (
            <p style={{ fontSize:14, color:'#94A3B8', textAlign:'center', padding:'12px 0' }}>Aucun créneau disponible ce jour.</p>
          ) : (
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {slots.map(s => {
                const isSel = selectedTime === s.time
                return (
                  <button key={s.time} onClick={() => s.available && setSelectedTime(s.time)} disabled={!s.available}
                    style={{ padding:'8px 14px', borderRadius:8, border:`2px solid ${isSel ? '#2563EB' : s.available ? '#2563EB' : '#E2E8F0'}`, background: isSel ? '#2563EB' : s.available ? '#EFF6FF' : '#F8FAFC', color: isSel ? 'white' : s.available ? '#2563EB' : '#CBD5E1', fontWeight:600, fontSize:14, cursor: s.available ? 'pointer' : 'not-allowed', transition:'all 0.15s' }}>
                    {s.time}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:24 }}>
        <button onClick={() => setStep(4)} disabled={!selectedDate || !selectedTime}
          style={{ ...btnPrimary, opacity: selectedDate && selectedTime ? 1 : 0.5, cursor: selectedDate && selectedTime ? 'pointer' : 'not-allowed' }}>
          Suivant →
        </button>
        <button onClick={() => setStep(2)} style={btnGhost}>← Retour</button>
      </div>
    </div>
  )

  // ── Step 4: Vos informations ────────────────────────────────────────────────
  const step4 = (
    <div style={card}>
      <p style={{ fontWeight:700, fontSize:17, color:'#0F172A', margin:'0 0 4px' }}>Vos informations</p>
      <p style={{ fontSize:13, color:'#64748B', margin:'0 0 20px' }}>Renseignez vos coordonnées pour confirmer le RDV.</p>

      <div style={{ background:'#F8FAFC', borderRadius:10, padding:'12px 14px', marginBottom:20, fontSize:13, color:'#475569', lineHeight:1.8 }}>
        <div>📋 <strong>{selectedType?.nom}</strong> — {selectedType?.dureeDefaut} min</div>
        <div>📅 {selectedDate ? formatDateLong(selectedDate) : ''} à {selectedTime}</div>
        <div>👨‍⚕️ {typeof selectedPraticien === 'object' ? `${selectedPraticien.prenom} ${selectedPraticien.nom}` : 'Praticien disponible'}</div>
      </div>

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Prénom *</label>
            <input type="text" required value={patient.prenom} onChange={e => setPatient(p => ({...p, prenom: e.target.value}))} style={inputSt}
              onFocus={e => { e.target.style.borderColor='#2563EB' }} onBlur={e => { e.target.style.borderColor='#E2E8F0' }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Nom *</label>
            <input type="text" required value={patient.nom} onChange={e => setPatient(p => ({...p, nom: e.target.value}))} style={inputSt}
              onFocus={e => { e.target.style.borderColor='#2563EB' }} onBlur={e => { e.target.style.borderColor='#E2E8F0' }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Téléphone *</label>
          <input type="tel" required placeholder="06XXXXXXXX" value={patient.telephone} onChange={e => setPatient(p => ({...p, telephone: e.target.value}))} style={inputSt}
            onFocus={e => { e.target.style.borderColor='#2563EB' }} onBlur={e => { e.target.style.borderColor='#E2E8F0' }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Email <span style={{ color:'#94A3B8', fontWeight:400 }}>(facultatif)</span></label>
          <input type="email" value={patient.email} onChange={e => setPatient(p => ({...p, email: e.target.value}))} style={inputSt}
            onFocus={e => { e.target.style.borderColor='#2563EB' }} onBlur={e => { e.target.style.borderColor='#E2E8F0' }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Notes / motif <span style={{ color:'#94A3B8', fontWeight:400 }}>(facultatif)</span></label>
          <textarea rows={3} placeholder="Ex: douleur au genou..." value={patient.notes} onChange={e => setPatient(p => ({...p, notes: e.target.value}))}
            style={{ ...inputSt, resize:'vertical', lineHeight:1.5 }}
            onFocus={e => { e.target.style.borderColor='#2563EB' }} onBlur={e => { e.target.style.borderColor='#E2E8F0' }} />
        </div>
        <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', fontSize:13, color:'#374151', lineHeight:1.5 }}>
          <input type="checkbox" required checked={patient.consent} onChange={e => setPatient(p => ({...p, consent: e.target.checked}))}
            style={{ marginTop:2, accentColor:'#2563EB', flexShrink:0, width:16, height:16 }} />
          <span>J&apos;accepte que mes données soient utilisées pour la gestion de mon RDV.</span>
        </label>

        {submitError && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'12px 14px', fontSize:13, color:'#DC2626' }}>
            ❌ {submitError}
          </div>
        )}

        <button type="submit" disabled={booking || !patient.consent}
          style={{ ...btnPrimary, opacity: booking || !patient.consent ? 0.6 : 1, cursor: booking || !patient.consent ? 'not-allowed' : 'pointer' }}>
          {booking ? 'Confirmation en cours...' : '✅ Confirmer le RDV'}
        </button>
        <button type="button" onClick={() => setStep(3)} style={btnGhost}>← Retour</button>
      </form>
    </div>
  )

  // ── Step 5: Confirmation ────────────────────────────────────────────────────
  const step5 = (
    <div style={card}>
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
        <p style={{ fontSize:22, fontWeight:800, color:'#16A34A', margin:'0 0 4px' }}>RDV confirmé !</p>
        <p style={{ fontSize:14, color:'#64748B', margin:0 }}>Votre rendez-vous a été enregistré avec succès.</p>
      </div>
      <div style={{ background:'#F8FAFC', borderRadius:12, padding:'16px 18px', display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
        <InfoRow icon="📅" label={`${selectedDate ? formatDateLong(selectedDate) : ''} à ${selectedTime}`} bold />
        <InfoRow icon="🏥" label={`${selectedType?.nom} — ${selectedType?.dureeDefaut} min`} />
        <InfoRow icon="👨‍⚕️" label={typeof selectedPraticien === 'object' ? `Dr. ${selectedPraticien.prenom} ${selectedPraticien.nom}` : 'Praticien disponible'} />
        <InfoRow icon="📍" label={`${cabinet.nom} — ${cabinet.ville}`} />
      </div>
      {cabinet.bookingMessage && (
        <div style={{ background:'#EFF6FF', borderRadius:10, padding:'12px 14px', fontSize:13, color:'#1E40AF', marginBottom:16, borderLeft:'3px solid #2563EB' }}>
          ℹ️ {cabinet.bookingMessage}
        </div>
      )}
      <div style={{ background:'#F0FDF4', borderRadius:10, padding:'12px 14px', fontSize:13, color:'#15803D', marginBottom:24 }}>
        💬 Un WhatsApp de confirmation vous sera envoyé.
      </div>
      <button onClick={reset} style={btnPrimary}>Prendre un autre RDV</button>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', fontFamily:"'Inter',sans-serif" }}>
      {header}
      <div style={{ background:'linear-gradient(135deg,#1E3A5F,#2563EB)', paddingBottom:40, paddingTop:8 }}>
        <div style={{ maxWidth:520, margin:'0 auto', padding:'0 16px' }}>
          {step === 1 && step1}
          {step === 2 && step2}
          {step === 3 && step3}
          {step === 4 && step4}
          {step === 5 && step5}
        </div>
      </div>
    </div>
  )
}
