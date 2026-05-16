'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import { Save } from 'lucide-react'

const TYPES_SEANCE_DEFAULT = [
  { nom: 'Rééducation', duree: 45, tarif: 250 },
  { nom: 'Massage thérapeutique', duree: 30, tarif: 200 },
  { nom: 'Électrothérapie', duree: 30, tarif: 150 },
  { nom: 'Ultrasons', duree: 20, tarif: 120 },
  { nom: 'Cryothérapie', duree: 20, tarif: 100 },
  { nom: 'Kinésithérapie respiratoire', duree: 45, tarif: 300 },
]

const SALLES_DEFAULT = ['Salle 1', 'Salle 2', 'Salle 3']

export default function ParametresPage() {
  const [cabinet, setCabinet] = useState({
    nom: 'Cabinet Amrani - Kinésithérapie',
    adresse: '45 Avenue Hassan II, Casablanca 20000',
    telephone: '0522-456-789',
    email: 'contact@cabinet-amrani.ma',
  })
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'cabinet' | 'seances' | 'salles'>('cabinet')

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs: { key: 'cabinet' | 'seances' | 'salles'; label: string }[] = [
    { key: 'cabinet', label: 'Infos cabinet' },
    { key: 'seances', label: 'Types de séances' },
    { key: 'salles', label: 'Salles' },
  ]

  return (
    <div>
      <Topbar title="Paramètres" subtitle="Configuration du cabinet" />
      <div style={{ padding: 24 }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#F1F5F9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 14,
                background: activeTab === tab.key ? 'white' : 'transparent',
                color: activeTab === tab.key ? '#0F172A' : '#64748B',
                boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Cabinet */}
        {activeTab === 'cabinet' && (
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 28, maxWidth: 600 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Informations du cabinet</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Nom du cabinet</label>
                <input value={cabinet.nom} onChange={e => setCabinet(c => ({...c, nom: e.target.value}))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Adresse</label>
                <input value={cabinet.adresse} onChange={e => setCabinet(c => ({...c, adresse: e.target.value}))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Téléphone</label>
                  <input value={cabinet.telephone} onChange={e => setCabinet(c => ({...c, telephone: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
                  <input type="email" value={cabinet.email} onChange={e => setCabinet(c => ({...c, email: e.target.value}))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14 }} />
                </div>
              </div>
              <button onClick={handleSave}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: saved ? '#16A34A' : '#2563EB', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, width: 'fit-content' }}>
                <Save size={16} /> {saved ? 'Sauvegardé!' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        )}

        {/* Tab: Types de séances */}
        {activeTab === 'seances' && (
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: 20, borderBottom: '1px solid #E2E8F0' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: 0 }}>Types de séances</h2>
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
                {TYPES_SEANCE_DEFAULT.map((t) => (
                  <tr key={t.nom} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontWeight: 500, color: '#0F172A', fontSize: 14 }}>{t.nom}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: '#DBEAFE', color: '#2563EB', padding: '3px 10px', borderRadius: 999, fontSize: 13, fontWeight: 500 }}>{t.duree} min</span>
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

        {/* Tab: Salles */}
        {activeTab === 'salles' && (
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, maxWidth: 400 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Salles disponibles</h2>
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
