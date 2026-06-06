import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import { formatMoney, formatTime } from '@/lib/utils'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import FeedbackWidget from '@/components/dashboard/FeedbackWidget'
import { Calendar, Users, DollarSign, AlertCircle } from 'lucide-react'

type StatVariant = 'blue' | 'green' | 'amber' | 'rose'

function StatCard({ title, value, icon: Icon, color, bgColor, variant, delay }: {
  title: string
  value: string | number
  icon: React.ComponentType<{ size?: number; color?: string }>
  color: string
  bgColor: string
  variant: StatVariant
  delay: number
}) {
  return (
    <div
      className={`dash-card dash-card-${variant} dash-enter`}
      style={{ padding: 22, animationDelay: `${delay}ms` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <p className="dash-stat__label">{title}</p>
          <p className="dash-stat__value">{value}</p>
        </div>
        <div className="dash-stat__icon" style={{ background: bgColor }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    paye:       { label: 'Payé',       bg: '#DCFCE7', color: '#15803D', dot: '#16A34A' },
    en_attente: { label: 'En attente', bg: '#FEF3C7', color: '#A16207', dot: '#D97706' },
    en_retard:  { label: 'En retard',  bg: '#FEE2E2', color: '#B91C1C', dot: '#DC2626' },
    confirme:   { label: 'Confirmé',   bg: '#DBEAFE', color: '#1D4ED8', dot: '#2563EB' },
    realisee:   { label: 'Réalisée',   bg: '#DCFCE7', color: '#15803D', dot: '#16A34A' },
    annulee:    { label: 'Annulée',    bg: '#FEE2E2', color: '#B91C1C', dot: '#DC2626' },
  }
  const s = map[statut] || { label: statut, bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' }
  return (
    <span className="dash-pill" style={{ background: s.bg, color: s.color }}>
      <span className="dash-pill__dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.cabinetId) redirect('/login')
  const cabinetId = session.user.cabinetId

  const now        = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(),  0,  0,  0)
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const weekStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1)
  const weekEnd    = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7, 23, 59, 59)

  const [
    rdvAujourdHui,
    patientsActifs,
    revenusMonth,
    facturesImpayees,
    rdvDuJour,
    patientsRecents,
    seancesSemaine,
    facturesRecentes,
    praticiens,
  ] = await Promise.all([
    prisma.rendezVous.count({
      where: { cabinetId, date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.patient.count({ where: { cabinetId, actif: true, deletedAt: null } }),
    prisma.facture.aggregate({
      where: { cabinetId, statut: 'paye', dateEmise: { gte: monthStart, lte: monthEnd } },
      _sum: { montant: true },
    }),
    prisma.facture.findMany({
      where: { cabinetId, statut: { in: ['en_attente', 'en_retard', 'partielle'] } },
      select: { montant: true, montantPaye: true },
    }),
    prisma.rendezVous.findMany({
      where: { cabinetId, date: { gte: todayStart, lte: todayEnd } },
      include: {
        patient:   { select: { nom: true, prenom: true } },
        praticien: { select: { nom: true, prenom: true, couleur: true } },
      },
      orderBy: { date: 'asc' },
      take: 10,
    }),
    prisma.patient.findMany({
      where: { cabinetId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { seances: { select: { id: true }, where: { statut: 'realisee' } } },
    }),
    prisma.seance.findMany({
      where: { cabinetId, date: { gte: weekStart, lte: weekEnd }, statut: 'realisee' },
      select: { date: true },
    }),
    prisma.facture.findMany({
      where: { cabinetId },
      take: 5,
      orderBy: { dateEmise: 'desc' },
      include: { patient: { select: { nom: true, prenom: true } } },
    }),
    prisma.praticien.findMany({
      where: { cabinetId, actif: true },
      include: {
        rendezVous: {
          where: { date: { gte: todayStart, lte: todayEnd } },
          select: { id: true },
        },
      },
    }),
  ])

  // Séances par jour de la semaine
  const joursLabels  = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const joursDisplay = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const joursMap: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0, Sam: 0, Dim: 0 }
  seancesSemaine.forEach(s => {
    const label = joursLabels[new Date(s.date).getDay()]
    joursMap[label] = (joursMap[label] || 0) + 1
  })
  const seancesParJour = joursDisplay.map(j => ({ jour: j, count: joursMap[j] || 0 }))

  // Reste à encaisser : SUM(montant - montantPaye) sur toutes les factures non payées
  const resteAEncaisser = facturesImpayees.reduce(
    (s: number, f: { montant: number; montantPaye: number }) => s + Math.max(0, f.montant - (f.montantPaye ?? 0)),
    0,
  )
  const nbFacturesImpayees = facturesImpayees.length

  return (
    <div className="dash-canvas">
      <Topbar title="Tableau de bord" subtitle="Vue d'ensemble du cabinet" />
      <div style={{ padding: 24 }}>

        {/* Stats Cards */}
        <div className="stats-grid-4" style={{ marginBottom: 24 }}>
          <StatCard title="RDV aujourd'hui"   value={rdvAujourdHui}                              icon={Calendar}    color="#2563EB" bgColor="#DBEAFE" variant="blue"  delay={0} />
          <StatCard title="Patients actifs"    value={patientsActifs}                             icon={Users}       color="#16A34A" bgColor="#DCFCE7" variant="green" delay={60} />
          <StatCard title="Revenus du mois"    value={formatMoney(revenusMonth._sum.montant ?? 0)} icon={DollarSign} color="#D97706" bgColor="#FEF3C7" variant="amber" delay={120} />
          <Link href="/facturation?statut=en_attente" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <StatCard
              title={resteAEncaisser > 0 ? `Reste à encaisser (${nbFacturesImpayees})` : 'Factures impayées'}
              value={resteAEncaisser > 0 ? formatMoney(resteAEncaisser) : nbFacturesImpayees}
              icon={AlertCircle}
              color={resteAEncaisser > 0 ? '#DC2626' : '#16A34A'}
              bgColor={resteAEncaisser > 0 ? '#FEE2E2' : '#DCFCE7'}
              variant={resteAEncaisser > 0 ? 'rose' : 'green'}
              delay={180}
            />
          </Link>
        </div>

        {/* Row 2 */}
        <div className="dashboard-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Agenda du jour */}
          <div className="dash-card dash-card-blue dash-enter" style={{ padding: 22, animationDelay: '240ms' }}>
            <div className="dash-card__head">
              <h2 className="dash-card__title">
                <span className="dash-card__title-emoji" aria-hidden>📅</span>
                Agenda du jour
              </h2>
              <Link href="/agenda" className="dash-link">
                Tout voir <span className="dash-link__arrow">→</span>
              </Link>
            </div>
            {rdvDuJour.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>Aucun rendez-vous aujourd'hui</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rdvDuJour.map((rdv) => (
                  <div key={rdv.id} className="dash-row" style={{
                    background: '#F8FAFC',
                    borderLeft: `3px solid ${rdv.praticien.couleur}`,
                  }}>
                    <div style={{ minWidth: 52 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {formatTime(rdv.date)}
                      </p>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rdv.patient.prenom} {rdv.patient.nom}
                      </p>
                      <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                        {rdv.typeSeance} · {rdv.duree} min
                      </p>
                    </div>
                    <StatusBadge statut={rdv.statut} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Graphique */}
          <div className="dash-card dash-card-violet dash-enter" style={{ padding: 22, animationDelay: '300ms' }}>
            <div className="dash-card__head">
              <h2 className="dash-card__title">
                <span className="dash-card__title-emoji" aria-hidden>📊</span>
                Séances cette semaine
              </h2>
            </div>
            <DashboardCharts seancesParJour={seancesParJour} />
          </div>
        </div>

        {/* Row 3 — Feedback widget full-width */}
        <div style={{ marginBottom: 16 }} className="dash-enter" data-anim-delay="360">
          <FeedbackWidget />
        </div>

        {/* Row 4 */}
        <div className="dashboard-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

          {/* Patients récents */}
          <div className="dash-card dash-card-green dash-enter" style={{ padding: 22, animationDelay: '420ms' }}>
            <div className="dash-card__head">
              <h2 className="dash-card__title">
                <span className="dash-card__title-emoji" aria-hidden>👥</span>
                Patients récents
              </h2>
              <Link href="/patients" className="dash-link">
                Tout voir <span className="dash-link__arrow">→</span>
              </Link>
            </div>
            {patientsRecents.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>Aucun patient</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {patientsRecents.map((p) => (
                  <div key={p.id} className="dash-row" style={{ justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.prenom} {p.nom}
                      </p>
                      <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{p.pathologie || 'N/A'}</p>
                    </div>
                    <span className="dash-pill" style={{ background: '#DCFCE7', color: '#15803D' }}>
                      <span className="dash-pill__dot" style={{ background: '#16A34A' }} />
                      {p.seances.length} séances
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Facturation récente */}
          <div className="dash-card dash-card-amber dash-enter" style={{ padding: 22, animationDelay: '480ms' }}>
            <div className="dash-card__head">
              <h2 className="dash-card__title">
                <span className="dash-card__title-emoji" aria-hidden>💳</span>
                Facturation récente
              </h2>
              <Link href="/facturation" className="dash-link">
                Tout voir <span className="dash-link__arrow">→</span>
              </Link>
            </div>
            {facturesRecentes.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>Aucune facture</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {facturesRecentes.map((f) => (
                  <div key={f.id} className="dash-row" style={{ justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.patient.prenom} {f.patient.nom}
                      </p>
                      <p style={{ fontSize: 12, color: '#64748B', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(f.montant)}
                      </p>
                    </div>
                    <StatusBadge statut={f.statut} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personnel */}
          <div className="dash-card dash-card-slate dash-enter" style={{ padding: 22, animationDelay: '540ms' }}>
            <div className="dash-card__head">
              <h2 className="dash-card__title">
                <span className="dash-card__title-emoji" aria-hidden>🧑‍⚕️</span>
                Personnel
              </h2>
              <Link href="/personnel" className="dash-link">
                Tout voir <span className="dash-link__arrow">→</span>
              </Link>
            </div>
            {praticiens.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>Aucun praticien</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {praticiens.map((p) => (
                  <div key={p.id} className="dash-row" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div className="dash-avatar" style={{ background: p.couleur }}>
                        {p.prenom[0]}{p.nom[0]}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.prenom} {p.nom}
                        </p>
                        <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{p.specialite}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#2563EB', margin: 0, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                        {p.rendezVous.length}
                      </p>
                      <p style={{ fontSize: 10.5, color: '#94A3B8', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>RDV</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
