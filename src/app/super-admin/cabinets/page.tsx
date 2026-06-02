import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { CabinetPlan, CabinetPlanStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function CabinetsPage() {
  const now = new Date()
  const cabinets = await prisma.cabinet.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner:  { select: { nom: true, prenom: true, email: true } },
      _count: { select: { patients: true, users: true, praticiens: true } },
    },
  })

  function planBadge(c: { plan: CabinetPlan; planStatus: CabinetPlanStatus; trialEndsAt: Date | null; planEndsAt: Date | null }) {
    if (c.planStatus === 'suspended') return { label: 'Suspendu',   bg: '#FEE2E2', color: '#991B1B' }
    if (c.planStatus === 'active') {
      if (c.planEndsAt && c.planEndsAt < now) return { label: 'Expiré',         bg: '#FEF3C7', color: '#92400E' }
      const planTxt = c.plan === 'starter' ? 'Starter' : c.plan === 'pro' ? 'Pro' : 'Actif'
      return { label: planTxt, bg: '#DCFCE7', color: '#166534' }
    }
    if (c.planStatus === 'expired') return { label: 'Expiré',       bg: '#FEF3C7', color: '#92400E' }
    // trialing
    if (c.trialEndsAt && c.trialEndsAt > now) {
      const days = Math.ceil((c.trialEndsAt.getTime() - now.getTime()) / 86_400_000)
      return { label: `Essai (${days}j)`, bg: '#DBEAFE', color: '#1D4ED8' }
    }
    return { label: 'Essai expiré', bg: '#FEF3C7', color: '#92400E' }
  }

  return (
    <div style={{ padding: '32px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>Cabinets</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>{cabinets.length} cabinet{cabinets.length > 1 ? 's' : ''} enregistré{cabinets.length > 1 ? 's' : ''}</p>
        </div>
        <Link href="/super-admin/cabinets/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#2563EB', color: 'white', textDecoration: 'none',
            padding: '10px 16px', borderRadius: 10, fontWeight: 700, fontSize: 14,
          }}>
          + Nouveau cabinet
        </Link>
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['Cabinet', 'Propriétaire', 'Statut', 'Patients', 'Kiné', 'Inscrit le', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cabinets.map((cab, i) => {
              const badge = planBadge(cab)
              return (
                <tr key={cab.id} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <Link href={`/super-admin/cabinets/${cab.id}`} style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>
                      {cab.nom}
                    </Link>
                    {cab.ville && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{cab.ville}</div>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {cab.owner ? (
                      <div>
                        <div style={{ color: '#0F172A', fontWeight: 500 }}>{cab.owner.prenom} {cab.owner.nom}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{cab.owner.email}</div>
                      </div>
                    ) : <span style={{ color: '#94A3B8' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 12, background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#374151', textAlign: 'center', fontWeight: 600 }}>{cab._count.patients}</td>
                  <td style={{ padding: '14px 16px', color: '#374151', textAlign: 'center' }}>{cab._count.praticiens}</td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>
                    {new Date(cab.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Link href={`/super-admin/cabinets/${cab.id}`} style={{
                      fontSize: 12, color: '#2563EB', fontWeight: 600,
                      textDecoration: 'none', padding: '4px 10px',
                      border: '1px solid #BFDBFE', borderRadius: 6, whiteSpace: 'nowrap',
                    }}>
                      Voir →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
