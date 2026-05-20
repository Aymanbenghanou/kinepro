'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import Topbar from '@/components/layout/Topbar'
import { formatMoney } from '@/lib/utils'
import {
  Download, FileText, TrendingUp, TrendingDown, Minus,
  Wallet, Calendar, CheckCircle2, Users, Activity, Star, ChevronDown,
} from 'lucide-react'
import { generateRapportComplet } from '@/lib/pdf-utils'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'

// ── Period helpers ───────────────────────────────────────────────────────────

type PeriodKind = 'mois' | '3mois' | '6mois' | 'annee' | 'perso'

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function periodRange(kind: PeriodKind, year: number, month: number): { from: string; to: string; label: string } {
  if (kind === 'mois') {
    const f = new Date(year, month, 1)
    const t = new Date(year, month + 1, 0)
    return { from: ymd(f), to: ymd(t), label: `${MONTH_NAMES[month]} ${year}` }
  }
  if (kind === '3mois') {
    const t = new Date(year, month + 1, 0)
    const f = new Date(year, month - 2, 1)
    return { from: ymd(f), to: ymd(t), label: `3 mois (${MONTH_NAMES[Math.max(0,month-2)]}–${MONTH_NAMES[month]} ${year})` }
  }
  if (kind === '6mois') {
    const t = new Date(year, month + 1, 0)
    const f = new Date(year, month - 5, 1)
    return { from: ymd(f), to: ymd(t), label: `6 mois — ${year}` }
  }
  if (kind === 'annee') {
    return { from: `${year}-01-01`, to: `${year}-12-31`, label: `Année ${year}` }
  }
  const f = new Date(year, month, 1)
  const t = new Date(year, month + 1, 0)
  return { from: ymd(f), to: ymd(t), label: `${MONTH_NAMES[month]} ${year}` }
}

// ── Tiny inline sparkline ────────────────────────────────────────────────────

function Sparkline({ data, color = '#2563EB' }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const w = 80, h = 22
  const step = w / (data.length - 1 || 1)
  const path = data.map((v, i) => {
    const x = i * step
    const y = h - ((v - min) / (max - min || 1)) * h
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <path d={path} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, delta, color, bg, sparkline,
}: {
  icon: React.ReactNode; label: string; value: string;
  delta?: number; color: string; bg: string; sparkline?: number[];
}) {
  const trendUp = (delta ?? 0) > 0, trendDown = (delta ?? 0) < 0
  const trendColor = trendUp ? '#16A34A' : trendDown ? '#DC2626' : '#64748B'
  const TrendIcon = trendUp ? TrendingUp : trendDown ? TrendingDown : Minus
  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        {delta !== undefined && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 999, background: trendColor + '15', color: trendColor, fontSize: 11.5, fontWeight: 700 }}>
            <TrendIcon size={12} /> {delta > 0 ? '+' : ''}{delta}%
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
      {sparkline && sparkline.some(v => v > 0) && <Sparkline data={sparkline} color={color} />}
    </div>
  )
}

// ── Section title ────────────────────────────────────────────────────────────

function Section({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>{title}</h2>
        {extra}
      </div>
      {children}
    </div>
  )
}

