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

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
}

export default function PatientPublicPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/patient-public/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('Erreur de connexion'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, flexShrink: 0,
          background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          <span style={{ color: '#1E3A5F', fontSize: 30, fontWeight: 800, fontFamily: 'Georgia, serif' }}>K</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, margin: 0, letterSpacing: '0.1em' }}>
          KinéPro
        </p>
      </div>

      {loading && (
        <div style={{ color: 'white', fontSize: 18, marginTop: 40 }}>Chargement...</div>
      )}

      {error && (
        <div style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '32px 24px',
          maxWidth: 380, width: '100%', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Dossier introuvable</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
            Ce QR code n'est pas valide ou a expiré.
          </p>
        </div>
      )}

      {data && (
        <div style={{ maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Cabinet name */}
          {data.cabinet && (
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', margin: 0 }}>
              {data.cabinet.nom}
            </p>
          )}

          {/* Greeting */}
          <div style={{
            background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '24px', textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, margin: '0 0 6px' }}>Bonjour,</p>
            <p style={{ color: 'white', fontSize: 32, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
              {data.prenom} {data.nom}
            </p>
          </div>

          {/* Today's RDV */}
          {data.todayRdv && data.todayRdv.length > 0 ? (
            data.todayRdv.map((rdv: any) => (
              <div key={rdv.id} style={{
                background: 'white', borderRadius: 20, padding: 24,
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 20 }}>✅</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#0F172A' }}>RDV aujourd'hui</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#16A34A', fontWeight: 600 }}>Confirmé</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <RdvRow icon="🕐" label={formatTime(rdv.date)} />
                  <RdvRow icon="💆" label={rdv.typeSeance} />
                  <RdvRow icon="👨‍⚕️" label={`Dr. ${rdv.praticien?.prenom} ${rdv.praticien?.nom}`} />
                  {rdv.salle && <RdvRow icon="📍" label={rdv.salle} />}
                </div>
              </div>
            ))
          ) : data.nextRdv ? (
            <div style={{
              background: 'white', borderRadius: 20, padding: 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 20 }}>📅</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#0F172A' }}>Prochain RDV</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#2563EB', fontWeight: 600 }}>
                    {formatDateLong(data.nextRdv.date)}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <RdvRow icon="🕐" label={formatTime(data.nextRdv.date)} />
                <RdvRow icon="💆" label={data.nextRdv.typeSeance} />
                <RdvRow icon="👨‍⚕️" label={`Dr. ${data.nextRdv.praticien?.prenom} ${data.nextRdv.praticien?.nom}`} />
                {data.nextRdv.salle && <RdvRow icon="📍" label={data.nextRdv.salle} />}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 24,
              textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <p style={{ fontSize: 32, margin: '0 0 12px' }}>📭</p>
              <p style={{ color: 'white', fontWeight: 600, fontSize: 15, margin: '0 0 6px' }}>
                Aucun RDV à venir
              </p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>
                Contactez votre cabinet pour planifier une séance.
              </p>
              {data.cabinet?.telephone && (
                <a href={`tel:${data.cabinet.telephone}`} style={{
                  display: 'inline-block', marginTop: 16,
                  background: 'white', color: '#2563EB',
                  padding: '10px 24px', borderRadius: 10,
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                }}>
                  📞 Appeler le cabinet
                </a>
              )}
            </div>
          )}

          {/* Cabinet contact */}
          {data.cabinet?.telephone && (
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 8px' }}>
                {data.cabinet.adresse && `${data.cabinet.adresse}, `}{data.cabinet.ville}
              </p>
              <a href={`tel:${data.cabinet.telephone}`} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, textDecoration: 'none' }}>
                📞 {data.cabinet.telephone}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RdvRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: 15, color: '#374151', fontWeight: 500 }}>{label}</span>
    </div>
  )
}
