import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SubscriptionPanel from './SubscriptionPanel'

export const dynamic = 'force-dynamic'

export default async function CabinetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [cabinet, seancesCount, facturesCount] = await Promise.all([
    prisma.cabinet.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, nom: true, prenom: true, email: true, createdAt: true, lastLoginAt: true } },
        users: { select: { id: true, nom: true, prenom: true, email: true, role: true, isActive: true, lastLoginAt: true } },
        _count: { select: { patients: true, praticiens: true } },
      },
    }),
    prisma.seance.count({ where: { cabinetId: id } }),
    prisma.facture.count({ where: { cabinetId: id } }),
  ])

  if (!cabinet) notFound()

  return (
    <div style={{ padding: '32px 28px' }}>
      <Link href="/super-admin/cabinets" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        ← Tous les cabinets
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>{cabinet.nom}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {cabinet.ville     && <span style={{ fontSize: 13, color: '#64748B' }}>📍 {cabinet.ville}</span>}
          {cabinet.telephone && <span style={{ fontSize: 13, color: '#64748B' }}>📞 {cabinet.telephone}</span>}
          {cabinet.email     && <span style={{ fontSize: 13, color: '#64748B' }}>✉️ {cabinet.email}</span>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Patients',   value: cabinet._count.patients,   icon: '👥' },
          { label: 'Séances',    value: seancesCount,               icon: '\u{1F464}' },
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
        {/* Abonnement (source de vérité : Cabinet) */}
        <SubscriptionPanel
          cabinetId={cabinet.id}
          plan={cabinet.plan}
          planStatus={cabinet.planStatus}
          trialEndsAt={cabinet.trialEndsAt ? cabinet.trialEndsAt.toISOString() : null}
          planEndsAt={cabinet.planEndsAt ? cabinet.planEndsAt.toISOString() : null}
          suspensionReason={cabinet.suspensionReason}
          suspendedAt={cabinet.suspendedAt ? cabinet.suspendedAt.toISOString() : null}
        />

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
