import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatTime } from '@/lib/utils'
import MobileTopbar from '@/components/mobile/MobileTopbar'

export default async function MobileAgendaPage() {
  const session = await auth()
  if (!session?.user?.cabinetId) redirect('/login')
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
  const end   = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6, 23, 59, 59)

  const rdvs = await prisma.rendezVous.findMany({
    where: { cabinetId: session.user.cabinetId, date: { gte: start, lte: end } },
    include: { patient: { select: { nom: true, prenom: true } }, praticien: { select: { nom: true, prenom: true, couleur: true } } },
    orderBy: { date: 'asc' },
  })

  const byDay: Record<string, typeof rdvs> = {}
  rdvs.forEach(r => {
    const k = r.date.toISOString().slice(0, 10)
    if (!byDay[k]) byDay[k] = []
    byDay[k].push(r)
  })
  const sortedDays = Object.keys(byDay).sort()

  return (
    <div>
      <MobileTopbar title="Agenda" subtitle="7 prochains jours" />
      <div style={{ padding: '12px 16px' }}>
        {sortedDays.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0', padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
            Aucun rendez-vous prévu
          </div>
        ) : sortedDays.map(day => (
          <div key={day} style={{ marginBottom: 16 }}>
            <h3 style={{
              fontSize: 12, fontWeight: 600, color: '#64748B',
              textTransform: 'uppercase', letterSpacing: 0.5,
              margin: '0 0 8px',
            }}>
              {new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {byDay[day].map(rdv => (
                <div key={rdv.id} style={{
                  background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0',
                  padding: 12, display: 'flex', alignItems: 'center', gap: 12,
                  borderLeft: `4px solid ${rdv.praticien.couleur}`, minWidth: 0,
                }}>
                  <div style={{
                    background: '#DBEAFE', color: '#1D4ED8',
                    fontSize: 12, fontWeight: 600,
                    padding: '6px 10px', borderRadius: 8,
                    minWidth: 52, textAlign: 'center', flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}>
                    {formatTime(rdv.date)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rdv.patient.prenom} {rdv.patient.nom}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {rdv.typeSeance} · {rdv.duree} min · Dr. {rdv.praticien.nom}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* FAB retiré — mode lecture seule mobile */}
    </div>
  )
}
