'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Check, User, Heart, CreditCard, ClipboardList } from 'lucide-react'
import Toast from '@/components/ui/Toast'

// ─── Types ───────────────────────────────────────────────────────────────────
interface SeanceType {
  id: string
  nom: string
  dureeDefaut: number
  tarifDefaut: number
  couleur: string
}

interface Praticien {
  id: string
  nom: string
  prenom: string
  specialite?: string
  couleur: string
}

interface WizardData {
  // Étape 1
  nom: string
  prenom: string
  dateNaissance: string
  sexe: string
  telephone: string
  email: string
  adresse: string
  ville: string
  cin: string
  // Étape 2
  pathologie: string
  medecinReferent: string
  medecinTelephone: string
  antecedents: string
  allergies: string
  medicaments: string
  // Étape 3
  mutuelle: string
  numeroPolice: string
  tarifSeance: string
  modePaiement: string
  // Étape 4
  nbSeancesPrescrites: string
  frequence: string
  praticienAssigneId: string
  typesSeances: string[]
  objectifsTraitement: string
  dateDebutSouhaite: string
}

interface Props {
  onClose: () => void
  onSuccess: (patientId: string) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcAge(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const PATHOLOGIE_SUGGESTIONS = [
  'Lombalgie', 'Cervicalgie', 'Post-opératoire genou', 'Post-opératoire épaule',
  'Entorse', 'Fracture', 'AVC', 'Sciatique', 'Hernie discale', 'Autre'
]
const MUTUELLES = ['CNSS', 'CNOPS', 'RMA', 'SAHAM', 'AXA', 'Privé', 'Sans']
const FREQUENCES = ['1x/semaine', '2x/semaine', '3x/semaine', 'Autre']
const MODES_PAIEMENT = ['Espèces', 'Virement', 'Chèque']

// ─── Styles partagés ─────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #E2E8F0', borderRadius: 8,
  fontSize: 14, color: '#0F172A', background: 'white',
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: '#374151',
  display: 'block', marginBottom: 6,
}
const errorStyle: React.CSSProperties = {
  fontSize: 12, color: '#DC2626', marginTop: 4,
}
const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 72,
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  )
}

// ─── Étape 1: Infos personnelles ─────────────────────────────────────────────
function Step1({ data, errors, onChange }: {
  data: WizardData
  errors: Partial<Record<keyof WizardData, string>>
  onChange: (key: keyof WizardData, value: string) => void
}) {
  const age = calcAge(data.dateNaissance)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Prénom" required error={errors.prenom}>
          <input style={{ ...inputStyle, borderColor: errors.prenom ? '#DC2626' : '#E2E8F0' }}
            value={data.prenom} onChange={e => onChange('prenom', e.target.value)}
            placeholder="Fatima" />
        </Field>
        <Field label="Nom" required error={errors.nom}>
          <input style={{ ...inputStyle, borderColor: errors.nom ? '#DC2626' : '#E2E8F0' }}
            value={data.nom} onChange={e => onChange('nom', e.target.value)}
            placeholder="Benali" />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Date de naissance" required error={errors.dateNaissance}>
          <div style={{ position: 'relative' }}>
            <input type="date" style={{ ...inputStyle, borderColor: errors.dateNaissance ? '#DC2626' : '#E2E8F0' }}
              value={data.dateNaissance} onChange={e => onChange('dateNaissance', e.target.value)} />
            {age !== null && (
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#2563EB', fontWeight: 600 }}>
                {age} ans
              </span>
            )}
          </div>
        </Field>
        <Field label="Sexe">
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            {['Homme', 'Femme'].map(s => (
              <button key={s} type="button"
                onClick={() => onChange('sexe', s)}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, border: '1.5px solid',
                  borderColor: data.sexe === s ? '#2563EB' : '#E2E8F0',
                  background: data.sexe === s ? '#EFF6FF' : 'white',
                  color: data.sexe === s ? '#2563EB' : '#64748B',
                }}>
                {s === 'Homme' ? '♂ Homme' : '♀ Femme'}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Téléphone" required error={errors.telephone}>
          <input style={{ ...inputStyle, borderColor: errors.telephone ? '#DC2626' : '#E2E8F0' }}
            value={data.telephone} onChange={e => onChange('telephone', e.target.value)}
            placeholder="06XXXXXXXX" />
        </Field>
        <Field label="Email">
          <input type="email" style={inputStyle}
            value={data.email} onChange={e => onChange('email', e.target.value)}
            placeholder="email@exemple.com" />
        </Field>
      </div>
      <Field label="Adresse complète">
        <input style={inputStyle}
          value={data.adresse} onChange={e => onChange('adresse', e.target.value)}
          placeholder="123 Rue Mohammed V" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Ville">
          <input style={inputStyle}
            value={data.ville} onChange={e => onChange('ville', e.target.value)}
            placeholder="Casablanca" />
        </Field>
        <Field label="CIN">
          <input style={inputStyle}
            value={data.cin} onChange={e => onChange('cin', e.target.value)}
            placeholder="BE123456" />
        </Field>
      </div>
    </div>
  )
}

