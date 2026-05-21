import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatDate, formatMoney } from '@/lib/utils'
import MobileTopbar from '@/components/mobile/MobileTopbar'

const STATUT: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  paye:       { label: 'Payée',          bg: '#F0FDF4', color: '#15803D', icon: '✓' },
  partielle:  { label: 'Partielle',      bg: '#FFF7ED', color: '#9A3412', icon: '◐' },
  en_attente: { label: 'En attente',     bg: '#FEF3C7', color: '#92400E', icon: '⏳' },
  en_retard:  { label: 'En retard',      bg: '#FEE2E2', color: '#991B1B', icon: '⚠' },
}

export default async function MobileFacturationPage() {
  const session = await auth()
  if (!session?.user?.cabinetId) redirect('/login')

  const factures = await prisma.facture.findMany({
    where: { cabinetId: session.user.cabinetId },
    include: {
      patient: { select: { nom: true, prenom: true } },
      seance:  { include: { seanceType: { select: { nom: true } } } },
    },
    orderBy: { dateEmise: 'desc' }, take: 50,
  })

  const totalFacture  = factures.reduce((s, f) => s + f.montant, 0)
  const totalEncaisse = factures.reduce((s, f) => s + (f.montantPaye ?? 0), 0)
  const totalReste    = Math.max(0, totalFacture - totalEncaisse)

  return (
    <div>
      <MobileTopbar title="Facturation" subtitle={`${factures.length} factures`} />

      {/* Summary */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 20,
        background: 'white', border: '0.5px solid #E2E8F0',
        margin: '8px 16px 8px', borderRadius: 12, padding: '10px 12px',
        display: 'flex', gap: 14, alignItems: 'center',
        boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        <SummaryItem label="Encaissé" value={formatMoney(totalEncaisse)} color="#16A34A" />
        <div style={{ width: 1, height: 28, background: '#E2E8F0', flexShrink: 0 }} />
        <SummaryItem label="Reste"    value={formatMoney(totalReste)}    color={totalReste > 0 ? '#DC2626' : '#16A34A'} />
        <div style={{ width: 1, height: 28, background: '#E2E8F0', flexShrink: 0 }} />
        <SummaryItem label="Factures" value={String(factures.length)}    color="#0F172A" />
      </div>

      {/* List */}
      <div style={{ padding: '0 16px 16px' }}>
        {factures.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0', padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
            Aucune facture
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {factures.map(f => {
              const st = STATUT[f.statut] ?? { label: f.statut, bg: '#F1F5F9', color: '#64748B', icon: '' }
              const reste = Math.max(0, f.montant - (f.montantPaye ?? 0))
              const pct = f.montant > 0 ? Math.min(100, ((f.montantPaye ?? 0) / f.montant) * 100) : 0
              return (
                <Link key={f.id} href={`/facturation/${f.id}`} style={{
                  background: 'white', borderRadius: 12, border: '0.5px solid #E2E8F0',
                  padding: 12, textDecoration: 'none', color: 'inherit', display: 'block',
                  minWidth: 0,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.patient.prenom} {f.patient.nom}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatDate(f.dateEmise)}{f.seance?.seanceType?.nom ? ` · ${f.seance.seanceType.nom}` : ''}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
                      background: st.bg, color: st.color, flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      {st.icon} {st.label}
                    </span>
                  </div>
                  <div style={{ height: 4, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#16A34A' : '#F59E0B' }} />
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748B' }}>
                    <span><strong style={{ color: '#0F172A' }}>{formatMoney(f.montantPaye ?? 0)}</strong> / {formatMoney(f.montant)}</span>
                    {reste > 0 && <span style={{ color: '#DC2626', fontWeight: 600, whiteSpace: 'nowrap' }}>Reste : {formatMoney(reste)}</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 90, flexShrink: 0 }}>
      <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.05 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color, whiteSpace: 'nowrap', marginTop: 2 }}>{value}</span>
    </div>
  )
}
