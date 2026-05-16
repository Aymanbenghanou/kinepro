'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import {
  buildWhatsAppUrl, scoreColor, scoreBadge, scoreCategory,
  msgFeedbackExcellent, msgFeedbackMoyen, msgFeedbackDifficile,
} from '@/lib/whatsapp'

const GOOGLE_MAPS_DEFAULT = 'https://g.page/r/CabinetKinePro/review'

interface Patient {
  id: string
  prenom: string
  nom: string
  telephone?: string | null
  seances?: any[]
  nbSeancesPrescrites?: number | null
}

interface Props {
  seance: {
    id: string
    typeSeance: string
    date: string | Date
    patientId: string
  }
  patient: Patient
  praticienNom?: string
  onClose: () => void
  onSaved: () => void
}

export default function FeedbackModal({ seance, patient, praticienNom, onClose, onSaved }: Props) {
  const [step, setStep] = useState<'score' | 'preview'>('score')
  const [score, setScore] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [notesInternes, setNotesInternes] = useState('')
  const [messagePersonnalise, setMessagePersonnalise] = useState('')
  const [messageWA, setMessageWA] = useState('')
  const [saving, setSaving] = useState(false)
  const [googleMapsLink, setGoogleMapsLink] = useState(GOOGLE_MAPS_DEFAULT)

  // Fetch cabinet google maps link
  useEffect(() => {
    fetch('/api/cabinet').then(r => r.json()).then(d => {
      if (d?.googleMapsLink) setGoogleMapsLink(d.googleMapsLink)
    }).catch(() => {})
  }, [])

  function buildMessage(s: number, msgPerso: string): string {
    const cat = scoreCategory(s)
    const seancesRealisees = patient.seances?.filter((sc: any) => sc.statut === 'realisee').length || 1
    if (cat === 'excellent') {
      return msgFeedbackExcellent({
        prenom: patient.prenom,
        numSeance: seancesRealisees,
        totalSeances: patient.nbSeancesPrescrites || null,
        typeSeance: seance.typeSeance,
        googleMapsLink,
      })
    }
    if (cat === 'moyen') {
      return msgFeedbackMoyen({
        prenom: patient.prenom,
        messagePersonnalise: msgPerso,
        prochainRdv: undefined,
      })
    }
    return msgFeedbackDifficile({
      prenom: patient.prenom,
      messagePersonnalise: msgPerso || 'Votre kiné va adapter votre programme lors de la prochaine séance.',
      prochainRdv: undefined,
    })
  }

  function goToPreview() {
    if (!score) return
    setMessageWA(buildMessage(score, messagePersonnalise))
    setStep('preview')
  }

  async function saveOnly() {
    if (!score) return
    setSaving(true)
    try {
      await fetch(`/api/seances/${seance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scorePatient: score, notesInternes, feedbackEnvoye: false }),
      })
      onSaved()
      onClose()
    } catch {}
    setSaving(false)
  }

  async function sendAndSave() {
    if (!score || !patient.telephone) return
    setSaving(true)
    try {
      await fetch(`/api/seances/${seance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scorePatient: score, notesInternes, feedbackEnvoye: true }),
      })
      // log
      await fetch('/api/whatsapp/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'feedback_seance', patientId: patient.id,
          patientNom: `${patient.prenom} ${patient.nom}`,
          telephone: patient.telephone, message: messageWA,
        }),
      })
      window.open(buildWhatsAppUrl(patient.telephone, messageWA), '_blank')
      onSaved()
      onClose()
    } catch {}
    setSaving(false)
  }

  const badge = score ? scoreBadge(score) : null
  const cat = score ? scoreCategory(score) : null

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 500, backdropFilter: 'blur(3px)',
  }
  const modal: React.CSSProperties = {
    background: 'white', borderRadius: 20, width: 520,
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
  }
  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0',
    borderRadius: 8, fontSize: 14, resize: 'vertical' as const,
    boxSizing: 'border-box' as const, fontFamily: 'inherit',
  }

  // ── Step 1: Score ──────────────────────────────────────────────────────────
  if (step === 'score') return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Feedback séance — {patient.prenom} {patient.nom}
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
                {seance.typeSeance} · {new Date(seance.date).toLocaleDateString('fr-FR')}
                {praticienNom && ` · Dr. ${praticienNom}`}
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}><X size={20} /></button>
          </div>
        </div>

        <div style={{ padding: '20px 28px 28px' }}>
          {/* Score label row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>Difficile 😟</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>
              Comment s'est passée cette séance ?
            </span>
            <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 500 }}>Excellent ! 🌟</span>
          </div>

          {/* Score circles */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
              const active = score === n
              const col = scoreColor(n)
              const isHov = hovered === n
              return (
                <button key={n} onClick={() => setScore(n)}
                  onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)}
                  style={{
                    flex: 1, aspectRatio: '1', borderRadius: '50%', border: `2px solid ${active || isHov ? col : '#E2E8F0'}`,
                    background: active ? col : isHov ? col + '20' : '#F8FAFC',
                    color: active ? 'white' : col, fontWeight: 700, fontSize: 14,
                    cursor: 'pointer', transition: 'all 0.15s',
                    transform: active ? 'scale(1.12)' : 'scale(1)',
                    boxShadow: active ? `0 4px 12px ${col}60` : 'none',
                    padding: 0,
                  }}>
                  {n}
                </button>
              )
            })}
          </div>

          {/* Score badge */}
          <div style={{ height: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            {badge && (
              <span style={{ background: badge.bg, color: badge.color, padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
                {badge.emoji} {badge.label} — {score}/10
              </span>
            )}
          </div>

          {/* Notes internes */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
              Notes internes <span style={{ color: '#94A3B8', fontWeight: 400 }}>(jamais envoyées au patient)</span>
            </label>
            <textarea value={notesInternes} onChange={e => setNotesInternes(e.target.value)}
              rows={3} style={inp}
              placeholder="Observations, douleurs signalées, points à améliorer..." />
          </div>

          {/* Message personnalisé (only for score ≤ 7) */}
          {score !== null && cat !== 'excellent' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                Message personnalisé au patient
              </label>
              <textarea value={messagePersonnalise} onChange={e => setMessagePersonnalise(e.target.value)}
                rows={3} style={{ ...inp, borderColor: '#E2E8F0' }}
                placeholder="Rassurez le patient, expliquez ce qui s'est passé..." />
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={saveOnly} disabled={!score || saving}
              style={{
                flex: 1, padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10,
                background: 'white', cursor: score && !saving ? 'pointer' : 'not-allowed',
                fontWeight: 500, fontSize: 13, color: '#374151',
              }}>
              {saving ? 'Enregistrement...' : 'Enregistrer sans envoyer'}
            </button>
            <button onClick={goToPreview} disabled={!score}
              style={{
                flex: 2, padding: '10px 14px', border: 'none', borderRadius: 10,
                background: score ? '#25D366' : '#E2E8F0',
                color: score ? 'white' : '#94A3B8',
                cursor: score ? 'pointer' : 'not-allowed',
                fontWeight: 600, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: score ? '0 2px 8px rgba(37,211,102,0.3)' : 'none',
              }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Générer message WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Step 2: Preview ────────────────────────────────────────────────────────
  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Aperçu du message WhatsApp
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
          </div>
        </div>

        <div style={{ padding: '0 28px 28px' }}>
          {/* Info row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            {badge && (
              <span style={{ background: badge.bg, color: badge.color, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                {badge.emoji} {badge.label} {score}/10
              </span>
            )}
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
              📱 {patient.prenom} {patient.nom}
            </span>
            <span style={{ fontSize: 13, color: '#64748B' }}>{patient.telephone}</span>
          </div>

          {/* Editable message preview */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 6 }}>
              MESSAGE (modifiable avant envoi)
            </label>
            <textarea value={messageWA} onChange={e => setMessageWA(e.target.value)}
              rows={12}
              style={{
                ...inp, fontFamily: 'monospace', fontSize: 13,
                background: '#F8FAFC', lineHeight: 1.6,
              }} />
          </div>

          {/* Preview box */}
          <div style={{ background: '#E9FBE4', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 13, color: '#1A3C1A', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto', fontFamily: 'system-ui' }}>
            {messageWA}
          </div>

          {!patient.telephone && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>
                ⚠️ Aucun numéro de téléphone pour ce patient — WhatsApp non disponible.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('score')}
              style={{ flex: 1, padding: '11px', border: '1px solid #E2E8F0', borderRadius: 10, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#374151', fontSize: 14 }}>
              ← Modifier
            </button>
            {patient.telephone && (
              <button onClick={sendAndSave} disabled={saving}
                style={{
                  flex: 2, padding: '11px', border: 'none', borderRadius: 10,
                  background: saving ? '#93C5FD' : '#25D366',
                  color: 'white', cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 2px 10px rgba(37,211,102,0.3)',
                }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {saving ? 'Envoi...' : 'Ouvrir WhatsApp →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