function Card({ title, children, style }: { title?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, ...style }}>
      {title && <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>{title}</h3>}
      {children}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function RapportsPage() {
  const now = new Date()
  const [kind, setKind]       = useState<PeriodKind>('mois')
  const [year, setYear]       = useState(now.getFullYear())
  const [month, setMonth]     = useState(now.getMonth())
  const [praticienId, setPraticienId] = useState<string>('all')

  const [stats, setStats]     = useState<any>(null)
  const [cabinet, setCabinet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<string>('revenus')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const { from, to, label } = useMemo(() => periodRange(kind, year, month), [kind, year, month])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/rapports/stats?from=${from}&to=${to}&praticienId=${praticienId}`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [from, to, praticienId])

  useEffect(() => {
    fetch('/api/cabinet').then(r => r.json()).then(setCabinet).catch(() => {})
  }, [])

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)
  const praticienName = praticienId === 'all'
    ? 'Tous'
    : stats?.meta?.praticiens?.find((p: any) => p.id === praticienId)
      ? `${stats.meta.praticiens.find((p: any) => p.id === praticienId).prenom} ${stats.meta.praticiens.find((p: any) => p.id === praticienId).nom}`
      : 'Tous'

  function exportCSV() {
    const url = `/api/rapports/export/csv?from=${from}&to=${to}&praticienId=${praticienId}`
    window.open(url, '_blank')
  }
  function exportPDF() {
    if (!stats) return
    generateRapportComplet(stats, cabinet, label, praticienName)
  }

  // ── Sort praticiens table ──
  const sortedPraticiens = useMemo(() => {
    if (!stats?.praticiensStats) return []
    const arr = [...stats.praticiensStats]
    arr.sort((a: any, b: any) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [stats, sortKey, sortDir])

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <div>
      <Topbar title="Rapports" subtitle="Analyses détaillées et tendances" />
      <div style={{ padding: '20px 20px 40px' }}>

        {/* ── Sticky filters bar ───────────────────────────────────── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: '#F8FAFC', padding: '12px 0 16px',
          marginBottom: 4,
        }}>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
            background: 'white', border: '1px solid #E2E8F0', borderRadius: 14,
            padding: '10px 14px', boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
          }}>
            {/* Period buttons */}
            <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 10, padding: 3, gap: 2 }}>
              {([
                ['mois', 'Ce mois'],
                ['3mois', '3 mois'],
                ['6mois', '6 mois'],
                ['annee', 'Cette année'],
                ['perso', 'Personnalisé'],
              ] as [PeriodKind, string][]).map(([k, txt]) => (
                <button key={k} onClick={() => setKind(k)} style={{
                  padding: '7px 12px', borderRadius: 8, border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: kind === k ? 'white' : 'transparent',
                  color:      kind === k ? '#2563EB' : '#475569',
                  boxShadow:  kind === k ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {txt}
                </button>
              ))}
            </div>

            {/* Month (visible if perso or single month) */}
            {(kind === 'perso' || kind === 'mois') && (
              <Select value={String(month)} onChange={v => setMonth(parseInt(v))} options={MONTH_NAMES.map((m, i) => ({ value: String(i), label: m }))} />
            )}
            <Select value={String(year)} onChange={v => setYear(parseInt(v))} options={years.map(y => ({ value: String(y), label: String(y) }))} />

            {/* Praticien */}
            <Select
              value={praticienId} onChange={setPraticienId}
              options={[{ value: 'all', label: 'Tous les praticiens' }, ...(stats?.meta?.praticiens ?? []).map((p: any) => ({ value: p.id, label: `${p.prenom} ${p.nom}` }))]}
            />

            <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8 }}>
              <button onClick={exportCSV} style={btnSecondary}><Download size={14} /> CSV</button>
              <button onClick={exportPDF} disabled={!stats} style={{ ...btnPrimary, opacity: stats ? 1 : 0.5 }}><FileText size={14} /> PDF</button>
            </span>
          </div>

          <div style={{ marginTop: 8, fontSize: 12.5, color: '#64748B' }}>
            <strong style={{ color: '#0F172A' }}>{label}</strong> · {praticienName === 'Tous' ? 'tous les praticiens' : praticienName}
          </div>
        </div>

        {loading && !stats ? (
          <LoadingSkeleton />
        ) : !stats ? (
          <Card>Impossible de charger les données.</Card>
        ) : (
          <>
            {/* ── SECTION 1: KPIs ────────────────────────────── */}
            <div style={{
              display: 'grid', gap: 14, marginTop: 8,
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            }}>
              <KpiCard icon={<Wallet size={18} />}        label="Revenus"           value={formatMoney(stats.kpis.revenus.value)}                  delta={stats.kpis.revenus.deltaPct}            color="#16A34A" bg="#DCFCE7" sparkline={stats.kpis.revenus.sparkline} />
              <KpiCard icon={<Calendar size={18} />}      label="Total RDV"         value={String(stats.kpis.rdv.value)}                           delta={stats.kpis.rdv.deltaPct}                color="#2563EB" bg="#DBEAFE" sparkline={stats.kpis.rdv.sparkline} />
              <KpiCard icon={<CheckCircle2 size={18} />}  label="Séances réalisées" value={String(stats.kpis.seancesRealisees.value)}              delta={stats.kpis.seancesRealisees.deltaPct}   color="#7C3AED" bg="#EDE9FE" sparkline={stats.kpis.seancesRealisees.sparkline} />
              <KpiCard icon={<Users size={18} />}         label="Nouveaux patients" value={String(stats.kpis.nouveauxPatients.value)}              delta={stats.kpis.nouveauxPatients.deltaPct}   color="#F59E0B" bg="#FEF3C7" sparkline={stats.kpis.nouveauxPatients.sparkline} />
              <KpiCard icon={<Activity size={18} />}      label="Taux de présence"  value={`${stats.kpis.tauxPresence.value}%`}                    delta={stats.kpis.tauxPresence.deltaPct}       color="#0EA5E9" bg="#E0F2FE" sparkline={stats.kpis.tauxPresence.sparkline} />
              <KpiCard icon={<Star size={18} />}          label="Satisfaction"      value={`${stats.kpis.satisfaction.value || 0}/10`}             delta={stats.kpis.satisfaction.deltaPct}       color="#DC2626" bg="#FEE2E2" sparkline={stats.kpis.satisfaction.sparkline} />
            </div>

            {/* ── SECTION 2: Revenus ──────────────────────────── */}
            <Section title="💰 Revenus">
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                <Card title="Revenus par mois — N vs N-1" style={{ gridColumn: 'span 2', minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={stats.revenus.parMois}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                      <Tooltip formatter={(v: any) => formatMoney(Number(v))} contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="current"  name="Cette période"     stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="previous" name="Année précédente"  stroke="#94A3B8" strokeWidth={2}   strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Revenus par type de séance">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.revenus.parType}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="nom" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip formatter={(v: any) => formatMoney(Number(v))} contentStyle={tooltipStyle} />
                      <Bar dataKey="montant" name="Revenus" radius={[6, 6, 0, 0]}>
                        {stats.revenus.parType.map((d: any, i: number) => <Cell key={i} fill={d.couleur || '#2563EB'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Répartition des revenus">
                  {stats.revenus.repartition.length === 0 ? (
                    <Empty />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={stats.revenus.repartition} dataKey="montant" nameKey="nom" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                          {stats.revenus.repartition.map((d: any, i: number) => <Cell key={i} fill={d.couleur || '#2563EB'} />)}
                        </Pie>
                        <Tooltip formatter={(v: any, n: any, p: any) => [`${formatMoney(Number(v))} (${p.payload.pct}%)`, p.payload.nom]} contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>
            </Section>

            {/* ── SECTION 3: RDV & Présence ──────────────────── */}
            <Section title="📅 RDV & Présence">
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                <Card title="RDV par mois (par statut)" style={{ gridColumn: 'span 2', minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.rdv.parMois}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="realise" name="Réalisés" stackId="a" fill="#16A34A" />
                      <Bar dataKey="annule"  name="Annulés"  stackId="a" fill="#DC2626" />
                      <Bar dataKey="no_show" name="No-show"  stackId="a" fill="#F59E0B" />
                      <Bar dataKey="attente" name="En attente" stackId="a" fill="#94A3B8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Taux de présence — par jour">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stats.rdv.parJour.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="jour" tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} />
                      <Tooltip formatter={(v: any) => `${v}%`} contentStyle={tooltipStyle} />
                      <Bar dataKey="taux" name="Présence" radius={[6, 6, 0, 0]}>
                        {stats.rdv.parJour.slice(0, 6).map((d: any, i: number) => (
                          <Cell key={i} fill={d.taux >= 80 ? '#16A34A' : d.taux >= 60 ? '#F59E0B' : '#DC2626'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Créneaux populaires (heatmap)">
                  <Heatmap data={stats.rdv.heatmap} />
                </Card>
              </div>
            </Section>

            {/* ── SECTION 4: Patients ────────────────────────── */}
            <Section title="👥 Patients">
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                <Card title="Nouveaux patients par mois" style={{ gridColumn: 'span 2', minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={stats.patients.nouveauxParMois}>
                      <defs>
                        <linearGradient id="newPat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="nouveaux" stroke="#2563EB" strokeWidth={2.5} fill="url(#newPat)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Top pathologies">
                  {stats.patients.pathologies.length === 0 ? <Empty /> : (
                    <ResponsiveContainer width="100%" height={Math.max(220, stats.patients.pathologies.length * 28)}>
                      <BarChart layout="vertical" data={stats.patients.pathologies}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                        <YAxis type="category" dataKey="nom" width={130} tick={{ fontSize: 11, fill: '#0F172A' }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" fill="#7C3AED" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                <Card title="Fidélité patients">
                  {stats.patients.fidelite.total === 0 ? <Empty /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={[
                          { name: 'Nouveaux', value: stats.patients.fidelite.nouveaux, color: '#2563EB' },
                          { name: 'Récurrents', value: stats.patients.fidelite.recurrents, color: '#16A34A' },
                        ]} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                          <Cell fill="#2563EB" /><Cell fill="#16A34A" />
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>

              <div style={{ display: 'grid', gap: 12, marginTop: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <MiniStat label="Patient le plus fidèle"   value={stats.patients.plusFidele?.nom ?? '—'} hint={stats.patients.plusFidele ? `${stats.patients.plusFidele.count} séances` : ''} />
                <MiniStat label="Durée moyenne traitement" value={`${stats.patients.dureeMoyenne} j`} />
                <MiniStat label="Espacement moyen"         value={`${stats.patients.espacementMoyen} j`} hint="entre séances" />
              </div>
            </Section>

            {/* ── SECTION 5: Satisfaction ───────────────────── */}
            <Section title="⭐ Satisfaction & Feedbacks">
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                <Card title="Évolution de la satisfaction (par semaine)" style={{ gridColumn: 'span 2', minWidth: 0 }}>
                  {stats.satisfaction.evolution.length === 0 ? <Empty /> : (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={stats.satisfaction.evolution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="semaine" tick={{ fontSize: 12, fill: '#64748B' }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748B' }} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${v}/10`} />
                        <Line type="monotone" dataKey="score" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                <Card title="Distribution des scores">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stats.satisfaction.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="score" tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {stats.satisfaction.distribution.map((d: any, i: number) => (
                          <Cell key={i} fill={d.score <= 4 ? '#DC2626' : d.score <= 7 ? '#F59E0B' : '#16A34A'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              <div style={{ display: 'grid', gap: 12, marginTop: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <MiniStat label="Feedbacks reçus"       value={String(stats.satisfaction.summary.total)} />
                <MiniStat label="Score moyen"            value={stats.satisfaction.summary.moyenne ? `${stats.satisfaction.summary.moyenne}/10` : '—'} />
                <MiniStat label="% Excellents (≥8)"      value={`${stats.satisfaction.summary.pctExcellent}%`} />
              </div>

              {stats.satisfaction.summary.negatifs.length > 0 && (
                <Card title="Feedbacks négatifs (score < 5)" style={{ marginTop: 14 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid #E2E8F0' }}>
                          <th style={th}>Patient</th><th style={th}>Date</th><th style={{ ...th, textAlign: 'center' }}>Score</th><th style={th}>Commentaire</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.satisfaction.summary.negatifs.map((n: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={td}>{n.patient}</td>
                            <td style={{ ...td, color: '#64748B' }}>{new Date(n.date).toLocaleDateString('fr-FR')}</td>
                            <td style={{ ...td, textAlign: 'center' }}>
                              <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '3px 9px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{n.score}/10</span>
                            </td>
                            <td style={{ ...td, color: '#475569', fontStyle: 'italic' }}>{n.commentaire || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </Section>

            {/* ── SECTION 6: Performance par praticien ───────── */}
            {sortedPraticiens.length > 0 && (
              <Section title="🩺 Performance par praticien">
                <Card>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid #E2E8F0' }}>
                          <SortableTh label="Praticien"  k="nom"     active={sortKey} dir={sortDir} onClick={toggleSort} />
                          <SortableTh label="RDV"        k="rdv"     active={sortKey} dir={sortDir} onClick={toggleSort} center />
                          <SortableTh label="Séances"    k="seances" active={sortKey} dir={sortDir} onClick={toggleSort} center />
                          <SortableTh label="Présence"   k="taux"    active={sortKey} dir={sortDir} onClick={toggleSort} center />
                          <SortableTh label="Revenus"    k="revenus" active={sortKey} dir={sortDir} onClick={toggleSort} right />
                          <SortableTh label="Score"      k="score"   active={sortKey} dir={sortDir} onClick={toggleSort} center />
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPraticiens.map((p: any) => {
                          const initials = p.nom.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={td}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.couleur || '#2563EB', color: 'white', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</div>
                                  <span style={{ fontWeight: 600 }}>{p.nom}</span>
                                </div>
                              </td>
                              <td style={{ ...td, textAlign: 'center' }}>{p.rdv}</td>
                              <td style={{ ...td, textAlign: 'center' }}>{p.seances}</td>
                              <td style={{ ...td, textAlign: 'center' }}>
                                <span style={{ background: p.taux >= 80 ? '#DCFCE7' : p.taux >= 60 ? '#FEF3C7' : '#FEE2E2', color: p.taux >= 80 ? '#166534' : p.taux >= 60 ? '#92400E' : '#991B1B', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{p.taux}%</span>
                              </td>
                              <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>{formatMoney(p.revenus)}</td>
                              <td style={{ ...td, textAlign: 'center' }}>{p.score ? `${p.score}/10` : '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Reusable small components ────────────────────────────────────────────────

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        padding: '8px 32px 8px 14px', borderRadius: 10, border: '1px solid #E2E8F0',
        fontSize: 13, fontWeight: 600, color: '#0F172A', background: 'white',
        cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} color="#64748B" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  )
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{hint}</div>}
    </div>
  )
}

function Empty() {
  return <div style={{ padding: '32px 8px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Aucune donnée pour cette période</div>
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: 110, borderRadius: 14, background: 'linear-gradient(90deg,#F1F5F9,#E2E8F0,#F1F5F9)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite' }} />
        ))}
      </div>
      <div style={{ height: 280, borderRadius: 14, background: 'linear-gradient(90deg,#F1F5F9,#E2E8F0,#F1F5F9)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite' }} />
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  )
}

function Heatmap({ data }: { data: { day: number; hour: number; count: number }[] }) {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const hours = Array.from({ length: 11 }, (_, i) => i + 8)
  const max = Math.max(...data.map(d => d.count), 1)
  const get = (d: number, h: number) => data.find(x => x.day === d && x.hour === h)?.count ?? 0
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `30px repeat(${hours.length}, 1fr)`, gap: 3, minWidth: 320 }}>
        <div />
        {hours.map(h => <div key={h} style={{ fontSize: 10, color: '#64748B', textAlign: 'center', fontWeight: 600 }}>{h}h</div>)}
        {days.map((d, di) => (
          <Fragment key={d}>
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, alignSelf: 'center' }}>{d}</div>
            {hours.map(h => {
              const c = get(di, h)
              const intensity = c / max
              return (
                <div key={h} title={`${d} ${h}h — ${c} RDV`} style={{
                  aspectRatio: '1 / 1', borderRadius: 4,
                  background: c === 0 ? '#F1F5F9' : `rgba(37,99,235,${0.15 + intensity * 0.85})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: intensity > 0.5 ? 'white' : '#475569',
                  fontSize: 10, fontWeight: 700,
                }}>
                  {c > 0 ? c : ''}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function SortableTh({ label, k, active, dir, onClick, center, right }: { label: string; k: string; active: string; dir: 'asc' | 'desc'; onClick: (k: string) => void; center?: boolean; right?: boolean }) {
  const isActive = active === k
  return (
    <th onClick={() => onClick(k)} style={{
      padding: '10px 12px', fontSize: 12, fontWeight: 700, color: isActive ? '#2563EB' : '#64748B',
      textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', userSelect: 'none',
      textAlign: center ? 'center' : right ? 'right' : 'left',
    }}>
      {label} {isActive && (dir === 'asc' ? '▲' : '▼')}
    </th>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 'none', borderRadius: 9, background: '#2563EB', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: 9, background: 'white', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }
const tooltipStyle: React.CSSProperties = { background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }
const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }
const td: React.CSSProperties = { padding: '12px', color: '#0F172A', verticalAlign: 'middle' }
