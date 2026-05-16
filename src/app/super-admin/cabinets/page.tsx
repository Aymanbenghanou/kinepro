import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CabinetsPage() {
  const now = new Date()
  const cabinets = await prisma.cabinet.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: true,
      owner:        { select: { nom: true, prenom: true, email: true } },
      _count:       { select: { patients: true, users: true, praticiens: true } },
    },
  })

  function planBadge(sub: { plan: string; trialEndsAt: Date } | null) {
    if (!sub) return { label: 'Aucun', bg: '#F1F5F9', color: '#64748B' }
    if (sub.plan === 'ACTIVE')    return { label: 'Actif',         bg: '#DCFCE7', color: '#166534' }
    if (sub.plan === 'SUSPENDED') return { label: 'Suspendu',      bg: '#FEE2E2', color: '#991B1B' }
    const expired = sub.trialEndsAt < now
    if (expired) {
      const days = Math.ceil((now.getTime() - sub.trialEndsAt.getTime()) / (1000 * 60 * 60 * 24))
      return { label: `Expiré (${days}j)`, bg: '#FEF3C7', color: '#92400E' }
    }
    const days = Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { label: `Essai (${days}j)`, bg: '#DBEAFE', color: '#1D4ED8' }
  }

  return (
    <div style={{ padding: '32px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>Cabinets</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>{cabinets.length} cabinet{cabinets.length > 1 ? 's' : ''} enregistré{cabinets.length > 1 ? 's' : ''}</p>
        </div>
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
              const badge = planBadge(cab.subscription)
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
