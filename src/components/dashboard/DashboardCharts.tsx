'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  seancesParJour: { jour: string; count: number }[]
}

export default function DashboardCharts({ seancesParJour }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={seancesParJour} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="jour" tick={{ fontSize: 12, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
        <Tooltip
          contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8 }}
          labelStyle={{ color: '#0F172A', fontWeight: 600 }}
        />
        <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="Séances" />
      </BarChart>
    </ResponsiveContainer>
  )
}
