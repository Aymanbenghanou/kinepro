'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/layout/Topbar'
import Toast from '@/components/ui/Toast'
import { Save, CheckCircle, AlertTriangle, Phone, Star, Info } from 'lucide-react'

const TYPES_SEANCE_DEFAULT = [
  { nom: 'Rééducation', duree: 45, tarif: 250 },
  { nom: 'Massage thérapeutique', duree: 30, tarif: 200 },
  { nom: 'Électrothérapie', duree: 30, tarif: 150 },
  { nom: 'Ultrasons', duree: 20, tarif: 120 },
  { nom: 'Cryothérapie', duree: 20, tarif: 100 },
  { nom: 'Kinésithérapie respiratoire', duree: 45, tarif: 300 },
]

const SALLES_DEFAULT = ['Salle 1', 'Salle 2', 'Salle 3']

type Tab = 'cabinet' | 'communications' | 'seances' | 'salles'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #E2E8F0', borderRadius: 8,
  fontSize: 14, color: '#0F172A', background: 'white',
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#374151',
  display: 'block', marginBottom: 6,
}

const helperStyle: React.CSSProperties = {
  fontSize: 12, color: '#64748B', marginTop: 4,
}

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 20px',
        background: saved ? '#16A34A' : saving ? '#93C5FD' : '#2563EB',
        color: 'white', border: 'none', borderRadius: 8,
        cursor: saving ? 'not-allowed' : 'pointer',
        fontWeight: 600, fontSize: 14, transition: 'background 0.2s',
      }}
    >
      {saved ? <CheckCircle size={16} /> : <Save size={16} />}
      {saved ? 'Sauvegardé !' : saving ? 'Enregistrement...' : 'Sauvegarder'}
    </button>
  )
}

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState<Tab>('cabinet')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [toast, setToast]         = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [cabinet, setCabinet] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    whatsappNumber: '',
    googleReviewLink: '',
    googleMapsLink: '',
  })

  // Load cabinet settings from API on mount
  useEffect(() => {
    fetch('/api/cabinet')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setCabinet({
            nom:              data.nom              || '',
            adresse:          data.adresse          || '',
            telephone:        data.telephone        || '',
            email:            data.email            || '',
            whatsappNumber:   data.whatsappNumber   || '',
            googleReviewLink: data.googleReviewLink || '',
            googleMapsLink:   data.googleMapsLink   || '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(fields: Partial<typeof cabinet>) {
    setSaving(true)
    try {
      const res = await fetch('/api/cabinet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')
      // Merge saved data back
      setCabinet(c => ({ ...c, ...fields }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      setToast({ message: 'Paramètres sauvegardés ✓', type: 'success' })
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Erreur serveur', type: 'error' })
    }
    setSaving(false)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'cabinet',        label: '🏥 Infos cabinet' },
    { key: 'communications', label: '📱 WhatsApp & Avis' },
    { key: 'seances',        label: '⚡ Types de séances' },
    { key: 'salles',         label: '🚪 Salles' },
  ]

  if (loading) {
    return (
      <div>
        <Topbar title="Paramètres" subtitle="Configuration du cabinet" />
        <div style={{ padding: 24, color: '#64748B', fontSize: 14 }}>Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <Topbar title="Paramètres" subtitle="Configuration du cabinet" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: 24 }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: '#F1F5F9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 500, fontSize: 13,
                background: activeTab === tab.key ? 'white' : 'transparent',
                color: activeTab === tab.key ? '#0F172A' : '#64748B',
                boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Infos cabinet ── */}
        {activeTab === 'cabinet' && (
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderLeft: '4px solid #2563EB', borderRadius: 12, padding: 28, maxWidth: 620 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Informations du cabinet</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nom du cabinet</label>
                <input value={cabinet.nom}
                  onChange={e => setCabinet(c => ({ ...c, nom: e.target.value }))}
                  placeholder="Ex: Cabinet Amrani - Kinésithérapie"
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Adresse</label>
                <input value={cabinet.adresse}
                  onChange={e => setCabinet(c => ({ ...c, adresse: e.target.value }))}
                  placeholder="Ex: 45 Avenue Hassan II, Casablanca 20000"
                  style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input value={cabinet.telephone}
                    onChange={e => setCabinet(c => ({ ...c, telephone: e.target.value }))}
                    placeholder="0522-456-789"
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={cabinet.email}
                    onChange={e => setCabinet(c => ({ ...c, email: e.target.value }))}
                    placeholder="contact@cabinet.ma"
                    style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Lien Google Maps (adresse)</label>
                <input value={cabinet.googleMapsLink}
                  onChange={e => setCabinet(c => ({ ...c, googleMapsLink: e.target.value }))}
                  placeholder="https://maps.google.com/..."
                  style={inputStyle} />
                <p style={helperStyle}>Lien vers votre emplacement sur Google Maps</p>
              </div>
              <SaveButton saving={saving} saved={saved}
                onClick={() => handleSave({
                  nom: cabinet.nom,
                  adresse: cabinet.adresse,
                  telephone: cabinet.telephone,
                  email: cabinet.email,
                  googleMapsLink: cabinet.googleMapsLink,
                })} />
            </div>
          </div>
        )}

        {/* ── Tab: WhatsApp & Avis ── */}
        {activeTab === 'communications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>

            {/* WhatsApp Number Card */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderLeft: '4px solid #25D366', borderRadius: 12, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={18} color="#16A34A" />
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Numéro WhatsApp du cabinet</h2>
              </div>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
                Ce numéro sera utilisé pour les communications WhatsApp avec vos patients
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Numéro WhatsApp du cabinet</label>
                  <input
                    value={cabinet.whatsappNumber}
                    onChange={e => setCabinet(c => ({ ...c, whatsappNumber: e.target.value }))}
                    placeholder="Ex: 0612345678"
                    style={inputStyle}
                  />
                  <p style={helperStyle}>Format marocain : 06XXXXXXXX ou 07XXXXXXXX</p>
                </div>

                {/* Preview */}
                {cabinet.whatsappNumber && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 14 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', margin: '0 0 4px' }}>✓ Aperçu du lien WhatsApp</p>
                    <p style={{ fontSize: 13, color: '#374151', margin: 0, fontFamily: 'monospace' }}>
                      wa.me/{cabinet.whatsappNumber.replace(/[^0-9]/g, '').replace(/^0/, '212')}
                    </p>
                  </div>
                )}

                {!cabinet.whatsappNumber && (
                  <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 10, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>
                      Configurez votre numéro WhatsApp pour activer les messages automatiques aux patients
                    </p>
                  </div>
                )}

                <SaveButton saving={saving} saved={saved}
                  onClick={() => handleSave({ whatsappNumber: cabinet.whatsappNumber })} />
              </div>
            </div>

            {/* Google Reviews Card */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderLeft: '4px solid #F59E0B', borderRadius: 12, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Star size={18} color="#D97706" />
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Lien Google Reviews</h2>
              </div>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
                Les patients satisfaits (score ≥ 8/10) recevront ce lien automatiquement via WhatsApp
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Lien Google Reviews</label>
                  <input
                    value={cabinet.googleReviewLink}
                    onChange={e => setCabinet(c => ({ ...c, googleReviewLink: e.target.value }))}
                    placeholder="https://g.page/r/..."
                    style={inputStyle}
                  />
                  <p style={helperStyle}>
                    Les patients avec un score ≥ 8/10 recevront automatiquement ce lien pour laisser un avis
                  </p>
                </div>

                {/* How to find it */}
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Info size={15} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#1D4ED8', margin: '0 0 4px' }}>Comment trouver votre lien ?</p>
                    <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.6 }}>
                      Google Maps → Recherchez votre établissement → Cliquez sur votre fiche →{' '}
                      <strong>Donner un avis</strong> → Partagez le lien
                    </p>
                  </div>
                </div>

                {/* Preview of the auto-message */}
                {cabinet.googleReviewLink && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', margin: '0 0 10px' }}>
                      ✓ Aperçu du message envoyé aux patients satisfaits (score ≥ 8/10)
                    </p>
                    <div style={{ background: 'white', borderRadius: 8, padding: 12, border: '1px solid #BBF7D0', fontFamily: 'monospace', fontSize: 12, color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
{`Bonjour [Prénom] ! 😊

Nous sommes ravis que votre séance se soit bien passée.

Votre avis nous aide à améliorer nos services et à aider d'autres patients à nous trouver.

⭐ Laissez un avis Google ici :
${cabinet.googleReviewLink}

Merci pour votre confiance !
— L'équipe ${cabinet.nom || 'du cabinet'}`}
                    </div>
                  </div>
                )}

                {!cabinet.googleReviewLink && (
                  <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 10, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>
                      ⚠️ Configurez votre lien Google pour activer les demandes d'avis automatiques
                    </p>
                  </div>
                )}

                <SaveButton saving={saving} saved={saved}
                  onClick={() => handleSave({ googleReviewLink: cabinet.googleReviewLink })} />
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Types de séances ── */}
        {activeTab === 'seances' && (
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', maxWidth: 680 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Types de séances</h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>Durées et tarifs par défaut</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Type de séance', 'Durée par défaut', 'Tarif (MAD)'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: '#64748B', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TYPES_SEANCE_DEFAULT.map(t => (
                  <tr key={t.nom} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontWeight: 500, color: '#0F172A', fontSize: 14 }}>{t.nom}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: '#DBEAFE', color: '#2563EB', padding: '3px 10px', borderRadius: 999, fontSize: 13, fontWeight: 500 }}>
                        {t.duree} min
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{t.tarif} MAD</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab: Salles ── */}
        {activeTab === 'salles' && (
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, maxWidth: 420 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Salles disponibles</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SALLES_DEFAULT.map((salle, i) => (
                <div key={salle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ['#2563EB', '#16A34A', '#F59E0B'][i] }} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>{salle}</span>
                  <span style={{ marginLeft: 'auto', background: '#DCFCE7', color: '#16A34A', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>Active</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
