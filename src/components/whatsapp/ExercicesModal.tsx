'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { msgExercices, buildWhatsAppUrl } from '@/lib/whatsapp'

interface Props {
  patient: { id: string; prenom: string; nom: string; telephone?: string | null }
  onClose: () => void
}

export default function ExercicesModal({ patient, onClose }: Props) {
  const [programme, setProgramme] = useState('')
  const [step, setStep] = useState<'edit' | 'preview'>('edit')
  const [sending, setSending] = useState(false)

  const message = msgExercices({ prenom: patient.prenom, programme })

  async function handleSend() {
    if (!patient.telephone || !programme.trim()) return
    setSending(true)
    try {
      await fetch('/api/whatsapp/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'exercices', patientId: patient.id,
          patientNom: `${patient.prenom} ${patient.nom}`,
          telephone: patient.telephone, message,
        }),
      })
      window.open(buildWhatsAppUrl(patient.telephone, message), '_blank')
      onClose()
    } catch {}
    setSending(false)
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500,
  }

  return (
    <div style={overlay}>
      <div style={{ background: 'white', borderRadius: 20, padding: 28, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>💪 Programme d'exercices</h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>{patient.prenom} {patient.nom}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
        </div>

        {step === 'edit' ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>
                Programme d'exercices personnalisé *
              </label>
              <textarea value={programme} onChange={e => setProgramme(e.target.value)}
                rows={8} placeholder={`Exemple :\n\n1. Étirement des ischio-jambiers — 3x30s\n2. Renforcement quadriceps — 3x15 reps\n3. Gainage abdominal — 3x30s\n\nFaites ces exercices chaque jour, de préférence le matin.`}
                style={{ width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose}
                style={{ flex: 1, padding: '11px', border: '1px solid #E2E8F0', borderRadius: 10, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#64748B' }}>
                Annuler
              </button>
              <button onClick={() => setStep('preview')} disabled={!programme.trim()}
                style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, background: programme.trim() ? '#7C3AED' : '#E2E8F0', color: programme.trim() ? 'white' : '#94A3B8', cursor: programme.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 14 }}>
                Aperçu →
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: '#E9FBE4', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 13, color: '#1A3C1A', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'system-ui', maxHeight: 300, overflowY: 'auto' }}>
              {message}
            </div>
            {!patient.telephone && (
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>⚠️ Aucun téléphone enregistré pour ce patient.</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('edit')}
                style={{ flex: 1, padding: '11px', border: '1px solid #E2E8F0', borderRadius: 10, background: 'white', cursor: 'pointer', fontWeight: 500, color: '#374151' }}>
                ← Modifier
              </button>
              {patient.telephone && (
                <button onClick={handleSend} disabled={sending}
                  style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, background: '#7C3AED', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {sending ? 'Envoi...' : 'Envoyer sur WhatsApp →'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
