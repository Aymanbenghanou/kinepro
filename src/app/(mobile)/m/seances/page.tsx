import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatDate, formatTime } from '@/lib/utils'
import MobileTopbar from '@/components/mobile/MobileTopbar'

const STATUT: Record<string, { label: string; bg: string; color: string }> = {
  realisee: { label: 'Réalisée', bg: '#F0FDF4', color: '#15803D' },
  annulee:  { label: 'Annulée',  bg: '#FEE2E2', color: '#DC2626' },
  no_show:  { label: 'No-show',  bg: '#FEF3C7', color: '#D97706' },
}

export default async function MobileSeancesPage() {
  const session = await auth()
  if (!session?.user?.cabinetId) redirect('/login')

  const seances = await prisma.seance.findMany({
    where: { cabinetId: session.user.cabinetId },
    include: {
      patient:   { select: { nom: true, prenom: true } },
      praticien: { select: { nom: true, prenom: true } },
      seanceType:{ select: { nom: true } },
    },
    orderBy: { date: 'desc' }, take: 50,
  })

  return (
    <div>
      <MobileTopbar title="Séances" subtitle={`${seances.length} dernières séances`} />
      <div style={{ padding: '12px 16px' }}>
        {seances.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0', padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
            Aucune séance enregistrée
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {seances.map(s => {
              const st = STATUT[s.statut] ?? { label: s.statut, bg: '#F1F5F9', color: '#64748B' }
              return (
                <div key={s.id} style={{
                  background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0',
                  padding: 12, minWidth: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: '#DBEAFE', color: '#1D4ED8',
                      fontSize: 13, fontWeight: 600, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {s.patient.prenom[0]}{s.patient.nom[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.patient.prenom} {s.patient.nom}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatDate(s.date)} · {formatTime(s.date)} · {s.duree} min
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.seanceType?.nom || s.typeSeance} · Dr. {s.praticien.nom}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
                      background: st.bg, color: st.color, flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
