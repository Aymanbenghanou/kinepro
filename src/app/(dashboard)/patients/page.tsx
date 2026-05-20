'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { formatDate } from '@/lib/utils'
import { Plus, Search, QrCode } from 'lucide-react'
import NewPatientWizard from '@/components/patients/NewPatientWizard'
import dynamic from 'next/dynamic'

const QrCodeModal = dynamic(() => import('@/components/qr/QrCodeModal'), { ssr: false })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'

function StatusBadge({ actif }: { actif: boolean }) {
  return (
    <span style={{
      background: actif ? '#DCFCE7' : '#F1F5F9',
      color: actif ? '#16A34A' : '#64748B',
      padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
    }}>
      {actif ? 'Actif' : 'Inactif'}
    </span>
  )
}

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showWizard, setShowWizard] = useState(false)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const PER_PAGE = 10
  const [qrTarget, setQrTarget] = useState<{ patientId: string; nom: string } | null>(null)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  async function openQr(e: React.MouseEvent, patientId: string, nom: string) {
    e.stopPropagation()
    setQrTarget({ patientId, nom })
    setQrToken(null)
    setQrLoading(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/qr-token`)
      const data = await res.json()
      setQrToken(data.token)
    } catch {}
    setQrLoading(false)
  }

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setPatients(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }, [search])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  const totalPages = Math.ceil(patients.length / PER_PAGE)
  const paginated = patients.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      <Topbar title="Patients" subtitle={`${patients.length} patients au total`} />
      <div style={{ padding: 24 }}>

        {/* Header */}
        <div className="page-header-row">
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{
                paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14,
                width: '100%', outline: 'none', background: 'white',
              }}
            />
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="desktop-add-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#2563EB', color: 'white', border: 'none',
              borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
              fontWeight: 600, fontSize: 14, boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              flexShrink: 0,
            }}
          >
            <Plus size={16} /> Nouveau patient
          </button>
        </div>

        {/* Table */}
        {/* ── MOBILE: card list ─────────────────────────────────── */}
        <div className="mobile-only mlist">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Chargement…</div>
          ) : paginated.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Aucun patient trouvé</div>
          ) : paginated.map((p: any) => {
            const waPhone = p.telephone ? p.telephone.replace(/[\s\-\+]/g, '').replace(/^0/, '212') : null
            return (
              <div key={p.id} className="mcard">
                <a href={`/patients/${p.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div className="mcard-row">
                    <div className="mcard-avatar">{p.prenom?.[0]}{p.nom?.[0]}</div>
                    <div className="mcard-title">{p.prenom} {p.nom}</div>
                    <span
                      className="mcard-pill"
                      style={{
                        background: p.actif ? '#DCFCE7' : '#F1F5F9',
                        color: p.actif ? '#16A34A' : '#64748B',
                      }}
                    >
                      {p.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  {p.telephone && (
                    <div className="mcard-meta">
                      📞 <span style={{ color: '#0F172A', fontWeight: 600 }}>{p.telephone}</span>
                    </div>
                  )}
                  <div className="mcard-meta">
                    🏥 <span>{p.pathologie || 'Non spécifiée'}</span>
                    {p.seances?.length > 0 && <>· <strong style={{ color: '#2563EB' }}>{p.seances.length} séances</strong></>}
                  </div>
                  {p.rendezVous?.[0] && (
                    <div className="mcard-meta" style={{ fontSize: 12, color: '#94A3B8' }}>
                      Dernière visite : {formatDate(p.rendezVous[0].date)}
                    </div>
                  )}
                </a>
                <div className="mcard-actions">
                  <a href={`/patients/${p.id}`} className="mcard-btn primary">
                    📋 Voir
                  </a>
                  {waPhone && (
                    <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" className="mcard-btn success">
                      💬 WhatsApp
                    </a>
                  )}
                  <button onClick={e => openQr(e, p.id, `${p.prenom} ${p.nom}`)} className="mcard-btn">
                    <QrCode size={13} /> QR
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── DESKTOP: table ─────────────────────────────────── */}
        <div className="table-container desktop-only">
          <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Patient', 'Téléphone', 'Pathologie', 'Séances', 'Statut', 'Dernière visite', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748B', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 14 }}>Chargement...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 14 }}>Aucun patient trouvé</td></tr>
              ) : paginated.map((p: any, i: number) => (
                <tr key={p.id}
                  onClick={() => router.push(`/patients/${p.id}`)}
                  style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? 'white' : '#FAFAFA', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#FAFAFA')}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: '#2563EB',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>
                          {p.prenom?.[0]}{p.nom?.[0]}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{p.prenom} {p.nom}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{p.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151' }}>{p.telephone || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', maxWidth: 180 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.pathologie || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: '#DBEAFE', color: '#2563EB', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                      {p.seances?.length || 0}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}><StatusBadge actif={p.actif} /></td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748B' }}>
                    {p.rendezVous?.[0] ? formatDate(p.rendezVous[0].date) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: '#2563EB', fontWeight: 500 }}>Dossier →</span>
                      <button
                        onClick={e => openQr(e, p.id, `${p.prenom} ${p.nom}`)}
                        title="QR Code"
                        style={{
                          padding: '5px 7px', border: '1px solid #E2E8F0', borderRadius: 6,
                          background: 'white', cursor: 'pointer', color: '#64748B',
                          display: 'flex', alignItems: 'center', minHeight: 'unset',
                        }}
                      >
                        <QrCode size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>{/* /table-scroll */}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>Page {page} sur {totalPages} · {patients.length} résultats</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 6, background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#CBD5E1' : '#374151', fontSize: 13 }}>
                  Précédent
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 6, background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#CBD5E1' : '#374151', fontSize: 13 }}>
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAB: mobile only */}
      <button className="fab-btn" onClick={() => setShowWizard(true)} aria-label="Nouveau patient">
        +
      </button>

      {/* QR Code modal */}
      {qrTarget && (
        qrLoading ? (
          <div className="modal-overlay" style={{ zIndex: 200 }}>
            <div className="modal-sheet" style={{ padding: 40, width: 300, textAlign: 'center' }}>
              <p style={{ color: '#64748B', margin: 0 }}>Génération du QR code...</p>
            </div>
          </div>
        ) : qrToken ? (
          <QrCodeModal
            url={`${APP_URL}/patient-public/${qrToken}`}
            title={qrTarget.nom}
            subtitle={`Patient · ${qrToken.slice(0, 8)}...`}
            onClose={() => { setQrTarget(null); setQrToken(null) }}
          />
        ) : null
      )}

      {showWizard && (
        <NewPatientWizard
          onClose={() => setShowWizard(false)}
          onSuccess={(id) => { setShowWizard(false); router.push(`/patients/${id}`) }}
        />
      )}
    </div>
  )
}
