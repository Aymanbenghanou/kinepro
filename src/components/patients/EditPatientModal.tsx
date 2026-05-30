'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, User, Heart, MapPin, CreditCard } from 'lucide-react'

// ─── Constants alignées sur NewPatientWizard ────────────────────────────────
const PATHOLOGIE_SUGGESTIONS = [
  'Lombalgie', 'Cervicalgie', 'Post-opératoire genou', 'Post-opératoire épaule',
  'Entorse', 'Fracture', 'AVC', 'Sciatique', 'Hernie discale', 'Autre',
]
const MUTUELLES       = ['CNSS', 'CNOPS', 'RMA', 'SAHAM', 'AXA', 'Privé', 'Sans']
const FREQUENCES      = ['1x/semaine', '2x/semaine', '3x/semaine', 'Autre']
const MODES_PAIEMENT  = ['Espèces', 'Virement', 'Chèque']
const SEXES           = ['M', 'F']

// ─── Types ───────────────────────────────────────────────────────────────────
interface PraticienOption {
  id: string
  kind: 'praticien' | 'secretaire'
  nom: string
  prenom: string
  specialite?: string | null
}

interface Patient {
  id:                   string
  nom:                  string
  prenom:               string
  dateNaissance?:       string | null
  sexe?:                string | null
  telephone?:           string | null
  email?:               string | null
  adresse?:             string | null
  ville?:               string | null
  cin?:                 string | null
  pathologie?:          string | null
  antecedents?:         string | null
  allergies?:           string | null
  medicaments?:         string | null
  medecinReferent?:     string | null
  medecinTelephone?:    string | null
  objectifsTraitement?: string | null
  mutuelle?:            string | null
  numeroPolice?:        string | null
  tarifSeance?:         number | string | null
  modePaiement?:        string | null
  nbSeancesPrescrites?: number | string | null
  frequence?:           string | null
  praticienAssigneId?:  string | null
}

interface Props {
  patient:    Patient
  onClose:    () => void
  onSuccess: (toast: { message: string; type: 'success' | 'error' }) => void
}

// Champs gérés par le formulaire — sert aussi de whitelist pour le diff.
const FORM_KEYS = [
  'nom', 'prenom', 'dateNaissance', 'sexe', 'telephone', 'email',
  'adresse', 'ville', 'cin',
  'pathologie', 'antecedents', 'allergies', 'medicaments',
  'medecinReferent', 'medecinTelephone', 'objectifsTraitement',
  'mutuelle', 'numeroPolice', 'tarifSeance', 'modePaiement',
  'nbSeancesPrescrites', 'frequence', 'praticienAssigneId',
] as const
type FormKey   = typeof FORM_KEYS[number]
type FormState = Record<FormKey, string>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toFormString(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return ''
}

// Date ISO → "YYYY-MM-DD" pour input type="date".
function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch { return '' }
}

function patientToForm(p: Patient): FormState {
  return {
    nom:                 toFormString(p.nom),
    prenom:              toFormString(p.prenom),
    dateNaissance:       isoToDateInput(p.dateNaissance ?? null),
    sexe:                toFormString(p.sexe),
    telephone:           toFormString(p.telephone),
    email:               toFormString(p.email),
    adresse:             toFormString(p.adresse),
    ville:               toFormString(p.ville),
    cin:                 toFormString(p.cin),
    pathologie:          toFormString(p.pathologie),
    antecedents:         toFormString(p.antecedents),
    allergies:           toFormString(p.allergies),
    medicaments:         toFormString(p.medicaments),
    medecinReferent:     toFormString(p.medecinReferent),
    medecinTelephone:    toFormString(p.medecinTelephone),
    objectifsTraitement: toFormString(p.objectifsTraitement),
    mutuelle:            toFormString(p.mutuelle),
    numeroPolice:        toFormString(p.numeroPolice),
    tarifSeance:         toFormString(p.tarifSeance),
    modePaiement:        toFormString(p.modePaiement),
    nbSeancesPrescrites: toFormString(p.nbSeancesPrescrites),
    frequence:           toFormString(p.frequence),
    praticienAssigneId:  toFormString(p.praticienAssigneId),
  }
}

