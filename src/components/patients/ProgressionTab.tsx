'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function painEmoji(score: number): string {
  if (score <= 2) return '😊'
  if (score <= 4) return '🙂'
  if (score <= 6) return '😐'
  if (score <= 8) return '😣'
  return '😖'
}

function ScoreSlider({
  label, emoji, value, color,
  onChange,
}: {
  label: string; emoji: string; value: number; color: string
  onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{emoji} {label}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color }}>{value}<span style={{ fontSize: 11, color: '#94A3B8' }}>/10</span></span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
        <span>1 (faible)</span><span>10 (élevé)</span>
      </div>
    </div>
  )
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function DeltaCard({ label, initial, current, lowerIsBetter = true }: {
  label: string; initial: number | null; current: number | null; lowerIsBetter?: boolean
}) {
  const hasData = initial !== null && current !== null
  const improved = hasData ? (lowerIsBetter ? current < initial : current > initial) : null
  const same = hasData && current === initial
  const delta = hasData ? Math.abs(current! - initial!) : null

  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      {!hasData ? (
        <div style={{ fontSize: 13, color: '#94A3B8' }}>Aucune donnée</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#94A3B8' }}>{initial}/10</span>
          <span style={{ fontSize: 16, color: '#CBD5E1' }}>→</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: same ? '#64748B' : improved ? '#16A34A' : '#DC2626' }}>{current}/10</span>
          {!same && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: improved ? '#DCFCE7' : '#FEE2E2',
              color: improved ? '#16A34A' : '#DC2626',
              borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
            }}>
              {improved ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {delta}
            </div>
          )}
          {same && <Minus size={14} color="#94A3B8" />}
        </div>
      )}
    </div>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Séance {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ fontSize: 12, color: p.color, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700 }}>{p.name}:</span>
          <span>{p.value}/10</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgressionTab({ patient, onScoresSaved }: {
  patient: any
  onScoresSaved: () => void
}) {
  // Build chart data from seances (sorted asc by date, only those with at least one score)
  const scoredSeances = [...(patient.seances || [])]
    .filter(s => s.douleurScore !== null || s.mobiliteScore !== null || s.forceScore !== null)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const chartData = scoredSeances.map((s: any, i: number) => ({
    seance: i + 1,
    Douleur:  s.douleurScore  ?? undefined,
    Mobilité: s.mobiliteScore ?? undefined,
    Force:    s.forceScore    ?? undefined,
    date: new Date(s.date).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit' }),
  }))

  // First / last scores for deltas
  const douleurScores  = scoredSeances.filter((s: any) => s.douleurScore  !== null).map((s: any) => s.douleurScore)
  const mobiliteScores = scoredSeances.filter((s: any) => s.mobiliteScore !== null).map((s: any) => s.mobiliteScore)
  const forceScores    = scoredSeances.filter((s: any) => s.forceScore    !== null).map((s: any) => s.forceScore)

  const initDouleur  = douleurScores[0]  ?? null
  const curDouleur   = douleurScores[douleurScores.length - 1]   ?? null
  const initMobilite = mobiliteScores[0] ?? null
  const curMobilite  = mobiliteScores[mobiliteScores.length - 1] ?? null

  // Global progress (based on douleur improvement — lower is better)
  const globalPct = initDouleur && curDouleur && initDouleur > 0
    ? Math.max(0, Math.round(((initDouleur - curDouleur) / initDouleur) * 100))
    : null

  // Seance-level score entry
  const [selectedSeanceId, setSelectedSeanceId] = useState<string>('')
  const [scores, setScores] = useState({ douleur: 5, mobilite: 5, force: 5, notes: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Pre-fill when selecting a seance
  useEffect(() => {
    if (!selectedSeanceId) return
    const s = patient.seances?.find((s: any) => s.id === selectedSeanceId)
    if (s) {
      setScores({
        douleur:  s.douleurScore  ?? 5,
        mobilite: s.mobiliteScore ?? 5,
        force:    s.forceScore    ?? 5,
        notes:    s.notesProgression ?? '',
      })
    }
    setSaved(false)
  }, [selectedSeanceId, patient.seances])

  const realisees = (patient.seances || []).filter((s: any) => s.statut === 'realisee')

  async function handleSaveScores() {
    if (!selectedSeanceId) return
    setSaving(true)
    try {
      await fetch(`/api/seances/${selectedSeanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          douleurScore:     scores.douleur,
          mobiliteScore:    scores.mobilite,
          forceScore:       scores.force,
          notesProgression: scores.notes || null,
        }),
      })
      setSaved(true)
      onScoresSaved()
    } catch {}
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Summary cards ── */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>📊 Évolution des scores</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <DeltaCard label="Douleur"  initial={initDouleur}  current={curDouleur}  lowerIsBetter={true} />
          <DeltaCard label="Mobilité" initial={initMobilite} current={curMobilite} lowerIsBetter={false} />
          <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Séances réalisées</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563EB' }}>
              {(patient.seances || []).filter((s: any) => s.statut === 'realisee').length}
              {patient.nbSeancesPrescrites && (
                <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 400 }}>/{patient.nbSeancesPrescrites}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Global progress bar ── */}
      {globalPct !== null && (
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>🎯 Progression globale (réduction de la douleur)</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: globalPct >= 60 ? '#16A34A' : '#2563EB' }}>{globalPct}%</span>
          </div>
          <div style={{ height: 14, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999, transition: 'width 0.6s ease',
              width: `${globalPct}%`,
              background: globalPct >= 80 ? '#16A34A' : globalPct >= 50 ? '#2563EB' : '#F59E0B',
            }} />
          </div>
          {globalPct >= 80 && (
            <p style={{ fontSize: 13, color: '#16A34A', margin: '8px 0 0', fontWeight: 500 }}>✅ Excellent progrès !</p>
          )}
        </div>
      )}

      {/* ── Line chart ── */}
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>📈 Courbe d'évolution</h3>
        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📉</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Aucune donnée de progression</div>
            <div style={{ fontSize: 13 }}>Enregistrez des scores lors des séances pour voir l'évolution.</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="seance"
                tick={{ fontSize: 11, fill: '#64748B' }}
                label={{ value: 'Séance n°', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94A3B8' }}
              />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748B' }} tickCount={6} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Douleur"  stroke="#DC2626" strokeWidth={2.5} dot={{ r: 5, fill: '#DC2626' }} connectNulls />
              <Line type="monotone" dataKey="Mobilité" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 5, fill: '#2563EB' }} connectNulls />
              <Line type="monotone" dataKey="Force"    stroke="#16A34A" strokeWidth={2.5} dot={{ r: 5, fill: '#16A34A' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Score entry ── */}
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>🎯 Enregistrer des scores</h3>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 18px' }}>Sélectionnez une séance et renseignez les scores observés.</p>

        {realisees.length === 0 ? (
          <p style={{ color: '#94A3B8', fontSize: 13 }}>Aucune séance réalisée pour ce patient.</p>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Séance</label>
              <select
                value={selectedSeanceId}
                onChange={e => setSelectedSeanceId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, background: 'white' }}
              >
                <option value="">Sélectionner une séance...</option>
                {realisees.map((s: any) => {
                  const d = new Date(s.date)
                  const hasScores = s.douleurScore !== null
                  return (
                    <option key={s.id} value={s.id}>
                      {d.toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' })} — {s.typeSeance}
                      {hasScores ? ' ✓' : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            {selectedSeanceId && (
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 18 }}>
                <ScoreSlider
                  label="Douleur (1=légère, 10=intense)" emoji="🔴"
                  value={scores.douleur} color="#DC2626"
                  onChange={v => setScores(s => ({ ...s, douleur: v }))}
                />
                <ScoreSlider
                  label="Mobilité (1=bloquée, 10=complète)" emoji="🔵"
                  value={scores.mobilite} color="#2563EB"
                  onChange={v => setScores(s => ({ ...s, mobilite: v }))}
                />
                <ScoreSlider
                  label="Force (1=très faible, 10=normale)" emoji="🟢"
                  value={scores.force} color="#16A34A"
                  onChange={v => setScores(s => ({ ...s, force: v }))}
                />
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Notes de progression</label>
                  <textarea
                    value={scores.notes}
                    onChange={e => setScores(s => ({ ...s, notes: e.target.value }))}
                    rows={3}
                    placeholder="Observations, commentaires sur l'évolution..."
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={handleSaveScores}
                    disabled={saving}
                    style={{
                      padding: '10px 20px', background: saving ? '#93C5FD' : '#2563EB',
                      color: 'white', border: 'none', borderRadius: 8,
                      cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14,
                    }}
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer les scores'}
                  </button>
                  {saved && (
                    <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>✅ Scores enregistrés</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
