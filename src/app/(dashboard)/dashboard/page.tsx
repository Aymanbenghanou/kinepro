import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import { formatMoney, formatTime } from '@/lib/utils'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import FeedbackWidget from '@/components/dashboard/FeedbackWidget'
import { Calendar, Users, DollarSign, AlertCircle } from 'lucide-react'

function StatCard({ title, value, icon: Icon, color, bgColor }: {
  title: string
  value: string | number
  icon: React.ComponentType<{ size?: number; color?: string }>
  color: string
  bgColor: string
}) {
  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#64748B', fontSize: 14, fontWeight: 500, margin: 0 }}>{title}</p>
          <p style={{ color: '#0F172A', fontSize: 28, fontWeight: 700, margin: '4px 0 0' }}>{value}</p>
        </div>
        <div style={{ background: bgColor, borderRadius: 12, padding: 12 }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ statut }: { statut: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    paye:       { label: 'Payé',       bg: '#DCFCE7', color: '#16A34A' },
    en_attente: { label: 'En attente', bg: '#FEF3C7', color: '#D97706' },
    en_retard:  { label: 'En retard',  bg: '#FEE2E2', color: '#DC2626' },
    confirme:   { label: 'Confirmé',   bg: '#DBEAFE', color: '#2563EB' },
    realisee:   { label: 'Réalisée',   bg: '#DCFCE7', color: '#16A34A' },
    annulee:    { label: 'Annulée',    bg: '#FEE2E2', color: '#DC2626' },
  }
  const s = map[statut] || { label: statut, bg: '#F1F5F9', color: '#64748B' }
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>
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
    prisma.patient.count({ where: { cabinetId, actif: true } }),
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
      where: { cabinetId },
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

  const greetingDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const userPrenom   = session.user.prenom ?? ''

  return (
    <div>
      <Topbar title="Tableau de bord" subtitle="Vue d'ensemble du cabinet" />
      <div style={{ padding: 24 }}>

        {/* ── MOBILE-ONLY greeting ── */}
        <div className="mobile-only" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
            Bonjour{userPrenom ? `, Dr. ${userPrenom}` : ''} 👋
          </div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, textTransform: 'capitalize' }}>{greetingDate}</div>
        </div>

        {/* ── MOBILE-ONLY horizontal stats row ── */}
        <div className="mobile-only">
          <div className="h-scroll" style={{ marginBottom: 4 }}>
            <MobileStat icon="📅" value={String(rdvAujourdHui)}                                    label="RDV aujourd'hui" color="#2563EB" />
            <MobileStat icon="👥" value={String(patientsActifs)}                                   label="Patients actifs" color="#16A34A" />
            <MobileStat icon="💰" value={formatMoney(revenusMonth._sum.montant ?? 0)}              label="Ce mois"         color="#F59E0B" />
            <MobileStat icon="⚠️" value={resteAEncaisser > 0 ? formatMoney(resteAEncaisser) : '0'} label={resteAEncaisser > 0 ? `Reste à encaisser (${nbFacturesImpayees})` : 'Tout est payé'} color={resteAEncaisser > 0 ? '#DC2626' : '#16A34A'} href="/facturation?statut=en_attente" />
          </div>
        </div>

        {/* ── MOBILE-ONLY quick actions 2×2 ── */}
        <div className="mobile-only" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <MobileAction href="/agenda"     emoji="➕" label="Nouveau RDV"     bg="#EFF6FF" color="#2563EB" />
          <MobileAction href="/patients"   emoji="👤" label="Nouveau patient" bg="#F0FDF4" color="#16A34A" />
          <MobileAction href="/whatsapp"   emoji="💬" label="WhatsApp"        bg="#ECFDF5" color="#059669" />
          <MobileAction href="/rapports"   emoji="📊" label="Rapports"        bg="#FEF3C7" color="#D97706" />
        </div>

        {/* ── DESKTOP stats grid (hidden on mobile) ── */}
        <div className="stats-grid-4 desktop-only" style={{ marginBottom: 24 }}>
          <StatCard title="RDV aujourd'hui"   value={rdvAujourdHui}                         icon={Calendar}    color="#2563EB" bgColor="#DBEAFE" />
          <StatCard title="Patients actifs"    value={patientsActifs}                         icon={Users}       color="#16A34A" bgColor="#DCFCE7" />
          <StatCard title="Revenus du mois"    value={formatMoney(revenusMonth._sum.montant ?? 0)} icon={DollarSign} color="#F59E0B" bgColor="#FEF3C7" />
          <Link href="/facturation?statut=en_attente" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <StatCard
              title={resteAEncaisser > 0 ? `Reste à encaisser (${nbFacturesImpayees})` : 'Factures impayées'}
              value={resteAEncaisser > 0 ? formatMoney(resteAEncaisser) : nbFacturesImpayees}
              icon={AlertCircle}
              color={resteAEncaisser > 0 ? '#DC2626' : '#16A34A'}
              bgColor={resteAEncaisser > 0 ? '#FEE2E2' : '#DCFCE7'}
            />
          </Link>
        </div>

        {/* Row 2 */}
        <div className="dashboard-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Agenda du jour */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>📅 Agenda du jour</h2>
            {rdvDuJour.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: 14 }}>Aucun rendez-vous aujourd'hui</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rdvDuJour.map((rdv) => (
                  <div key={rdv.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', background: '#F8FAFC',
                    borderRadius: 8, borderLeft: `3px solid ${rdv.praticien.couleur}`,
                  }}>
                    <div style={{ minWidth: 52 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>
                        {formatTime(rdv.date)}
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>
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
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>📊 Séances cette semaine</h2>
            <DashboardCharts seancesParJour={seancesParJour} />
          </div>
        </div>

        {/* Row 3 — Feedback widget full-width */}
        <div style={{ marginBottom: 16 }}>
          <FeedbackWidget />
        </div>

        {/* Row 4 */}
        <div className="dashboard-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

          {/* Patients récents */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>👥 Patients récents</h2>
            {patientsRecents.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13 }}>Aucun patient</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {patientsRecents.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>{p.prenom} {p.nom}</p>
                      <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{p.pathologie || 'N/A'}</p>
                    </div>
                    <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500 }}>
                      {p.seances.length} séances
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Facturation récente */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>💳 Facturation récente</h2>
            {facturesRecentes.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13 }}>Aucune facture</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {facturesRecentes.map((f) => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>{f.patient.prenom} {f.patient.nom}</p>
                      <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{formatMoney(f.montant)}</p>
                    </div>
                    <StatusBadge statut={f.statut} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personnel */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>👨‍⚕️ Personnel</h2>
            {praticiens.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 13 }}>Aucun praticien</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {praticiens.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: p.couleur, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700,
                      }}>
                        {p.prenom[0]}{p.nom[0]}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>{p.prenom} {p.nom}</p>
                        <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{p.specialite}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', margin: 0 }}>{p.rendezVous.length}</p>
                      <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>RDV</p>
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

// ─── Mobile-only helpers ─────────────────────────────────────────────────────

function MobileStat({ icon, value, label, color, href }: {
  icon: string; value: string; label: string; color: string; href?: string
}) {
  const inner = (
    <div style={{
      width: 150, padding: 14,
      background: 'white', border: '1px solid #E2E8F0',
      borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.25 }}>{label}</div>
    </div>
  )
  if (href) return <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link>
  return inner
}

function MobileAction({ href, emoji, label, bg, color }: {
  href: string; emoji: string; label: string; bg: string; color: string
}) {
  return (
    <Link href={href} style={{
      background: bg, color,
      padding: '14px 12px', borderRadius: 14,
      textDecoration: 'none', display: 'flex', flexDirection: 'column',
      gap: 6, alignItems: 'flex-start', minHeight: 80,
      border: '1px solid ' + color + '20',
    }}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.25 }}>{label}</span>
    </Link>
  )
}
