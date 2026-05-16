import Topbar from '@/components/layout/Topbar'
import { formatMoney, formatTime } from '@/lib/utils'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import { Calendar, Users, DollarSign, AlertCircle, Clock } from 'lucide-react'

async function getDashboardStats() {
  try {
    const res = await fetch('http://localhost:3000/api/dashboard/stats', {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function StatCard({ title, value, icon: Icon, color, bgColor }: {
  title: string
  value: string | number
  icon: any
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
    paye: { label: 'Payé', bg: '#DCFCE7', color: '#16A34A' },
    en_attente: { label: 'En attente', bg: '#FEF3C7', color: '#D97706' },
    en_retard: { label: 'En retard', bg: '#FEE2E2', color: '#DC2626' },
    confirme: { label: 'Confirmé', bg: '#DBEAFE', color: '#2563EB' },
    realisee: { label: 'Réalisée', bg: '#DCFCE7', color: '#16A34A' },
    annulee: { label: 'Annulée', bg: '#FEE2E2', color: '#DC2626' },
  }
  const s = map[statut] || { label: statut, bg: '#F1F5F9', color: '#64748B' }
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>
      {s.label}
    </span>
  )
}

export default async function DashboardPage() {
  const data = await getDashboardStats()

  if (!data) {
    return (
      <div>
        <Topbar title="Tableau de bord" subtitle="Vue d'ensemble du cabinet" />
        <div style={{ padding: 24 }}>
          <p style={{ color: '#64748B' }}>Chargement des données...</p>
        </div>
      </div>
    )
  }

  const { stats, rdvDuJour, patientsRecents, seancesParJour, facturesRecentes, praticiens } = data

  return (
    <div>
      <Topbar title="Tableau de bord" subtitle="Vue d'ensemble du cabinet" />
      <div style={{ padding: 24 }}>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard
            title="RDV aujourd'hui"
            value={stats.rdvAujourdHui}
            icon={Calendar}
            color="#2563EB"
            bgColor="#DBEAFE"
          />
          <StatCard
            title="Patients actifs"
            value={stats.patientsActifs}
            icon={Users}
            color="#16A34A"
            bgColor="#DCFCE7"
          />
          <StatCard
            title="Revenus du mois"
            value={formatMoney(stats.revenusMonth)}
            icon={DollarSign}
            color="#F59E0B"
            bgColor="#FEF3C7"
          />
          <StatCard
            title="Factures impayées"
            value={stats.facturesImpayees}
            icon={AlertCircle}
            color="#DC2626"
            bgColor="#FEE2E2"
          />
        </div>

        {/* Row 2: Agenda du jour + Graphique */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Agenda du jour */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
              📅 Agenda du jour
            </h2>
            {rdvDuJour.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: 14 }}>Aucun rendez-vous aujourd'hui</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rdvDuJour.map((rdv: any) => (
                  <div key={rdv.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', background: '#F8FAFC',
                    borderRadius: 8, borderLeft: `3px solid ${rdv.praticien.couleur}`
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
                        {rdv.typeSeance} · {rdv.duree} min · {rdv.salle || 'N/A'}
                      </p>
                    </div>
                    <StatusBadge statut={rdv.statut} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Graphique séances semaine */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
              📊 Séances cette semaine
            </h2>
            <DashboardCharts seancesParJour={seancesParJour} />
          </div>
        </div>

        {/* Row 3: Patients récents + Facturation + Personnel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

          {/* Patients récents */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
              👥 Patients récents
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {patientsRecents.map((p: any) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>
                      {p.prenom} {p.nom}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{p.pathologie || 'N/A'}</p>
                  </div>
                  <span style={{
                    background: '#DCFCE7', color: '#16A34A',
                    padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500
                  }}>
                    {p.seances.length} séances
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Facturation récente */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
              💳 Facturation récente
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {facturesRecentes.map((f: any) => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>
                      {f.patient.prenom} {f.patient.nom}
                    </p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{formatMoney(f.montant)}</p>
                  </div>
                  <StatusBadge statut={f.statut} />
                </div>
              ))}
            </div>
          </div>

          {/* Personnel */}
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
              👨‍⚕️ Personnel
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {praticiens.map((p: any) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: p.couleur, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700
                    }}>
                      {p.prenom[0]}{p.nom[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>
                        {p.prenom} {p.nom}
                      </p>
                      <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{p.specialite}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', margin: 0 }}>
                      {p.rdvAujourdHui}
                    </p>
                    <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>RDV</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