/**
 * Diff : ne renvoie QUE les champs effectivement modifiés.
 * - Si le champ texte passe de "X" à "" → on envoie null (effacement).
 * - Si le champ reste vide → ignoré (rien à faire).
 * Bénéficie du PATCH-style fix du PUT /api/patients/[id] : seuls les champs
 * envoyés sont touchés en base.
 */
function buildDiff(initial: FormState, current: FormState): Record<string, unknown> {
  const diff: Record<string, unknown> = {}
  for (const key of FORM_KEYS) {
    const a = initial[key]
    const b = current[key]
    if (a === b) continue
    diff[key] = b === '' ? null : b
  }
  return diff
}

// ─── Styles ──────────────────────────────────────────────────────────────────
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
const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 72,
}
const sectionTitleStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  fontSize: 14, fontWeight: 700, color: '#0F172A',
  marginTop: 4, marginBottom: 10,
  paddingBottom: 8, borderBottom: '1px solid #F1F5F9',
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EditPatientModal({ patient, onClose, onSuccess }: Props) {
  const initial = useMemo(() => patientToForm(patient), [patient])
  const [form, setForm]     = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [praticiens, setPraticiens] = useState<PraticienOption[]>([])

  // Charge la liste des Praticiens (kind='praticien' uniquement).
  useEffect(() => {
    fetch('/api/praticiens')
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) return
        setPraticiens(
          d.filter((m: PraticienOption) => m.kind === 'praticien')
            .map((m: PraticienOption) => ({
              id: m.id, kind: m.kind, nom: m.nom, prenom: m.prenom, specialite: m.specialite,
            })),
        )
      })
      .catch(() => {})
  }, [])

  function update(key: FormKey, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.nom.trim() || !form.prenom.trim()) {
      setError('Nom et prénom sont obligatoires.')
      return
    }

    const diff = buildDiff(initial, form)
    if (Object.keys(diff).length === 0) {
      onClose()
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diff),
      })

      if (!res.ok) {
        let msg = `Erreur ${res.status}`
        try {
          const body = await res.json()
          if (body?.error === 'invalid_body' && Array.isArray(body.issues) && body.issues[0]) {
            const it = body.issues[0]
            msg = `Champ invalide${it.path?.length ? ` (${it.path.join('.')})` : ''} : ${it.message}`
          } else if (body?.error === 'trial_expired') {
            msg = "Période d'essai expirée."
          } else if (body?.error === 'forbidden') {
            msg = 'Permission insuffisante.'
          } else if (body?.error) {
            msg = String(body.error)
          }
        } catch {}
        setError(msg)
        setSaving(false)
        return
      }

      onSuccess({ message: 'Patient modifié ✓', type: 'success' })
      onClose()
    } catch {
      setError('Erreur réseau. Réessayez.')
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 16, width: '100%', maxWidth: 720,
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        }}
      >
        {/* Header sticky */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 24px', borderBottom: '1px solid #E2E8F0',
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Modifier le patient
          </h2>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fermer"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          <div style={{ padding: '18px 24px', overflowY: 'auto', flex: 1 }}>

            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                color: '#B91C1C', padding: '10px 14px', borderRadius: 8,
                fontSize: 13, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {/* ── Identité ────────────────────────────────────────────────── */}
            <div style={sectionTitleStyle}><User size={15} /> Identité</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <Field label="Prénom" required>
                <input
                  value={form.prenom}
                  onChange={e => update('prenom', e.target.value)}
                  required
                  style={inputStyle}
                />
              </Field>
              <Field label="Nom" required>
                <input
                  value={form.nom}
                  onChange={e => update('nom', e.target.value)}
                  required
                  style={inputStyle}
                />
              </Field>
              <Field label="Sexe">
                <select
                  value={form.sexe}
                  onChange={e => update('sexe', e.target.value)}
                  style={{ ...inputStyle, appearance: 'auto' }}
                >
                  <option value="">—</option>
                  {SEXES.map(s => <option key={s} value={s}>{s === 'M' ? 'Masculin' : 'Féminin'}</option>)}
                </select>
              </Field>
              <Field label="Date de naissance">
                <input
                  type="date"
                  value={form.dateNaissance}
                  onChange={e => update('dateNaissance', e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="CIN">
                <input
                  value={form.cin}
                  onChange={e => update('cin', e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Téléphone">
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={e => update('telephone', e.target.value)}
                  placeholder="0600000000"
                  style={inputStyle}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* ── Adresse ─────────────────────────────────────────────────── */}
            <div style={sectionTitleStyle}><MapPin size={15} /> Adresse</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
              <Field label="Adresse">
                <input
                  value={form.adresse}
                  onChange={e => update('adresse', e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Ville">
                <input
                  value={form.ville}
                  onChange={e => update('ville', e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* ── Médical ─────────────────────────────────────────────────── */}
            <div style={sectionTitleStyle}><Heart size={15} /> Médical</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Field label="Pathologie">
                <input
                  list="patho-suggestions"
                  value={form.pathologie}
                  onChange={e => update('pathologie', e.target.value)}
                  style={inputStyle}
                />
                <datalist id="patho-suggestions">
                  {PATHOLOGIE_SUGGESTIONS.map(p => <option key={p} value={p} />)}
                </datalist>
              </Field>
              <Field label="Médecin référent">
                <input
                  value={form.medecinReferent}
                  onChange={e => update('medecinReferent', e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Tél. médecin">
                <input
                  type="tel"
                  value={form.medecinTelephone}
                  onChange={e => update('medecinTelephone', e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 16 }}>
              <Field label="Antécédents">
                <textarea
                  value={form.antecedents}
                  onChange={e => update('antecedents', e.target.value)}
                  rows={3}
                  style={textareaStyle}
                />
              </Field>
              <Field label="Allergies">
                <textarea
                  value={form.allergies}
                  onChange={e => update('allergies', e.target.value)}
                  rows={2}
                  style={textareaStyle}
                />
              </Field>
              <Field label="Médicaments en cours">
                <textarea
                  value={form.medicaments}
                  onChange={e => update('medicaments', e.target.value)}
                  rows={2}
                  style={textareaStyle}
                />
              </Field>
              <Field label="Objectifs du traitement">
                <textarea
                  value={form.objectifsTraitement}
                  onChange={e => update('objectifsTraitement', e.target.value)}
                  rows={2}
                  style={textareaStyle}
                />
              </Field>
            </div>

            {/* ── Administratif ───────────────────────────────────────────── */}
            <div style={sectionTitleStyle}><CreditCard size={15} /> Administratif</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <Field label="Mutuelle">
                <input
                  list="mutuelles-suggestions"
                  value={form.mutuelle}
                  onChange={e => update('mutuelle', e.target.value)}
                  style={inputStyle}
                />
                <datalist id="mutuelles-suggestions">
                  {MUTUELLES.map(m => <option key={m} value={m} />)}
                </datalist>
              </Field>
              <Field label="N° police">
                <input
                  value={form.numeroPolice}
                  onChange={e => update('numeroPolice', e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Tarif séance (MAD)">
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={form.tarifSeance}
                  onChange={e => update('tarifSeance', e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Mode de paiement">
                <select
                  value={form.modePaiement}
                  onChange={e => update('modePaiement', e.target.value)}
                  style={{ ...inputStyle, appearance: 'auto' }}
                >
                  <option value="">—</option>
                  {MODES_PAIEMENT.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Séances prescrites">
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={form.nbSeancesPrescrites}
                  onChange={e => update('nbSeancesPrescrites', e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Fréquence">
                <select
                  value={form.frequence}
                  onChange={e => update('frequence', e.target.value)}
                  style={{ ...inputStyle, appearance: 'auto' }}
                >
                  <option value="">—</option>
                  {FREQUENCES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Praticien assigné">
                <select
                  value={form.praticienAssigneId}
                  onChange={e => update('praticienAssigneId', e.target.value)}
                  style={{ ...inputStyle, appearance: 'auto' }}
                >
                  <option value="">— Aucun</option>
                  {praticiens.map(p => (
                    <option key={p.id} value={p.id}>
                      Dr. {p.prenom} {p.nom}{p.specialite ? ` — ${p.specialite}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Footer sticky */}
          <div style={{
            display: 'flex', gap: 10, justifyContent: 'flex-end',
            padding: '14px 24px', borderTop: '1px solid #E2E8F0',
            background: '#FAFBFC', borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '10px 18px', border: '1px solid #E2E8F0', borderRadius: 8,
                background: 'white', cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 500, color: '#64748B', fontSize: 14,
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 22px', border: 'none', borderRadius: 8,
                background: saving ? '#93C5FD' : '#2563EB', color: 'white',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: 14,
              }}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