// ─── Étape 2: Infos médicales ─────────────────────────────────────────────────
function Step2({ data, errors, onChange }: {
  data: WizardData
  errors: Partial<Record<keyof WizardData, string>>
  onChange: (key: keyof WizardData, value: string) => void
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const filtered = PATHOLOGIE_SUGGESTIONS.filter(s =>
    s.toLowerCase().includes(data.pathologie.toLowerCase()) && data.pathologie.length > 0
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Pathologie principale" required error={errors.pathologie}>
        <div style={{ position: 'relative' }}>
          <input style={{ ...inputStyle, borderColor: errors.pathologie ? '#DC2626' : '#E2E8F0' }}
            value={data.pathologie}
            onChange={e => { onChange('pathologie', e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Ex: Lombalgie chronique" />
          {showSuggestions && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 180, overflowY: 'auto' }}>
              {(data.pathologie.length === 0 ? PATHOLOGIE_SUGGESTIONS : filtered).map(s => (
                <div key={s} onMouseDown={() => { onChange('pathologie', s); setShowSuggestions(false) }}
                  style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 14, color: '#374151' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Médecin référent">
          <input style={inputStyle}
            value={data.medecinReferent} onChange={e => onChange('medecinReferent', e.target.value)}
            placeholder="Dr. Alaoui" />
        </Field>
        <Field label="Téléphone médecin">
          <input style={inputStyle}
            value={data.medecinTelephone} onChange={e => onChange('medecinTelephone', e.target.value)}
            placeholder="05XX-XXXXXX" />
        </Field>
      </div>
      <Field label="Antécédents médicaux">
        <textarea style={textareaStyle}
          value={data.antecedents} onChange={e => onChange('antecedents', e.target.value)}
          placeholder="Diabète, hypertension, chirurgies antérieures..." />
      </Field>
      <Field label="Allergies">
        <textarea style={{ ...textareaStyle, minHeight: 56 }}
          value={data.allergies} onChange={e => onChange('allergies', e.target.value)}
          placeholder="Latex, pénicilline..." />
      </Field>
      <Field label="Médicaments en cours">
        <textarea style={{ ...textareaStyle, minHeight: 56 }}
          value={data.medicaments} onChange={e => onChange('medicaments', e.target.value)}
          placeholder="Ibuprofène 400mg, Paracétamol..." />
      </Field>
    </div>
  )
}

// ─── Étape 3: Assurance & Paiement ───────────────────────────────────────────
function Step3({ data, onChange }: {
  data: WizardData
  onChange: (key: keyof WizardData, value: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Mutuelle / Assurance">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MUTUELLES.map(m => (
            <button key={m} type="button" onClick={() => onChange('mutuelle', m)}
              style={{
                padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 500, border: '1.5px solid',
                borderColor: data.mutuelle === m ? '#2563EB' : '#E2E8F0',
                background: data.mutuelle === m ? '#EFF6FF' : 'white',
                color: data.mutuelle === m ? '#2563EB' : '#64748B',
              }}>
              {m}
            </button>
          ))}
        </div>
      </Field>
      {data.mutuelle && data.mutuelle !== 'Sans' && data.mutuelle !== 'Privé' && (
        <Field label="Numéro de police">
          <input style={inputStyle}
            value={data.numeroPolice} onChange={e => onChange('numeroPolice', e.target.value)}
            placeholder="N° de police ou d'affiliation" />
        </Field>
      )}
      <Field label="Tarif séance (MAD)">
        <div style={{ position: 'relative' }}>
          <input type="number" style={{ ...inputStyle, paddingRight: 52 }}
            value={data.tarifSeance} onChange={e => onChange('tarifSeance', e.target.value)}
            placeholder="250" min="0" />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#64748B', fontWeight: 500 }}>MAD</span>
        </div>
        <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Tarif applicable pour ce patient (peut différer du tarif standard)</p>
      </Field>
      <Field label="Mode de paiement préféré">
        <div style={{ display: 'flex', gap: 8 }}>
          {MODES_PAIEMENT.map(m => (
            <button key={m} type="button" onClick={() => onChange('modePaiement', m)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, border: '1.5px solid',
                borderColor: data.modePaiement === m ? '#2563EB' : '#E2E8F0',
                background: data.modePaiement === m ? '#EFF6FF' : 'white',
                color: data.modePaiement === m ? '#2563EB' : '#64748B',
              }}>
              {m}
            </button>
          ))}
        </div>
      </Field>
      {/* Résumé financier */}
      {data.tarifSeance && data.mutuelle && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', margin: '0 0 8px' }}>💡 Résumé assurance</p>
          <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>
            Tarif séance: <strong>{data.tarifSeance} MAD</strong> · Couverture: <strong>{data.mutuelle}</strong>
            {data.modePaiement && <> · Paiement: <strong>{data.modePaiement}</strong></>}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Étape 4: Plan de traitement ──────────────────────────────────────────────
function Step4({ data, errors, onChange, onToggleType, seanceTypes, praticiens }: {
  data: WizardData
  errors: Partial<Record<keyof WizardData, string>>
  onChange: (key: keyof WizardData, value: string) => void
  onToggleType: (nom: string) => void
  seanceTypes: SeanceType[]
  praticiens: Praticien[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Nombre de séances prescrites">
          <input type="number" style={inputStyle}
            value={data.nbSeancesPrescrites}
            onChange={e => onChange('nbSeancesPrescrites', e.target.value)}
            placeholder="Ex: 15" min="1" />
        </Field>
        <Field label="Fréquence">
          <select style={{ ...inputStyle }} value={data.frequence} onChange={e => onChange('frequence', e.target.value)}>
            <option value="">Sélectionner...</option>
            {FREQUENCES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Praticien assigné" required error={errors.praticienAssigneId}>
        <select style={{ ...inputStyle, borderColor: errors.praticienAssigneId ? '#DC2626' : '#E2E8F0' }}
          value={data.praticienAssigneId} onChange={e => onChange('praticienAssigneId', e.target.value)}>
          <option value="">Sélectionner un praticien...</option>
          {praticiens.map(p => (
            <option key={p.id} value={p.id}>Dr. {p.prenom} {p.nom}{p.specialite ? ` — ${p.specialite}` : ''}</option>
          ))}
        </select>
      </Field>
      <Field label="Types de séances">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
          {seanceTypes.map(t => {
            const selected = data.typesSeances.includes(t.nom)
            return (
              <button key={t.id} type="button" onClick={() => onToggleType(t.nom)}
                style={{
                  padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  border: '1.5px solid', transition: 'all 0.15s',
                  borderColor: selected ? t.couleur : '#E2E8F0',
                  background: selected ? t.couleur + '18' : 'white',
                  color: selected ? t.couleur : '#64748B',
                }}>
                {selected && '✓ '}{t.nom}
              </button>
            )
          })}
        </div>
      </Field>
      <Field label="Objectifs du traitement">
        <textarea style={textareaStyle}
          value={data.objectifsTraitement}
          onChange={e => onChange('objectifsTraitement', e.target.value)}
          placeholder={
            'Un objectif par ligne. Préfixe pour le statut :\n' +
            '✓ Réduction douleur lombaire   (terminé)\n' +
            '→ Récupération mobilité genou   (en cours)\n' +
            '- Reprise activité sportive     (à faire)'
          } />
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, lineHeight: 1.5 }}>
          Un objectif par ligne. Préfixe pour le statut affiché sur mobile :{' '}
          <strong style={{ color: '#16A34A' }}>✓</strong> terminé ·{' '}
          <strong style={{ color: '#2563EB' }}>→</strong> en cours ·{' '}
          sans préfixe = à faire.
        </p>
      </Field>
      <Field label="Date de début souhaitée">
        <input type="date" style={inputStyle}
          value={data.dateDebutSouhaite}
          onChange={e => onChange('dateDebutSouhaite', e.target.value)} />
      </Field>
      {/* Résumé plan */}
      {(data.nbSeancesPrescrites || data.frequence) && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#2563EB', margin: '0 0 8px' }}>📋 Plan de traitement</p>
          <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>
            {data.nbSeancesPrescrites && <>{data.nbSeancesPrescrites} séances </>}
            {data.frequence && <>à raison de {data.frequence}</>}
            {data.typesSeances.length > 0 && <> · {data.typesSeances.join(', ')}</>}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Informations\npersonnelles', icon: User },
  { label: 'Informations\nmédicales', icon: Heart },
  { label: 'Assurance &\nPaiement', icon: CreditCard },
  { label: 'Plan de\ntraitement', icon: ClipboardList },
]

const EMPTY: WizardData = {
  nom: '', prenom: '', dateNaissance: '', sexe: '', telephone: '', email: '',
  adresse: '', ville: '', cin: '',
  pathologie: '', medecinReferent: '', medecinTelephone: '', antecedents: '', allergies: '', medicaments: '',
  mutuelle: '', numeroPolice: '', tarifSeance: '', modePaiement: '',
  nbSeancesPrescrites: '', frequence: '', praticienAssigneId: '', typesSeances: [], objectifsTraitement: '', dateDebutSouhaite: '',
}

export default function NewPatientWizard({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof WizardData, string>>>({})
  const [seanceTypes, setSeanceTypes] = useState<SeanceType[]>([])
  const [praticiens, setPraticiens] = useState<Praticien[]>([])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<{ patientId: string; patientName: string } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch('/api/seance-types').then(r => r.json()).then(d => setSeanceTypes(Array.isArray(d) ? d : []))
    fetch('/api/praticiens').then(r => r.json()).then(d => setPraticiens(Array.isArray(d) ? d : []))
  }, [])

  function onChange(key: keyof WizardData, value: string) {
    setData(d => ({ ...d, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function onToggleType(nom: string) {
    setData(d => ({
      ...d,
      typesSeances: d.typesSeances.includes(nom)
        ? d.typesSeances.filter(t => t !== nom)
        : [...d.typesSeances, nom],
    }))
  }

  function validate(stepIndex: number): boolean {
    const newErrors: Partial<Record<keyof WizardData, string>> = {}
    if (stepIndex === 0) {
      if (!data.prenom.trim()) newErrors.prenom = 'Le prénom est requis'
      if (!data.nom.trim()) newErrors.nom = 'Le nom est requis'
      if (!data.dateNaissance) newErrors.dateNaissance = 'La date de naissance est requise'
      if (!data.telephone.trim()) newErrors.telephone = 'Le téléphone est requis'
      else if (!/^(05|06|07)\d{8}$/.test(data.telephone.replace(/[-\s]/g, '')))
        newErrors.telephone = 'Format invalide (06XXXXXXXX)'
    }
    if (stepIndex === 1) {
      if (!data.pathologie.trim()) newErrors.pathologie = 'La pathologie est requise'
    }
    if (stepIndex === 3) {
      if (!data.praticienAssigneId) newErrors.praticienAssigneId = 'Veuillez assigner un praticien'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function next() {
    if (validate(step)) setStep(s => s + 1)
  }

  async function submit() {
    if (!validate(step)) return
    setSaving(true)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          typesSeances: data.typesSeances.join(', '),
          tarifSeance: data.tarifSeance ? parseFloat(data.tarifSeance) : null,
          nbSeancesPrescrites: data.nbSeancesPrescrites ? parseInt(data.nbSeancesPrescrites) : null,
        }),
      })
      const patient = await res.json()
      if (!res.ok) throw new Error(patient.error || 'Erreur serveur')
      setDone({ patientId: patient.id, patientName: `${data.prenom} ${data.nom}` })
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur serveur', type: 'error' })
    }
    setSaving(false)
  }

  // Overlay backdrop
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    backdropFilter: 'blur(2px)',
  }
  const modal: React.CSSProperties = {
    background: 'white', borderRadius: 20, width: 680,
    maxHeight: '92vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
  }

  // ── Écran de confirmation ─────────────────────────────────────────────────
  if (done) {
    return (
      <div style={overlay}>
        <div style={{ ...modal, width: 440, padding: 40, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Check size={36} color="#16A34A" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
            Patient créé avec succès !
          </h2>
          <p style={{ fontSize: 15, color: '#64748B', margin: '0 0 28px' }}>
            <strong style={{ color: '#0F172A' }}>{done.patientName}</strong> a été ajouté au cabinet.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <button onClick={() => onSuccess(done.patientId)}
              style={{ padding: '12px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 15 }}>
              Voir le dossier patient →
            </button>
            <button onClick={() => { window.location.href = `/agenda` }}
              style={{ padding: '12px 20px', background: '#F8FAFC', color: '#374151', border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>
              📅 Planifier un premier RDV
            </button>
            <button onClick={onClose}
              style={{ padding: '10px', background: 'transparent', color: '#64748B', border: 'none', cursor: 'pointer', fontSize: 14 }}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={overlay}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={modal}>
        {/* ── Header ── */}
        <div style={{ padding: '24px 28px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 }}>Nouveau patient</h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>Étape {step + 1} sur {STEPS.length}</p>
            </div>
            <button onClick={onClose}
              style={{ padding: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', color: '#64748B' }}>
              <X size={18} />
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 4 }}>
            {STEPS.map((s, i) => {
              const done = i < step
              const active = i === step
              const Icon = s.icon
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {/* Connector line */}
                  {i > 0 && (
                    <div style={{
                      position: 'absolute', left: '-50%', top: 16, width: '100%', height: 2,
                      background: done || active ? '#2563EB' : '#E2E8F0', zIndex: 0,
                    }} />
                  )}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? '#2563EB' : active ? '#EFF6FF' : '#F8FAFC',
                    border: `2px solid ${done || active ? '#2563EB' : '#E2E8F0'}`,
                    zIndex: 1, marginBottom: 6, transition: 'all 0.2s',
                  }}>
                    {done ? <Check size={16} color="white" /> : <Icon size={15} color={active ? '#2563EB' : '#94A3B8'} />}
                  </div>
                  <span style={{ fontSize: 10, color: active ? '#2563EB' : done ? '#16A34A' : '#94A3B8', fontWeight: active ? 600 : 400, textAlign: 'center', lineHeight: 1.2, whiteSpace: 'pre-line' }}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {step === 0 && <Step1 data={data} errors={errors} onChange={onChange} />}
          {step === 1 && <Step2 data={data} errors={errors} onChange={onChange} />}
          {step === 2 && <Step3 data={data} onChange={onChange} />}
          {step === 3 && <Step4 data={data} errors={errors} onChange={onChange} onToggleType={onToggleType} seanceTypes={seanceTypes} praticiens={praticiens} />}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', border: '1px solid #E2E8F0', borderRadius: 10, background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: 14, color: '#374151' }}>
            <ChevronLeft size={16} />
            {step === 0 ? 'Annuler' : 'Précédent'}
          </button>

          <div style={{ display: 'flex', gap: 6 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 999, background: i === step ? '#2563EB' : i < step ? '#93C5FD' : '#E2E8F0', transition: 'all 0.2s' }} />
            ))}
          </div>

          {step < STEPS.length - 1 ? (
            <button onClick={next}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={submit} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: saving ? '#93C5FD' : '#2563EB', color: 'white', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14 }}>
              {saving ? 'Création...' : <><Check size={16} /> Créer le patient</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
