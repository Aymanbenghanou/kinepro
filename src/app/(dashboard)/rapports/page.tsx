'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/layout/Topbar'
import { formatMoney } from '@/lib/utils'
import { Download, FileText } from 'lucide-react'
import { generateRapportPDF } from '@/lib/pdf-utils'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'

export default function RapportsPage() {
  const [data, setData] = useState<any>(null)
  const [cabinet, setCabinet] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rapports/revenus')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
    fetch('/api/cabinet').then(r => r.json()).then(d => setCabinet(d)).catch(() => {})
  }, [])

  function exportCSV() {
    if (!data?.data) return
    const headers = ['Mois', 'Revenus (MAD)', 'Séances', 'No-Show', 'Taux No-Show (%)']
    const rows = data.data.map((d: any) => [d.mois, d.revenus, d.seances, d.noShow, d.tauxNoShow])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rapport-kinepro.csv'
    a.click()
  }

  const totalRevenu = data?.data?.reduce((s: number, d: any) => s + d.revenus, 0) || 0
  const totalSeances = data?.data?.reduce((s: number, d: any) => s + d.seances, 0) || 0
  const avgNoShow = data?.data?.length
    ? Math.round(data.data.reduce((s: number, d: any) => s + d.tauxNoShow, 0) / data.data.length)
    : 0

  return (
    <div>
      <Topbar title="Rapports" subtitle="Analyses et statistiques" />
      <div style={{ padding: 24 }}>

        {/* Header + Export buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 24 }}>
          <button onClick={exportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: 14, color: '#374151' }}>
            <Download size={16} /> Exporter CSV
          </button>
          <button onClick={() => generateRapportPDF(data, cabinet)}
            disabled={!data}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid #DBEAFE', borderRadius: 8, background: '#EFF6FF', cursor: data ? 'pointer' : 'not-allowed', fontWeight: 500, fontSize: 14, color: '#2563EB' }}>
            <FileText size={16} /> Exporter PDF
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Revenus 12 mois', value: formatMoney(totalRevenu), color: '#16A34A', bg: '#DCFCE7' },
            { label: 'Total séances', value: totalSeances, color: '#2563EB', bg: '#DBEAFE' },
            { label: 'Taux no-show moy.', value: `${avgNoShow}%`, color: '#F59E0B', bg: '#FEF3C7' },
            { label: 'Patients actifs', value: data?.totalPatients || '—', color: '#8B5CF6', bg: '#EDE9FE' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748B' }}>Chargement...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Revenus par mois */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Revenus par mois (MAD)</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data?.data || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8 }}
                    formatter={(value: any) => [formatMoney(value), 'Revenus']}
                  />
                  <Line type="monotone" dataKey="revenus" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: '#2563EB', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Séances par mois + no-show */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Séances par mois</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data?.data || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="seances" name="Séances réalisées" fill="#2563EB" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="noShow" name="No-show" fill="#FCA5A5" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Taux no-show tableau */}
              <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Taux d&apos;absence</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                  {(data?.data || []).slice(-6).map((d: any) => (
                    <div key={d.mois} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>{d.mois}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: `${d.tauxNoShow}%`, height: '100%', background: d.tauxNoShow > 15 ? '#DC2626' : '#F59E0B', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: d.tauxNoShow > 15 ? '#DC2626' : '#374151', minWidth: 32 }}>
                          {d.tauxNoShow}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Patients nouveaux vs récurrents */}
            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>Patients</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#2563EB' }}>{data?.nouveauxPatients || 0}</div>
                  <div style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Nouveaux ce mois</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#16A34A' }}>{(data?.totalPatients || 0) - (data?.nouveauxPatients || 0)}</div>
                  <div style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Patients récurrents</div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
