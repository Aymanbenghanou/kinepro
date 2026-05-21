'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, ChevronRight, X } from 'lucide-react'
import MobileTopbar from '@/components/mobile/MobileTopbar'
import { formatDate } from '@/lib/utils'

const AVATAR_COLORS = [
  { bg: '#DBEAFE', text: '#1D4ED8' },
  { bg: '#DCFCE7', text: '#15803D' },
  { bg: '#FEF3C7', text: '#B45309' },
  { bg: '#F3E8FF', text: '#7C3AED' },
  { bg: '#FFE4E6', text: '#BE123C' },
  { bg: '#E0F2FE', text: '#0369A1' },
]
const avatarColor = (n: string) => AVATAR_COLORS[(n?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]

type Filter = 'all' | 'actif' | 'nouveau' | 'en_cours' | 'termine'

export default function MobilePatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/patients?search=${encodeURIComponent(search)}`)
      const d = await r.json()
      setPatients(Array.isArray(d) ? d : [])
    } catch {}
    setLoading(false)
  }, [search])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = useMemo(() => patients.filter(p => {
    if (filter === 'all') return true
    if (filter === 'actif') return p.actif === true
    const sCount = p.seances?.length ?? 0
    const recent = p.createdAt && (Date.now() - new Date(p.createdAt).getTime()) < 30 * 86400000
    if (filter === 'nouveau')  return sCount === 0 || recent
    if (filter === 'en_cours') return sCount > 0 && (p.nbSeancesPrescrites ? sCount < p.nbSeancesPrescrites : true)
    if (filter === 'termine')  return p.nbSeancesPrescrites && sCount >= p.nbSeancesPrescrites
    return true
  }), [patients, filter])

  return (
    <div>
      <MobileTopbar title="Patients" subtitle={`${filtered.length} patients`} />

      {/* Search + filters (sticky) */}
      <div style={{ position: 'sticky', top: 56, zIndex: 20, background: '#F8FAFC', padding: '10px 16px 0' }}>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un patient..."
            style={{
              width: '100%', paddingLeft: 36, paddingRight: search ? 36 : 14,
              paddingTop: 11, paddingBottom: 11,
              background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 12,
              fontSize: 16, outline: 'none', color: '#0F172A', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Effacer"
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 26, height: 26, borderRadius: '50%',
                background: '#CBD5E1', color: 'white', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
          paddingBottom: 10,
        }}>
          {([
            ['all', 'Tous'],
            ['actif', 'Actif'],
            ['nouveau', 'Nouveau'],
            ['en_cours', 'En cours'],
            ['termine', 'Terminé'],
          ] as const).map(([key, label]) => {
            const active = filter === key
            return (
              <button key={key} onClick={() => setFilter(key)}
                style={{
                  flexShrink: 0, padding: '5px 14px', borderRadius: 20,
                  fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                  border: '0.5px solid',
                  background:    active ? '#2563EB' : 'white',
                  color:         active ? 'white'   : '#64748B',
                  borderColor:   active ? '#2563EB' : '#E2E8F0',
                  cursor: 'pointer',
                }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: '8px 16px 16px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Aucun patient</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(p => {
              const av = avatarColor(p.nom || p.prenom || '?')
              return (
                <Link key={p.id} href={`/m/patients/${p.id}`} style={{
                  background: 'white', borderRadius: 14, border: '0.5px solid #E2E8F0',
                  padding: 14, textDecoration: 'none', color: 'inherit', display: 'block',
                  minWidth: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: av.bg, color: av.text,
                      fontSize: 14, fontWeight: 500, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {p.prenom?.[0]}{p.nom?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.prenom} {p.nom}
                      </div>
                      {p.telephone && (
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>📞 {p.telephone}</div>
                      )}
                      {p.pathologie && (
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          🏥 {p.pathologie}
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
                      background: p.actif ? '#F0FDF4' : '#F1F5F9',
                      color:      p.actif ? '#15803D' : '#64748B',
                      flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      {p.actif ? 'Actif' : 'Inactif'}
                    </span>
                    <ChevronRight size={16} color="#CBD5E1" style={{ flexShrink: 0 }} />
                  </div>
                  {(p.seances?.length > 0 || p.rendezVous?.[0]) && (
                    <div style={{
                      marginTop: 10, paddingTop: 10, borderTop: '0.5px solid #F1F5F9',
                      display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8',
                    }}>
                      <span>{p.seances?.length ?? 0} séance{(p.seances?.length ?? 0) > 1 ? 's' : ''}</span>
                      {p.rendezVous?.[0] && <span>Visite : {formatDate(p.rendezVous[0].date)}</span>}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB retiré — mode lecture seule mobile */}
    </div>
  )
}
