import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatMoney, formatTime } from '@/lib/utils'
import MobileTopbar from '@/components/mobile/MobileTopbar'
import {
  Calendar, Users, Banknote, AlertCircle,
  ChevronRight,
} from 'lucide-react'

export default async function MobileDashboardPage() {
  const session = await auth()
  if (!session?.user?.cabinetId) redirect('/login')
  const cabinetId = session.user.cabinetId
  const userPrenom = (session.user as any)?.prenom ?? ''

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0)
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59)

  const [rdvToday, activePatients, revenusMonth, unpaidFactures, rdvDuJour, patientsRecents] = await Promise.all([
    prisma.rendezVous.count({ where: { cabinetId, date: { gte: todayStart, lte: todayEnd } } }),
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
      include: { patient: { select: { nom: true, prenom: true } }, praticien: { select: { nom: true, prenom: true, couleur: true } } },
      orderBy: { date: 'asc' }, take: 5,
    }),
    prisma.patient.findMany({
      where: { cabinetId }, orderBy: { createdAt: 'desc' }, take: 5,
      select: { id: true, nom: true, prenom: true, pathologie: true, actif: true },
    }),
  ])

  const reste = unpaidFactures.reduce((s, f) => s + Math.max(0, f.montant - (f.montantPaye ?? 0)), 0)
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div>
      <MobileTopbar title="Tableau de bord" subtitle="Vue d'ensemble" />

      {/* Greeting */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
          Bonjour{userPrenom ? `, Dr. ${userPrenom}` : ''} 👋
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, textTransform: 'capitalize' }}>{dateStr}</div>
      </div>

      {/* Stats 2×2 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 10, padding: '0 16px 16px',
      }}>
        <StatCard icon={<Calendar size={18} />} iconBg="#DBEAFE" iconColor="#2563EB"
          value={String(rdvToday)} label="RDV aujourd'hui" />
        <StatCard icon={<Users size={18} />} iconBg="#DCFCE7" iconColor="#16A34A"
          value={String(activePatients)} label="Patients actifs" />
        <StatCard icon={<Banknote size={18} />} iconBg="#FEF3C7" iconColor="#D97706"
          value={formatMoney(revenusMonth._sum.montant ?? 0)} label="Revenus ce mois" />
        <StatCard icon={<AlertCircle size={18} />} iconBg="#FEE2E2" iconColor="#DC2626"
          value={reste > 0 ? formatMoney(reste) : '0 MAD'} label={reste > 0 ? `${unpaidFactures.length} impayées` : 'Tout payé'}
          href="/m/facturation" />
      </div>

      {/* Quick-actions grid retirée — mode lecture seule mobile.
          La barre de navigation du bas couvre déjà Agenda / Patients /
          WhatsApp / Plus → pas de duplication. */}

      {/* Agenda du jour */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>Agenda du jour</h2>
          <Link href="/m/agenda" style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Voir tout →</Link>
        </div>
        {rdvDuJour.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 16, textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>
            Aucun rendez-vous aujourd'hui
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rdvDuJour.map(rdv => (
              <Link key={rdv.id} href="/m/agenda" style={{
                background: 'white', borderRadius: 12, border: '1px solid #E2E8F0',
                padding: 12, display: 'flex', alignItems: 'center', gap: 12,
                textDecoration: 'none', minWidth: 0,
                borderLeft: `4px solid ${rdv.praticien.couleur}`,
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
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {rdv.typeSeance} · {rdv.duree} min
                  </div>
                </div>
                <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Patients récents */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>Patients récents</h2>
          <Link href="/m/patients" style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Voir tout →</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {patientsRecents.map(p => (
            <Link key={p.id} href={`/m/patients/${p.id}`} style={{
              background: 'white', borderRadius: 12, border: '1px solid #E2E8F0',
              padding: 12, display: 'flex', alignItems: 'center', gap: 12,
              textDecoration: 'none', minWidth: 0,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#DBEAFE', color: '#1D4ED8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, flexShrink: 0,
              }}>
                {p.prenom?.[0]}{p.nom?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.prenom} {p.nom}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.pathologie || 'Patient'}
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
                background: p.actif ? '#DCFCE7' : '#F1F5F9',
                color:      p.actif ? '#15803D' : '#64748B',
                flexShrink: 0, whiteSpace: 'nowrap',
              }}>
                {p.actif ? 'Actif' : 'Inactif'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, iconBg, iconColor, value, label, href }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  value: string; label: string; href?: string;
}) {
  const inner = (
    <div style={{
      background: 'white', borderRadius: 12, border: '1px solid #E2E8F0',
      padding: 14, minWidth: 0, boxSizing: 'border-box',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
      }}>{icon}</div>
      <div style={{
        fontSize: 22, fontWeight: 600, color: '#0F172A',
        lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{label}</div>
    </div>
  )
  if (href) return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
  return inner
}

