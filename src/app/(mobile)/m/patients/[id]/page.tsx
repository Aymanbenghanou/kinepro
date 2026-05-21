'use client'

import { useState, useEffect, useCallback, use as usePromise } from 'react'
import Link from 'next/link'
import MobileTopbar from '@/components/mobile/MobileTopbar'
import { QrCode, Download, Calendar } from 'lucide-react'

const AVATAR_COLORS = [
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#DCFCE7', text: '#15803D' },
  { bg: '#FEF3C7', text: '#B45309' },
  { bg: '#F3E8FF', text: '#7C3AED' },
  { bg: '#FFE4E6', text: '#BE123C' },
  { bg: '#E0F2FE', text: '#0369A1' },
]
const avatarColor = (n: string) => AVATAR_COLORS[(n?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]

const TABS = ['Infos', 'Séances', 'Factures', 'Progrès', 'Docs', 'QR'] as const
type TabId = typeof TABS[number]

export default function MobilePatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params)
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('Infos')

  const fetchPatient = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/patients/${id}`)
      const d = await r.json()
      if (!d.error) setPatient(d)
    } catch {}
    setLoading(false)
  }, [id])

  useEffect(() => { fetchPatient() }, [fetchPatient])

  if (loading) return (
    <div>
      <MobileTopbar title="Chargement…" />
      <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Chargement…</div>
    </div>
  )
  if (!patient) return (
    <div>
      <MobileTopbar title="Introuvable" />
      <div style={{ padding: 40, textAlign: 'center', color: '#DC2626', fontSize: 14 }}>Patient introuvable</div>
    </div>
  )

  const age = patient.dateNaissance ? Math.floor((Date.now() - new Date(patient.dateNaissance).getTime()) / (365.25 * 86400000)) : null
  const av = avatarColor(patient.nom)

  return (
    <div>
      <MobileTopbar title={`${patient.prenom} ${patient.nom}`} subtitle="Dossier patient" back={{ href: '/m/patients', label: 'Patients' }} />

      {/* Tabs — sticky scrollable pills */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 20,
        background: 'white', borderBottom: '0.5px solid #E2E8F0',
        display: 'flex', gap: 6, overflowX: 'auto',
        WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
        padding: '10px 16px',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                border: 'none', cursor: 'pointer',
                background: active ? '#2563EB' : '#F1F5F9',
                color:      active ? 'white'   : '#64748B',
              }}>
              {tab}
            </button>
          )
        })}
      </div>

      {/* INFOS TAB */}
      {activeTab === 'Infos' && (
        <div style={{ padding: '12px 16px' }}>
          {/* Header card */}
          <div style={{ background: 'white', borderRadius: 16, border: '0.5px solid #E2E8F0', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: av.bg, color: av.text,
                fontSize: 20, fontWeight: 500, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {patient.prenom?.[0]}{patient.nom?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 17, fontWeight: 500, color: '#0F172A' }}>
                    {patient.prenom} {patient.nom}
                  </span>
                  <span style={{
                    background: patient.actif ? '#F0FDF4' : '#F1F5F9',
                    color:      patient.actif ? '#15803D' : '#64748B',
                    fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {patient.actif ? 'Actif' : 'Inactif'}
                  </span>
                  {patient.sexe && (
                    <span style={{
                      background: '#EFF6FF', color: '#2563EB',
                      fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{patient.sexe}</span>
                  )}
                </div>
                {(age !== null || patient.sexe) && (
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                    {age !== null && `${age} ans`}
                    {age !== null && patient.sexe && ' · '}
                    {patient.sexe}
                  </div>
                )}
                {patient.telephone && (
                  <a href={`tel:${patient.telephone}`} style={{ fontSize: 13, color: '#2563EB', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                    📞 {patient.telephone}
                  </a>
                )}
              </div>
            </div>

            {patient.pathologie && (
              <div style={{ padding: '0 16px 12px' }}>
                <span style={{
                  background: '#FFF7ED', color: '#B45309',
                  fontSize: 12, fontWeight: 500,
                  padding: '6px 14px', borderRadius: 20,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                  🏥 {patient.pathologie}
                </span>
              </div>
            )}

            {/* 2×2 actions */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 8, padding: 12, borderTop: '0.5px solid #F1F5F9',
            }}>
              <Link href={`/patients/${id}`} style={actionBtn({ bg: 'white', color: '#2563EB', border: '0.5px solid #BFDBFE' })}>
                <QrCode size={14} /> QR Code
              </Link>
              <Link href={`/patients/${id}`} style={actionBtn({ bg: 'white', color: '#DC2626', border: '0.5px solid #FECACA' })}>
                <Download size={14} /> PDF
              </Link>
              <Link href={`/patients/${id}`} style={actionBtn({ bg: '#2563EB', color: 'white' })}>
                💪 Exercices
              </Link>
              <Link href={`/patients/${id}`} style={actionBtn({ bg: '#1E293B', color: 'white' })}>
                <Calendar size={14} /> Planifier
              </Link>
            </div>
          </div>

          {/* Info rows */}
          <div style={{ background: 'white', borderRadius: 16, border: '0.5px solid #E2E8F0', overflow: 'hidden' }}>
            <InfoRow label="Email"             value={patient.email}            link={patient.email ? `mailto:${patient.email}` : undefined} />
            <InfoRow label="Adresse"           value={patient.adresse} />
            <InfoRow label="Ville"             value={patient.ville} />
            <InfoRow label="CIN"               value={patient.cin} />
            <InfoRow label="Mutuelle"          value={patient.mutuelle} />
            <InfoRow label="N° police"         value={patient.numeroPolice} />
            <InfoRow label="Médecin référent"  value={patient.medecinReferent} />
            <InfoRow label="Tél. médecin"      value={patient.medecinTelephone} link={patient.medecinTelephone ? `tel:${patient.medecinTelephone}` : undefined} />
            <InfoRow label="Mode paiement"     value={patient.modePaiement} />
            <InfoRow label="Tarif séance"      value={patient.tarifSeance ? `${patient.tarifSeance} MAD` : null} last />
          </div>
        </div>
      )}

      {/* OTHER TABS: deep-link to desktop dossier for now */}
      {activeTab !== 'Infos' && (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{
            background: 'white', borderRadius: 14, border: '0.5px solid #E2E8F0',
            padding: '32px 20px',
          }}>
            <div style={{ fontSize: 14, color: '#64748B', marginBottom: 14 }}>
              L'onglet <strong style={{ color: '#0F172A' }}>{activeTab}</strong> arrive bientôt sur mobile.
            </div>
            <Link href={`/patients/${id}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#2563EB', color: 'white', borderRadius: 10,
              padding: '10px 18px', fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
            }}>
              Ouvrir le dossier complet →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function actionBtn(opts: { bg: string; color: string; border?: string }): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 44, borderRadius: 12,
    background: opts.bg, color: opts.color,
    border: opts.border || 'none',
    fontSize: 13, fontWeight: 500,
    textDecoration: 'none',
    minWidth: 0,
  }
}

function InfoRow({ label, value, link, last }: {
  label: string; value?: string | null; link?: string; last?: boolean
}) {
  if (!value) return null
  const content = link
    ? <a href={link} style={{ color: '#2563EB', textDecoration: 'none' }}>{value}</a>
    : value
  return (
    <div style={{ padding: '12px 16px', borderBottom: last ? 'none' : '0.5px solid #F8FAFC' }}>
      <div style={{
        fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5,
        fontWeight: 500, marginBottom: 3,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 14, color: '#0F172A',
        overflowWrap: 'anywhere', wordBreak: 'break-word',
      }}>
        {content}
      </div>
    </div>
  )
}
