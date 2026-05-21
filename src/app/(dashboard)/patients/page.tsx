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

// ── Avatar color palette: stable per-name color hash ──
const AVATAR_COLORS = [
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#DCFCE7', text: '#15803D' },
  { bg: '#FEF3C7', text: '#B45309' },
  { bg: '#F3E8FF', text: '#7C3AED' },
  { bg: '#FFE4E6', text: '#BE123C' },
  { bg: '#E0F2FE', text: '#0369A1' },
]
function getAvatarColor(name: string) {
  const idx = (name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

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
  const [filter, setFilter] = useState<'all' | 'actif' | 'nouveau' | 'en_cours' | 'termine'>('all')
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

  // Apply status filter (client-side). "actif" maps to p.actif === true.
  // The other variants ("nouveau", "en_cours", "termine") are based on
  // séance count and the patient's createdAt date as a sensible default.
  const filtered = patients.filter(p => {
    if (filter === 'all') return true
    if (filter === 'actif') return p.actif === true
    const sCount = p.seances?.length ?? 0
    const isRecent = p.createdAt && (Date.now() - new Date(p.createdAt).getTime()) < 30 * 86400000
    if (filter === 'nouveau')  return sCount === 0 || isRecent
    if (filter === 'en_cours') return sCount > 0 && (p.nbSeancesPrescrites ? sCount < p.nbSeancesPrescrites : true)
    if (filter === 'termine')  return p.nbSeancesPrescrites && sCount >= p.nbSeancesPrescrites
    return true
  })
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

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
        {/* ── MOBILE: sticky search + filter chips + count ───────── */}
        <div className="mobile-only" style={{
          position: 'sticky', top: 56, zIndex: 20,
          background: '#F8FAFC',
          margin: '-16px -16px 4px',
          padding: '10px 16px 4px',
        }}>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{
                width: '100%', paddingLeft: 36, paddingRight: search ? 36 : 14,
                paddingTop: 11, paddingBottom: 11,
                background: '#F1F5F9', border: '1px solid #E2E8F0',
                borderRadius: 12, fontSize: 16, outline: 'none',
                color: '#0F172A', boxSizing: 'border-box',
              }}
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }}
                aria-label="Effacer"
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  width: 26, height: 26, borderRadius: '50%',
                  background: '#CBD5E1', color: 'white', border: 'none',
                  fontSize: 14, lineHeight: 1, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
            )}
          </div>

          {/* Filter chips — horizontal scroll */}
          <div className="fchips" style={{ padding: 0, margin: 0 }}>
            {([
              ['all',      'Tous'],
              ['actif',    'Actif'],
              ['nouveau',  'Nouveau'],
              ['en_cours', 'En cours'],
              ['termine',  'Terminé'],
            ] as const).map(([key, label]) => (
              <button key={key}
                onClick={() => { setFilter(key as any); setPage(1) }}
                className={`fchip${filter === key ? ' active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: '#64748B', padding: '6px 0 0', fontWeight: 600 }}>
            {filtered.length} {filtered.length > 1 ? 'patients' : 'patient'}
            {filter !== 'all' && <span style={{ color: '#94A3B8' }}> · filtre : {filter}</span>}
          </div>
        </div>

        {/* ── MOBILE: card list ─────────────────────────────────── */}
        <div className="mobile-only mlist">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Chargement…</div>
          ) : paginated.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Aucun patient trouvé</div>
          ) : paginated.map((p: any) => {
            const waPhone = p.telephone ? p.telephone.replace(/[\s\-\+]/g, '').replace(/^0/, '212') : null
            const av = getAvatarColor(p.nom || p.prenom || '?')
            const seancesCount = p.seances?.length ?? 0
            const lastVisit = p.rendezVous?.[0]?.date
            return (
              <a key={p.id} href={`/patients/${p.id}`} className="mcard" style={{ paddingBottom: 12 }}>
                {/* Row 1: avatar + name/meta + status + chevron */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: av.bg, color: av.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14, flexShrink: 0,
                  }}>
                    {p.prenom?.[0]}{p.nom?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.prenom} {p.nom}
                    </div>
                    {p.telephone && (
                      <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        📞 {p.telephone}
                      </div>
                    )}
                    {p.pathologie && (
                      <div style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {p.pathologie}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '3px 9px', borderRadius: 999,
                    background: p.actif ? '#DCFCE7' : '#F1F5F9',
                    color:      p.actif ? '#15803D' : '#64748B',
                    flexShrink: 0,
                  }}>
                    {p.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                {/* Footer: séances count + last visit */}
                {(seancesCount > 0 || lastVisit) && (
                  <div style={{
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: 8, marginTop: 10,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 11, color: '#94A3B8',
                  }}>
                    <span>{seancesCount} séance{seancesCount > 1 ? 's' : ''}</span>
                    {lastVisit && <span>Dernière visite : {formatDate(lastVisit)}</span>}
                  </div>
                )}

                {/* Inline action row */}
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {waPhone && (
                    <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="mcard-btn success">
                      💬 WhatsApp
                    </a>
                  )}
                  <button onClick={e => { e.preventDefault(); e.stopPropagation(); openQr(e, p.id, `${p.prenom} ${p.nom}`) }} className="mcard-btn">
                    <QrCode size={13} /> QR
                  </button>
                </div>
              </a>
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
