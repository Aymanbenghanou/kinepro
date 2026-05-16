import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CabinetActions from './CabinetActions'

export const dynamic = 'force-dynamic'

export default async function CabinetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const now = new Date()

  const [cabinet, seancesCount, facturesCount] = await Promise.all([
    prisma.cabinet.findUnique({
      where: { id },
      include: {
        subscription: true,
        owner:        { select: { id: true, nom: true, prenom: true, email: true, createdAt: true, lastLoginAt: true } },
        users:        { select: { id: true, nom: true, prenom: true, email: true, role: true, isActive: true, lastLoginAt: true } },
        _count:       { select: { patients: true, praticiens: true } },
      },
    }),
    prisma.seance.count({ where: { cabinetId: id } }),
    prisma.facture.count({ where: { cabinetId: id } }),
  ])

  if (!cabinet) notFound()

  const sub = cabinet.subscription
  function planLabel() {
    if (!sub) return 'Aucun abonnement'
    if (sub.plan === 'ACTIVE') return 'Actif — payant'
    if (sub.plan === 'SUSPENDED') return 'Suspendu'
    const expired = sub.trialEndsAt < now
    if (expired) {
      const days = Math.ceil((now.getTime() - sub.trialEndsAt.getTime()) / (1000 * 60 * 60 * 24))
      return `Essai expiré (il y a ${days}j)`
    }
    const days = Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return `Essai gratuit — ${days}j restants`
  }

  function planBadgeColor() {
    if (!sub) return { bg: '#F1F5F9', color: '#64748B' }
    if (sub.plan === 'ACTIVE') return { bg: '#DCFCE7', color: '#166534' }
    if (sub.plan === 'SUSPENDED') return { bg: '#FEE2E2', color: '#991B1B' }
    return sub.trialEndsAt < now
      ? { bg: '#FEF3C7', color: '#92400E' }
      : { bg: '#DBEAFE', color: '#1D4ED8' }
  }

  const badgeStyle = planBadgeColor()

  return (
    <div style={{ padding: '32px 28px' }}>
      {/* Back */}
      <Link href="/super-admin/cabinets" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        ← Tous les cabinets
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>{cabinet.nom}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {cabinet.ville     && <span style={{ fontSize: 13, color: '#64748B' }}>📍 {cabinet.ville}</span>}
            {cabinet.telephone && <span style={{ fontSize: 13, color: '#64748B' }}>📞 {cabinet.telephone}</span>}
            {cabinet.email     && <span style={{ fontSize: 13, color: '#64748B' }}>✉️ {cabinet.email}</span>}
          </div>
        </div>
        <CabinetActions cabinetId={id} currentPlan={sub?.plan ?? 'TRIAL'} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Patients',   value: cabinet._count.patients,   icon: '👥' },
          { label: 'Séances',    value: seancesCount,               icon: '🩺' },
          { label: 'Factures',   value: facturesCount,              icon: '💰' },
          { label: 'Praticiens', value: cabinet._count.praticiens,  icon: '👨‍⚕️' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Abonnement */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Abonnement</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 13, background: badgeStyle.bg, color: badgeStyle.color, padding: '4px 12px', borderRadius: 99, fontWeight: 700 }}>
              {planLabel()}
            </span>
          </div>
          {sub && (
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', fontSize: 13 }}>
              <span style={{ color: '#64748B' }}>Plan</span>
              <span style={{ fontWeight: 600 }}>{sub.plan}</span>
              <span style={{ color: '#64748B' }}>Fin essai</span>
              <span>{new Date(sub.trialEndsAt).toLocaleDateString('fr-FR')}</span>
              {sub.currentPeriodEnd && <>
                <span style={{ color: '#64748B' }}>Fin période</span>
                <span>{new Date(sub.currentPeriodEnd).toLocaleDateString('fr-FR')}</span>
              </>}
              {sub.price && <>
                <span style={{ color: '#64748B' }}>Prix</span>
                <span>{sub.price} {sub.currency}</span>
              </>}
            </div>
          )}
        </div>

        {/* Propriétaire */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Propriétaire</h2>
          {cabinet.owner ? (
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 12px', fontSize: 13 }}>
              <span style={{ color: '#64748B' }}>Nom</span>
              <span style={{ fontWeight: 600 }}>{cabinet.owner.prenom} {cabinet.owner.nom}</span>
              <span style={{ color: '#64748B' }}>Email</span>
              <span>{cabinet.owner.email}</span>
              <span style={{ color: '#64748B' }}>Inscrit le</span>
              <span>{new Date(cabinet.owner.createdAt).toLocaleDateString('fr-FR')}</span>
              <span style={{ color: '#64748B' }}>Dernière co.</span>
              <span>{cabinet.owner.lastLoginAt ? new Date(cabinet.owner.lastLoginAt).toLocaleDateString('fr-FR') : '—'}</span>
            </div>
          ) : (
            <p style={{ color: '#94A3B8', fontSize: 13 }}>Aucun propriétaire associé</p>
          )}
        </div>
      </div>

      {/* Users */}
      {cabinet.users.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', marginTop: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>
            Utilisateurs ({cabinet.users.length})
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                {['Nom', 'Email', 'Rôle', 'Actif', 'Dernière connexion'].map(h => (
                  <th key={h} style={{ padding: '8px 0', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cabinet.users.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid #F8FAFC' }}>
                  <td style={{ padding: '10px 0', fontWeight: 500 }}>{u.prenom} {u.nom}</td>
                  <td style={{ padding: '10px 0', color: '#64748B' }}>{u.email}</td>
                  <td style={{ padding: '10px 0' }}>
                    <span style={{ fontSize: 11, background: u.role === 'CABINET_OWNER' ? '#EFF6FF' : '#F8FAFC', color: u.role === 'CABINET_OWNER' ? '#1D4ED8' : '#475569', padding: '2px 8px', borderRadius: 99 }}>
                      {u.role === 'CABINET_OWNER' ? 'Propriétaire' : 'Employé'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 0' }}>
                    <span style={{ color: u.isActive ? '#16A34A' : '#DC2626', fontWeight: 600, fontSize: 12 }}>
                      {u.isActive ? '✓' : '✗'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 0', color: '#64748B' }}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
