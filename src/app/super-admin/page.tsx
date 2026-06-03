import { prisma } from '@/lib/prisma'
import { CabinetPlanStatus } from '@prisma/client'
import type { CabinetPlan } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function SuperAdminDashboard() {
  const now = new Date()

  // Source de vérité unique : Cabinet.planStatus (AGENTS.md §7).
  // « Actifs » = planStatus=active. « En essai » = trialing + trialEndsAt futur.
  // « Expirés/Suspendus » = suspended OU trial expiré.
  const [
    totalCabinets,
    activeCabinets,
    trialCabinets,
    suspendedCabinets,
    trialExpiredCabinets,
    totalUsers,
    recentCabinets,
  ] = await Promise.all([
    prisma.cabinet.count(),
    prisma.cabinet.count({ where: { planStatus: CabinetPlanStatus.active } }),
    prisma.cabinet.count({
      where: { planStatus: CabinetPlanStatus.trialing, trialEndsAt: { gte: now } },
    }),
    prisma.cabinet.count({ where: { planStatus: CabinetPlanStatus.suspended } }),
    prisma.cabinet.count({
      where: { planStatus: CabinetPlanStatus.trialing, trialEndsAt: { lt: now } },
    }),
    prisma.user.count(),
    prisma.cabinet.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true, nom: true, ville: true, createdAt: true,
        plan: true, planStatus: true, trialEndsAt: true,
        _count: { select: { patients: true, users: true, praticiens: true } },
      },
    }),
  ])

  const stats = [
    { label: 'Total cabinets',      value: totalCabinets,                            icon: '🏥', color: '#2563EB' },
    { label: 'Abonnés actifs',      value: activeCabinets,                           icon: '✅', color: '#16A34A' },
    { label: 'En période d\'essai', value: trialCabinets,                            icon: '⏳', color: '#D97706' },
    { label: 'Expirés / Suspendus', value: trialExpiredCabinets + suspendedCabinets, icon: '⚠️', color: '#DC2626' },
    { label: 'Utilisateurs total',  value: totalUsers,                               icon: '👥', color: '#7C3AED' },
  ]

  function planBadge(c: { plan: CabinetPlan; planStatus: CabinetPlanStatus; trialEndsAt: Date | null }) {
    if (c.planStatus === CabinetPlanStatus.suspended)
      return <span style={{ fontSize: 11, background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Suspendu</span>
    if (c.planStatus === CabinetPlanStatus.active)
      return <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Actif</span>
    if (c.planStatus === CabinetPlanStatus.expired)
      return <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Expiré</span>
    // trialing
    if (c.trialEndsAt && c.trialEndsAt < now)
      return <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Essai expiré</span>
    if (c.trialEndsAt) {
      const days = Math.ceil((c.trialEndsAt.getTime() - now.getTime()) / 86_400_000)
      return <span style={{ fontSize: 11, background: '#DBEAFE', color: '#1D4ED8', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Essai ({days}j)</span>
    }
    return <span style={{ fontSize: 11, background: '#F1F5F9', color: '#64748B', padding: '2px 8px', borderRadius: 99 }}>—</span>
  }

  return (
    <div style={{ padding: '32px 28px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>Vue d'ensemble</h1>
      <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 32px' }}>
        {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 14, padding: '20px',
            border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent cabinets */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Derniers cabinets inscrits</h2>
          <a href="/super-admin/cabinets" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>Voir tous →</a>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Cabinet', 'Ville', 'Statut', 'Patients', 'Utilisateurs', 'Inscrit le'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentCabinets.map((cab, i) => (
              <tr key={cab.id} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                <td style={{ padding: '12px 16px' }}>
                  <a href={`/super-admin/cabinets/${cab.id}`} style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
                    {cab.nom}
                  </a>
                </td>
                <td style={{ padding: '12px 16px', color: '#374151' }}>{cab.ville || '—'}</td>
                <td style={{ padding: '12px 16px' }}>{planBadge(cab)}</td>
                <td style={{ padding: '12px 16px', color: '#374151', textAlign: 'center' }}>{cab._count.patients}</td>
                <td style={{ padding: '12px 16px', color: '#374151', textAlign: 'center' }}>{cab._count.users}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>
                  {new Date(cab.createdAt).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
