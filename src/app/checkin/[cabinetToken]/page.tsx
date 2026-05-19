'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDateLong(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

type Step = 'phone' | 'rdv' | 'confirmed' | 'error'

export default function CheckinPage() {
  const { cabinetToken } = useParams<{ cabinetToken: string }>()
  const [cabinetNom, setCabinetNom] = useState('')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<Step>('phone')
  const [patientData, setPatientData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    fetch(`/api/checkin/${cabinetToken}`)
      .then(r => r.json())
      .then(d => { if (d.cabinet) setCabinetNom(d.cabinet.nom) })
      .catch(() => {})
  }, [cabinetToken])

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/checkin/${cabinetToken}?phone=${encodeURIComponent(phone)}`)
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Erreur')
        setStep('error')
      } else {
        setPatientData(data)
        setStep('rdv')
      }
    } catch {
      setErrorMsg('Erreur de connexion')
      setStep('error')
    }
    setLoading(false)
  }

  async function handleConfirm() {
    if (!patientData?.nextRdv?.id) return
    setConfirming(true)
    try {
      await fetch(`/api/checkin/${cabinetToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rdvId: patientData.nextRdv.id }),
      })
      setStep('confirmed')
    } catch {}
    setConfirming(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 28, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          <span style={{ color: '#1E3A5F', fontSize: 30, fontWeight: 800, fontFamily: 'Georgia, serif' }}>K</span>
        </div>
        {cabinetNom && (
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: 600, margin: 0 }}>{cabinetNom}</p>
        )}
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: '4px 0 0' }}>Check-in patient</p>
      </div>

      <div style={{ maxWidth: 380, width: '100%' }}>

        {/* Step 1: Phone input */}
        {step === 'phone' && (
          <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 6px', textAlign: 'center' }}>
              Bienvenue !
            </p>
            <p style={{ fontSize: 14, color: '#64748B', textAlign: 'center', margin: '0 0 24px' }}>
              Entrez votre numéro de téléphone pour voir votre RDV
            </p>
            <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                  📱 Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ex: 0612345678"
                  required
                  autoFocus
                  style={{
                    width: '100%', padding: '14px 16px',
                    border: '2px solid #E2E8F0', borderRadius: 12,
                    fontSize: 18, outline: 'none', letterSpacing: '0.05em',
                    boxSizing: 'border-box', textAlign: 'center',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB' }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0' }}
                />
              </div>
              <button type="submit" disabled={loading || phone.length < 8}
                style={{
                  padding: '14px', background: '#2563EB', color: 'white',
                  border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 16,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: phone.length < 8 ? 0.6 : 1,
                }}>
                {loading ? 'Recherche...' : 'Rechercher mon RDV →'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Show RDV */}
        {step === 'rdv' && patientData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Greeting */}
            <div style={{
              background: 'rgba(255,255,255,0.14)', borderRadius: 16, padding: '20px 24px',
              textAlign: 'center', border: '1px solid rgba(255,255,255,0.25)',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 4px', fontSize: 14 }}>Bonjour,</p>
              <p style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: 0 }}>
                {patientData.patient?.prenom} {patientData.patient?.nom}
              </p>
            </div>

            {patientData.nextRdv ? (
              <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#64748B', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Votre prochain RDV
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  <InfoRow icon="📅" label={formatDateLong(patientData.nextRdv.date)} bold />
                  <InfoRow icon="🕐" label={formatTime(patientData.nextRdv.date)} bold />
                  <InfoRow icon="💆" label={patientData.nextRdv.typeSeance} />
                  <InfoRow icon="👨‍⚕️" label={`Dr. ${patientData.nextRdv.praticien?.prenom} ${patientData.nextRdv.praticien?.nom}`} />
                  {patientData.nextRdv.salle && <InfoRow icon="📍" label={patientData.nextRdv.salle} />}
                </div>
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  style={{
                    width: '100%', padding: '14px',
                    background: 'linear-gradient(90deg, #16A34A, #22C55E)',
                    color: 'white', border: 'none', borderRadius: 12,
                    fontWeight: 700, fontSize: 16, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(22,163,74,0.35)',
                  }}>
                  {confirming ? 'Confirmation...' : '✅ Confirmer ma présence'}
                </button>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 20, padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 40, margin: '0 0 12px' }}>📭</p>
                <p style={{ fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Aucun RDV à venir</p>
                <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
                  Contactez votre cabinet pour planifier une séance.
                </p>
              </div>
            )}

            <button onClick={() => { setStep('phone'); setPhone(''); setPatientData(null) }}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.8)', padding: '12px', borderRadius: 12, cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>
              ← Retour
            </button>
          </div>
        )}

        {/* Step 3: Confirmed */}
        {step === 'confirmed' && (
          <div style={{ background: 'white', borderRadius: 20, padding: 36, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', margin: '0 0 10px' }}>Présence confirmée !</p>
            <p style={{ fontSize: 15, color: '#64748B', margin: '0 0 24px' }}>
              L'équipe soignante a été notifiée de votre arrivée.
            </p>
            <button onClick={() => { setStep('phone'); setPhone(''); setPatientData(null) }}
              style={{ padding: '12px 28px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              Retour à l'accueil
            </button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div style={{ background: 'white', borderRadius: 20, padding: 28, textAlign: 'center' }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>❌</p>
            <p style={{ fontWeight: 700, color: '#DC2626', margin: '0 0 8px' }}>Patient introuvable</p>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px' }}>{errorMsg}</p>
            <button onClick={() => setStep('phone')}
              style={{ padding: '12px 24px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
              Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, bold }: { icon: string; label: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 20, minWidth: 28, textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: 15, color: '#0F172A', fontWeight: bold ? 700 : 500 }}>{label}</span>
    </div>
  )
}
