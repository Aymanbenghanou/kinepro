import { prisma } from '@/lib/prisma'
import DemandeActions from './DemandeActions'

export const dynamic = 'force-dynamic'

const PLAN_LABEL: Record<string, string> = { starter: 'Starter', pro: 'Pro' }
const CYCLE_LABEL: Record<string, string> = { monthly: 'Mensuel', annual: 'Annuel' }

function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const cabinetSelect = {
  select: { nom: true, ville: true, email: true, owner: { select: { email: true } } },
} as const

// Accès protégé par src/app/super-admin/layout.tsx (role SUPER_ADMIN → sinon redirect).
export default async function DemandesAbonnementPage() {
  const [demandes, confirmees] = await Promise.all([
    prisma.demandeAbonnement.findMany({
      where: { statut: 'en_attente' },
      orderBy: { createdAt: 'desc' },
      include: { cabinet: cabinetSelect },
    }),
    prisma.demandeAbonnement.findMany({
      where: { statut: 'confirmee' },
      orderBy: { confirmedAt: 'desc' },
      take: 10,
      include: { cabinet: cabinetSelect },
    }),
  ])

  const contact = (c: { email: string | null; owner: { email: string } | null } | null) =>
    c?.email ?? c?.owner?.email ?? null

  return (
    <div style={{ padding: '32px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>Demandes d&apos;abonnement</h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
          {demandes.length} demande{demandes.length > 1 ? 's' : ''} en attente de confirmation de virement
        </p>
      </div>

      {demandes.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
          Aucune demande en attente.
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Cabinet', 'Contact', 'Plan', 'Cycle', 'Montant', 'Date', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demandes.map((d, i) => (
                <tr key={d.id} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ color: '#0F172A', fontWeight: 700 }}>{d.cabinet?.nom ?? '—'}</div>
                    {d.cabinet?.ville && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{d.cabinet.ville}</div>}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>{contact(d.cabinet) ?? '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#374151', fontWeight: 600 }}>{PLAN_LABEL[d.plan] ?? d.plan}</td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>{CYCLE_LABEL[d.billingCycle] ?? d.billingCycle}</td>
                  <td style={{ padding: '14px 16px', color: '#0F172A', fontWeight: 800 }}>{fmt(d.montant)} DH</td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <DemandeActions id={d.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Historique discret des demandes confirmées récentes (lecture seule) */}
      {confirmees.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#64748B', margin: '0 0 12px' }}>
            Confirmées récemment
          </h2>
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <tbody>
                {confirmees.map((d, i) => (
                  <tr key={d.id} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none', color: '#64748B' }}>
                    <td style={{ padding: '10px 16px', color: '#0F172A', fontWeight: 600 }}>{d.cabinet?.nom ?? '—'}</td>
                    <td style={{ padding: '10px 16px' }}>{PLAN_LABEL[d.plan] ?? d.plan} · {CYCLE_LABEL[d.billingCycle] ?? d.billingCycle}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{fmt(d.montant)} DH</td>
                    <td style={{ padding: '10px 16px' }}>
                      ✅ Confirmée {d.confirmedAt ? `le ${new Date(d.confirmedAt).toLocaleDateString('fr-FR')}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
