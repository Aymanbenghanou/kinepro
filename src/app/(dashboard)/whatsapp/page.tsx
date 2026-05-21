'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/layout/Topbar'
import { formatDate, formatTime } from '@/lib/utils'
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton'
import FeedbackModal from '@/components/whatsapp/FeedbackWidget'
import {
  msgConfirmationRDV, msgRappelRDV, msgFeedbackAuto,
  buildWhatsAppUrl, formatPhoneForWhatsApp,
  scoreColor, scoreBadge, scoreCategory,
} from '@/lib/whatsapp'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'

type Tab = 'envoyer' | 'rappels' | 'ready' | 'historique'

function CountdownBadge({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(since).getTime()) / 1000))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [since])
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return (
    <span style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600 }}>
      il y a {m > 0 ? `${m}m ` : ''}{s}s
    </span>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function WhatsAppSvg({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WhatsAppCenterPage() {
  const [tab, setTab] = useState<Tab>('envoyer')
  const [loading, setLoading] = useState(true)
  const [seances, setSeances] = useState<any[]>([])
  const [rdvs, setRdvs] = useState<any[]>([])
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [readySeances, setReadySeances] = useState<any[]>([])
  const [feedbackTarget, setFeedbackTarget] = useState<{ seance: any; patient: any } | null>(null)

  async function fetchAll() {
    setLoading(true)
    try {
      const [s, r, f, ready] = await Promise.all([
        fetch('/api/seances').then(x => x.json()),
        fetch('/api/rendez-vous').then(x => x.json()),
        fetch('/api/feedback').then(x => x.json()),
        fetch('/api/feedback/ready').then(x => x.json()),
      ])
      setSeances(Array.isArray(s) ? s : [])
      setRdvs(Array.isArray(r) ? r : [])
      setFeedbacks(Array.isArray(f) ? f : [])
      setReadySeances(Array.isArray(ready) ? ready : [])
    } catch {}
    setLoading(false)
  }

  // Check URL param on mount to open correct tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'ready') setTab('ready')
    fetchAll()
  }, [])

  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  // Tab 1: "À envoyer" — today's RDVs + today's réalisées séances without feedback
  const rdvsAujourdhui = rdvs.filter(r => isSameDay(new Date(r.date), today))
  const seancesAttente = seances.filter(s =>
    s.statut === 'realisee' &&
    (s.scorePatient === null || s.scorePatient === undefined)
  )

  // Tab 2: "Rappels demain" — tomorrow's RDVs
  const rdvsDemain = rdvs.filter(r => isSameDay(new Date(r.date), tomorrow))

  // Tab 3: "Historique" — stats from feedbacks
  const excellent = feedbacks.filter(f => scoreCategory(f.score) === 'excellent').length
  const moyen = feedbacks.filter(f => scoreCategory(f.score) === 'moyen').length
  const difficile = feedbacks.filter(f => scoreCategory(f.score) === 'difficile').length
  const avgScore = feedbacks.length
    ? Math.round((feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length) * 10) / 10
    : null
  const lowScoreSeances = seances.filter(s =>
    s.scorePatient !== null && s.scorePatient !== undefined && s.scorePatient <= 4
  )

  const pendingSeances = seances.filter(s => s.feedbackStatus === 'pending')

  const tabs: { id: Tab; label: string; badge?: number; highlight?: boolean }[] = [
    { id: 'envoyer',    label: "📤 Aujourd'hui", badge: rdvsAujourdhui.length + seancesAttente.length },
    { id: 'rappels',    label: '🔔 Rappels',     badge: rdvsDemain.length },
    { id: 'ready',      label: '⭐ Feedback',    badge: readySeances.length, highlight: readySeances.length > 0 },
    { id: 'historique', label: '📊 Historique',  badge: feedbacks.length },
  ]

  return (
    <div>
      <Topbar title="WhatsApp Center" subtitle="Messagerie & feedbacks patients" />
      <div style={{ padding: 24 }}>

        {/* Tabs — scrollable pill row (mobile-safe) */}
        <div className="params-tabs" style={{ marginBottom: 16 }}>
          {tabs.map(t => {
            const isActive    = tab === t.id
            const isHighlight = t.highlight && !isActive
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`param-tab${isActive ? ' active' : ''}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  ...(isHighlight ? { background: '#F5F3FF', color: '#7C3AED', borderColor: '#7C3AED' } : null),
                  ...(isActive ? { background: '#7C3AED', borderColor: '#7C3AED' } : null),
                }}
              >
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.3)' : isHighlight ? '#EDE9FE' : '#E2E8F0',
                    color: isActive ? 'white' : isHighlight ? '#7C3AED' : '#64748B',
                    fontSize: 11, fontWeight: 700,
                    padding: '1px 7px', borderRadius: 999,
                  }}>
                    {t.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748B', fontSize: 14 }}>Chargement...</div>
        ) : (
          <>
            {/* ── Tab 1: À envoyer aujourd'hui ── */}
            {tab === 'envoyer' && (<>

            {/* MOBILE — mockup-styled card list */}
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Section: Confirmations RDV */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                📅 Confirmations RDV — {rdvsAujourdhui.length}
              </div>
              {rdvsAujourdhui.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: 16, fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
                  Aucun RDV aujourd'hui
                </div>
              ) : rdvsAujourdhui.map((rdv: any) => (
                <div key={rdv.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: '#DBEAFE', color: '#1D4ED8',
                      fontSize: 13, fontWeight: 600, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {rdv.patient?.prenom?.[0]}{rdv.patient?.nom?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rdv.patient?.prenom} {rdv.patient?.nom}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📅 {formatTime(rdv.date)} · {rdv.typeSeance} · {rdv.duree || 45} min
                      </div>
                    </div>
                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
                      {formatTime(rdv.date)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', borderTop: '1px solid #F1F5F9' }}>
                    {rdv.patient?.telephone ? (
                      <a
                        href={buildWhatsAppUrl(
                          formatPhoneForWhatsApp(rdv.patient.telephone),
                          msgConfirmationRDV({
                            prenom: rdv.patient.prenom,
                            date: new Date(rdv.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
                            heure: formatTime(rdv.date),
                            typeSeance: rdv.typeSeance,
                            praticien: rdv.praticien ? `${rdv.praticien.prenom} ${rdv.praticien.nom}` : '',
                            duree: rdv.duree || 45,
                          })
                        )}
                        target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, padding: 10, textAlign: 'center', textDecoration: 'none', color: '#16A34A', fontSize: 12, fontWeight: 600 }}
                      >
                        📱 Confirmer
                      </a>
                    ) : (
                      <span style={{ flex: 1, padding: 10, textAlign: 'center', color: '#CBD5E1', fontSize: 12 }}>Pas de tél.</span>
                    )}
                    <div style={{ width: 1, background: '#F1F5F9' }} />
                    <button style={{ flex: 1, padding: 10, background: 'transparent', border: 'none', color: '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      ✓ Fait
                    </button>
                  </div>
                </div>
              ))}

              {/* Section: Séances sans feedback */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                ⚡ Séances sans feedback — {seancesAttente.length}
              </div>
              {seancesAttente.length === 0 ? (
                <div style={{ background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0', padding: 14, fontSize: 12, color: '#15803D', textAlign: 'center', fontWeight: 600 }}>
                  ✓ Tous les feedbacks ont été enregistrés
                </div>
              ) : seancesAttente.map((s: any) => {
                const ready = s.feedbackStatus === 'ready'
                return (
                  <div key={s.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: ready ? '#F3E8FF' : '#FEF3C7',
                        color:      ready ? '#7C3AED' : '#B45309',
                        fontSize: 13, fontWeight: 600, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {s.patient?.prenom?.[0]}{s.patient?.nom?.[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.patient?.prenom} {s.patient?.nom}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.typeSeance} · terminée à {formatTime(s.date)}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        padding: '2px 8px', borderRadius: 20,
                        background: ready ? '#F5F3FF' : '#FFFBEB',
                        color:      ready ? '#7C3AED' : '#B45309',
                        flexShrink: 0, whiteSpace: 'nowrap',
                      }}>
                        {ready ? 'Prêt 🌟' : 'En attente'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', borderTop: '1px solid #F1F5F9' }}>
                      <button
                        onClick={() => setFeedbackTarget({ seance: s, patient: s.patient })}
                        style={{ flex: 1, padding: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: ready ? '#16A34A' : '#D97706', fontSize: 12, fontWeight: 600 }}
                      >
                        ⚡ Feedback
                      </button>
                      <div style={{ width: 1, background: '#F1F5F9' }} />
                      <button style={{ flex: 1, padding: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, fontWeight: 600 }}>
                        {ready ? 'Ignorer' : 'Plus tard'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* DESKTOP — existing content */}
            <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Today's RDVs — send confirmation */}
                <section>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                    📅 RDV aujourd'hui — Confirmations
                  </h2>
                  {rdvsAujourdhui.length === 0 ? (
                    <div style={{ padding: 20, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, color: '#64748B', fontSize: 14, textAlign: 'center' }}>
                      Aucun RDV aujourd'hui.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {rdvsAujourdhui.map((rdv: any) => (
                        <div key={rdv.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                              {rdv.patient?.prenom} {rdv.patient?.nom}
                            </div>
                            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                              {formatTime(rdv.date)} · {rdv.typeSeance} · Dr. {rdv.praticien?.nom}
                            </div>
                          </div>
                          {rdv.patient?.telephone ? (
                            <WhatsAppButton
                              phone={rdv.patient.telephone}
                              message={msgConfirmationRDV({
                                prenom: rdv.patient.prenom,
                                date: new Date(rdv.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
                                heure: formatTime(rdv.date),
                                typeSeance: rdv.typeSeance,
                                praticien: rdv.praticien ? `${rdv.praticien.prenom} ${rdv.praticien.nom}` : '',
                                duree: rdv.duree || 45,
                              })}
                              type="confirmation_rdv"
                              patientId={rdv.patient.id}
                              patientNom={`${rdv.patient.prenom} ${rdv.patient.nom}`}
                              label="Envoyer confirmation"
                              size="sm"
                            />
                          ) : (
                            <span style={{ fontSize: 12, color: '#94A3B8' }}>Pas de téléphone</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Completed séances without feedback */}
                <section>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                    ⚡ Séances sans feedback — En attente
                  </h2>
                  {seancesAttente.length === 0 ? (
                    <div style={{ padding: 20, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, color: '#16A34A', fontSize: 14, textAlign: 'center', fontWeight: 500 }}>
                      ✓ Tous les feedbacks ont été enregistrés !
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {seancesAttente.map((s: any) => (
                        <div key={s.id} style={{ background: 'white', border: '1px solid #FCD34D', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                              {s.patient?.prenom} {s.patient?.nom}
                            </div>
                            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                              {formatDate(s.date)} à {formatTime(s.date)} · {s.typeSeance}
                            </div>
                          </div>
                          <button
                            onClick={() => setFeedbackTarget({ seance: s, patient: s.patient })}
                            style={{ background: '#F59E0B', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>
                            ⚡ Feedback
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>)}

            {/* ── Tab 2: Rappels demain ── */}
            {tab === 'rappels' && (
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                  🔔 RDV de demain — Rappels WhatsApp
                </h2>
                {rdvsDemain.length === 0 ? (
                  <div style={{ padding: 32, background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, color: '#64748B', fontSize: 14, textAlign: 'center' }}>
                    Aucun RDV planifié pour demain.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rdvsDemain.map((rdv: any) => (
                      <div key={rdv.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                            {rdv.patient?.prenom} {rdv.patient?.nom}
                          </div>
                          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                            {formatTime(rdv.date)} · {rdv.typeSeance} · {rdv.salle || 'Salle ?'} · Dr. {rdv.praticien?.nom}
                          </div>
                          {rdv.patient?.telephone && (
                            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                              📱 {rdv.patient.telephone}
                            </div>
                          )}
                        </div>
                        {rdv.patient?.telephone ? (
                          <WhatsAppButton
                            phone={rdv.patient.telephone}
                            message={msgRappelRDV({
                              prenom: rdv.patient.prenom,
                              date: new Date(rdv.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
                              heure: formatTime(rdv.date),
                              typeSeance: rdv.typeSeance,
                              praticien: rdv.praticien ? `${rdv.praticien.prenom} ${rdv.praticien.nom}` : '',
                            })}
                            type="rappel_rdv"
                            patientId={rdv.patient.id}
                            patientNom={`${rdv.patient.prenom} ${rdv.patient.nom}`}
                            label="Envoyer rappel"
                            size="sm"
                          />
                        ) : (
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>Pas de téléphone</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab 3: Feedback prêt ── */}
            {tab === 'ready' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Pending counter */}
                {pendingSeances.length > 0 && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>⏳</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: '#92400E', fontSize: 13 }}>
                        {pendingSeances.length} séance{pendingSeances.length > 1 ? 's' : ''} en préparation
                      </p>
                      <p style={{ margin: 0, color: '#B45309', fontSize: 12 }}>
                        Le feedback sera prêt ~20 min après la fin de la séance.
                      </p>
                    </div>
                  </div>
                )}

                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  ⭐ Prêts à envoyer — {readySeances.length} patient{readySeances.length !== 1 ? 's' : ''}
                </h2>

                {readySeances.length === 0 ? (
                  <div style={{ padding: 40, background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, color: '#64748B', fontSize: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                    <p style={{ margin: 0, fontWeight: 500 }}>Aucun feedback prêt pour le moment</p>
                    <p style={{ margin: '6px 0 0', fontSize: 13 }}>Terminez une séance pour déclencher le minuteur de 20 min</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {readySeances.map((s: any) => (
                      <div key={s.id} style={{
                        background: 'white',
                        border: '1px solid #DDD6FE',
                        borderLeft: '4px solid #8B5CF6',
                        borderRadius: 10,
                        padding: '16px 18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>
                              {s.patient?.prenom} {s.patient?.nom}
                            </span>
                            <span style={{ background: '#EDE9FE', color: '#7C3AED', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                              Prêt
                            </span>
                            {s.feedbackReadyAt && <CountdownBadge since={s.feedbackReadyAt} />}
                          </div>
                          <div style={{ fontSize: 13, color: '#64748B' }}>
                            Dr. {s.praticien?.prenom} {s.praticien?.nom}
                            {s.patient?.telephone && (
                              <span style={{ marginLeft: 10, color: '#94A3B8' }}>📱 {s.patient.telephone}</span>
                            )}
                          </div>
                          {s.feedbackToken && (
                            <div style={{ fontSize: 11, color: '#8B5CF6', marginTop: 4, fontFamily: 'monospace' }}>
                              🔗 {APP_URL}/feedback/{s.feedbackToken.slice(0, 12)}...
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                          {s.patient?.telephone && s.feedbackToken ? (
                            <a
                              href={buildWhatsAppUrl(
                                s.patient.telephone,
                                msgFeedbackAuto({
                                  prenom: s.patient.prenom,
                                  feedbackUrl: `${APP_URL}/feedback/${s.feedbackToken}`,
                                })
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: '#25D366', color: 'white',
                                padding: '8px 16px', borderRadius: 8,
                                fontSize: 13, fontWeight: 700, textDecoration: 'none',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <WhatsAppSvg size={14} /> Envoyer le lien
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: '#94A3B8' }}>Pas de téléphone</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab 4: Historique feedbacks ── */}
            {tab === 'historique' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Stats overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Score moyen', value: avgScore !== null ? `${avgScore}/10` : '—', color: '#2563EB', bg: '#EFF6FF' },
                    { label: '🟢 Excellent', value: excellent, color: '#16A34A', bg: '#F0FDF4' },
                    { label: '🟡 Moyen',     value: moyen,     color: '#D97706', bg: '#FFFBEB' },
                    { label: '🔴 Difficile', value: difficile, color: '#DC2626', bg: '#FEF2F2' },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} style={{ background: bg, border: `1px solid ${color}30`, borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Score distribution bar */}
                {feedbacks.length > 0 && (
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Distribution des scores</h3>
                    <div style={{ display: 'flex', gap: 3, height: 32, borderRadius: 8, overflow: 'hidden' }}>
                      {[
                        { count: difficile, color: '#EF4444', label: 'Difficile' },
                        { count: moyen,     color: '#F59E0B', label: 'Moyen' },
                        { count: excellent, color: '#22C55E', label: 'Excellent' },
                      ].map(({ count, color, label }) => {
                        const pct = feedbacks.length > 0 ? Math.round((count / feedbacks.length) * 100) : 0
                        if (pct === 0) return null
                        return (
                          <div key={label} style={{ flex: count, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}
                            title={`${label}: ${count} (${pct}%)`}>
                            {pct >= 10 ? `${pct}%` : ''}
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                      {[
                        { label: `Difficile (1-4)`, count: difficile, color: '#EF4444' },
                        { label: `Moyen (5-7)`, count: moyen, color: '#F59E0B' },
                        { label: `Excellent (8-10)`, count: excellent, color: '#22C55E' },
                      ].map(({ label, count, color }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                          {label} — {count}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Low-score follow-up */}
                {lowScoreSeances.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#DC2626', marginBottom: 10 }}>
                      🔴 Patients à recontacter — Score ≤ 4
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {lowScoreSeances.map((s: any) => {
                        const badge = scoreBadge(s.scorePatient)
                        return (
                          <div key={s.id} style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                                  {s.patient?.prenom} {s.patient?.nom}
                                </span>
                                <span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                                  {badge.emoji} {s.scorePatient}/10
                                </span>
                              </div>
                              <div style={{ fontSize: 13, color: '#64748B' }}>
                                {formatDate(s.date)} · {s.typeSeance}
                                {s.feedbackEnvoye && <span style={{ marginLeft: 8, color: '#16A34A', fontSize: 12 }}>✓ WhatsApp envoyé</span>}
                              </div>
                              {s.notesInternes && (
                                <div style={{ fontSize: 12, color: '#92400E', marginTop: 4, fontStyle: 'italic' }}>
                                  Note: {s.notesInternes}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setFeedbackTarget({ seance: s, patient: s.patient })}
                              style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>
                              ⚡ Suivi
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* All feedbacks list */}
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 10 }}>
                    Tous les feedbacks — {feedbacks.length} au total
                  </h3>
                  {feedbacks.length === 0 ? (
                    <div style={{ padding: 24, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, color: '#64748B', fontSize: 14, textAlign: 'center' }}>
                      Aucun feedback enregistré.
                    </div>
                  ) : (
                    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                      {feedbacks
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 30)
                        .map((f: any, i: number) => {
                          const badge = scoreBadge(f.score)
                          return (
                            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: i < feedbacks.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                              <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {badge.emoji} {f.score}/10
                              </span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>
                                  {f.patient?.prenom} {f.patient?.nom}
                                </div>
                                {f.commentaire && (
                                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontStyle: 'italic' }}>
                                    « {f.commentaire} »
                                  </div>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                                {formatDate(f.createdAt)}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* FeedbackModal */}
      {feedbackTarget && (
        <FeedbackModal
          seance={feedbackTarget.seance}
          patient={feedbackTarget.patient}
          praticienNom={
            feedbackTarget.seance.praticien
              ? `${feedbackTarget.seance.praticien.prenom} ${feedbackTarget.seance.praticien.nom}`
              : undefined
          }
          onClose={() => setFeedbackTarget(null)}
          onSaved={() => { setFeedbackTarget(null); fetchAll() }}
        />
      )}
    </div>
  )
}
