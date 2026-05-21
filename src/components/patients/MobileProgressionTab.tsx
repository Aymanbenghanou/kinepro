'use client'

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer } from 'recharts'

/**
 * Mobile-only Progrès tab for /patients/[id].
 * Pure CSS in inline styles to avoid Tailwind purge surprises.
 * Reads patient.seances + patient.feedbacks; calls PATCH /api/seances/:id
 * for score saving — same endpoint as the desktop ProgressionTab.
 */
export default function MobileProgressionTab({ patient, onScoresSaved }: {
  patient: any
  onScoresSaved: () => void
}) {
  // ── Derive KPI data ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const seances = (patient.seances ?? []) as any[]
    const realisees = seances.filter(s => s.statut === 'realisee')
    const sortedAsc = [...seances].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const douleur  = sortedAsc.filter(s => typeof s.douleurScore  === 'number').map(s => s.douleurScore as number)
    const mobilite = sortedAsc.filter(s => typeof s.mobiliteScore === 'number').map(s => s.mobiliteScore as number)

    const initialDouleur  = douleur[0]  ?? null
    const currentDouleur  = douleur[douleur.length - 1] ?? null
    const initialMobilite = mobilite[0] ?? null
    const currentMobilite = mobilite[mobilite.length - 1] ?? null

    const progressionPct = initialDouleur && currentDouleur != null && initialDouleur > 0
      ? Math.max(0, Math.round(((initialDouleur - currentDouleur) / initialDouleur) * 100))
      : null

    // Feedback avg from feedbacks if present, else from seance.scorePatient
    const fbScores: number[] = (patient.feedbacks ?? [])
      .map((f: any) => f.score).filter((n: any) => typeof n === 'number')
    const seanceScores: number[] = realisees
      .map((s: any) => s.scorePatient).filter((n: any) => typeof n === 'number')
    const allScores = fbScores.length ? fbScores : seanceScores
    const avgFeedback = allScores.length
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
      : null

    // Chart data — last 8 seances with douleur score
    const chartData = sortedAsc
      .filter(s => typeof s.douleurScore === 'number')
      .slice(-8)
      .map((s: any, i: number) => ({
        label: `S${i + 1}`,
        douleur: s.douleurScore as number,
      }))

    return {
      initialDouleur, currentDouleur,
      initialMobilite, currentMobilite,
      progressionPct,
      seancesRealisees: realisees.length,
      seancesPrescrites: patient.nbSeancesPrescrites ?? null,
      avgFeedback,
      chartData,
      lastRealiseId: realisees[realisees.length - 1]?.id ?? null,
    }
  }, [patient])

  // ── Score-entry state ────────────────────────────────────────────────────
  const [scores, setScores] = useState<{ douleur: number | null; mobilite: number | null; force: number | null }>({
    douleur: null, mobilite: null, force: null,
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  async function saveScores() {
    if (!stats.lastRealiseId) return
    if (scores.douleur == null && scores.mobilite == null && scores.force == null) return
    setSaving(true)
    try {
      const body: any = {}
      if (scores.douleur  != null) body.douleurScore  = scores.douleur
      if (scores.mobilite != null) body.mobiliteScore = scores.mobilite
      if (scores.force    != null) body.forceScore    = scores.force
      await fetch(`/api/seances/${stats.lastRealiseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setSaved(true)
      onScoresSaved()
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  // ── Objectifs (parsed from patient.objectifsTraitement) ──────────────────
  const objectifs: { label: string; done: boolean; inProgress: boolean }[] = useMemo(() => {
    const raw = (patient.objectifsTraitement ?? '').trim()
    if (!raw) return []
    return raw.split(/\r?\n/).filter((l: string) => l.trim()).map((line: string) => {
      const done = /^\s*[✓✔x]\s/i.test(line) || /^\s*\[x\]/i.test(line)
      const inProgress = /^\s*[→>]\s/.test(line) || /^\s*\[~\]/.test(line)
      const label = line.replace(/^\s*[✓✔x→>]\s+/i, '').replace(/^\s*\[[x~]\]\s*/i, '').replace(/^\s*[-•]\s*/, '').trim()
      return { label, done, inProgress }
    })
  }, [patient.objectifsTraitement])

  const deltaDouleur  = stats.initialDouleur != null && stats.currentDouleur != null ? stats.initialDouleur - stats.currentDouleur : null
  const deltaMobilite = stats.initialMobilite != null && stats.currentMobilite != null ? stats.currentMobilite - stats.initialMobilite : null

  return (
    <div>
      {/* ── KPI grid 2×2 ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 8,
        marginTop: 4,
      }}>
        {/* Douleur */}
        <Card>
          <Label>Douleur</Label>
          {stats.initialDouleur != null ? (
            <>
              <Value color="#EF4444">{stats.initialDouleur}/10</Value>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>→</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#16A34A', whiteSpace: 'nowrap' }}>
                  {stats.currentDouleur}/10
                </span>
              </div>
              {deltaDouleur != null && deltaDouleur > 0 && (
                <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 600, marginTop: 4, display: 'block' }}>
                  ↓ -{deltaDouleur} pts
                </span>
              )}
            </>
          ) : <Empty />}
        </Card>

        {/* Mobilité */}
        <Card>
          <Label>Mobilité</Label>
          {stats.currentMobilite != null ? (
            <>
              <Value color="#3B82F6">{stats.currentMobilite}/10</Value>
              {deltaMobilite != null && deltaMobilite !== 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 600, marginTop: 8, display: 'block',
                  color: deltaMobilite > 0 ? '#16A34A' : '#DC2626',
                }}>
                  {deltaMobilite > 0 ? '↑ +' : '↓ '}{deltaMobilite} pts
                </span>
              )}
            </>
          ) : <Empty />}
        </Card>

        {/* Progression */}
        <Card>
          <Label>Progression</Label>
          {stats.progressionPct != null ? (
            <>
              <Value color="#16A34A">{stats.progressionPct}%</Value>
              <div style={{ height: 4, background: '#F1F5F9', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.progressionPct}%`, background: '#22C55E', borderRadius: 999 }} />
              </div>
              {stats.seancesPrescrites != null && (
                <span style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, display: 'block' }}>
                  {stats.seancesRealisees}/{stats.seancesPrescrites} séances
                </span>
              )}
            </>
          ) : <Empty />}
        </Card>

        {/* Satisfaction */}
        <Card>
          <Label>Satisfaction</Label>
          {stats.avgFeedback != null ? (
            <>
              <Value color="#F59E0B">{stats.avgFeedback}/10</Value>
              <span style={{ fontSize: 10, color: '#94A3B8', marginTop: 8, display: 'block' }}>moy. feedbacks</span>
            </>
          ) : <Empty />}
        </Card>
      </div>

      {/* ── Evolution chart ── */}
      {stats.chartData.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 12, marginTop: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', margin: '0 0 12px' }}>
            Évolution douleur — {stats.chartData.length} séances
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={stats.chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Bar dataKey="douleur" radius={[3, 3, 0, 0]}>
                {stats.chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.douleur >= 7 ? '#EF4444' : entry.douleur >= 4 ? '#F59E0B' : '#22C55E'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Score input ── */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 12, marginTop: 8, marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', margin: '0 0 12px' }}>
          {stats.lastRealiseId ? `Enregistrer scores — Séance ${stats.seancesRealisees}` : 'Enregistrer scores'}
        </p>

        {!stats.lastRealiseId ? (
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Aucune séance réalisée à scorer.</p>
        ) : (<>
          {(['douleur', 'mobilite', 'force'] as const).map(metric => (
            <div key={metric} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'capitalize', margin: '0 0 8px' }}>
                {metric}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => {
                  const active = scores[metric] === n
                  const palette = metric === 'douleur'
                    ? { bg: '#FEE2E2', text: '#B91C1C', border: '#EF4444' }
                    : metric === 'mobilite'
                      ? { bg: '#DBEAFE', text: '#1D4ED8', border: '#3B82F6' }
                      : { bg: '#DCFCE7', text: '#15803D', border: '#22C55E' }
                  return (
                    <button
                      key={n}
                      onClick={() => setScores(prev => ({ ...prev, [metric]: n }))}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        fontSize: 11, fontWeight: 600,
                        flexShrink: 0, cursor: 'pointer',
                        border: '1px solid',
                        background:    active ? palette.bg     : '#F8FAFC',
                        color:         active ? palette.text   : '#64748B',
                        borderColor:   active ? palette.border : '#E2E8F0',
                        transition: 'all 0.15s',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <button
            onClick={saveScores}
            disabled={saving}
            style={{
              width: '100%', height: 40, borderRadius: 12,
              background: saved ? '#16A34A' : '#2563EB',
              color: 'white', border: 'none',
              fontSize: 13, fontWeight: 600, marginTop: 4,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saved ? '✓ Scores enregistrés' : saving ? 'Enregistrement…' : 'Enregistrer les scores'}
          </button>
        </>)}
      </div>

      {/* ── Objectifs ── */}
      {objectifs.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 12, marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', margin: '0 0 12px' }}>
            Objectifs du traitement
          </p>
          {objectifs.map((obj, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: i < objectifs.length - 1 ? 10 : 0,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, flexShrink: 0,
                background: obj.done       ? '#F0FDF4' : obj.inProgress ? '#EFF6FF' : '#F1F5F9',
                color:      obj.done       ? '#16A34A' : obj.inProgress ? '#2563EB' : '#94A3B8',
              }}>
                {obj.done ? '✓' : obj.inProgress ? '→' : '○'}
              </div>
              <span style={{
                fontSize: 12,
                color: obj.done ? '#94A3B8' : '#374151',
                textDecoration: obj.done ? 'line-through' : 'none',
              }}>
                {obj.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      padding: 12,
      minWidth: 0,
      overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 600, color: '#94A3B8',
      textTransform: 'uppercase', letterSpacing: 0.5,
      margin: '0 0 8px',
    }}>
      {children}
    </p>
  )
}

function Value({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 20, fontWeight: 600, color, lineHeight: 1.1,
      whiteSpace: 'nowrap', overflow: 'hidden',
      display: 'inline-block', maxWidth: '100%',
    }}>
      {children}
    </span>
  )
}

function Empty() {
  return <span style={{ fontSize: 18, color: '#CBD5E1' }}>—</span>
}
