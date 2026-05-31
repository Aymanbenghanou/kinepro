'use client'

import { useState, useEffect, useMemo, use as usePromise } from 'react'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { formatDate, formatMoney } from '@/lib/utils'
import { ArrowLeft, Download, Wallet, Trash2 } from 'lucide-react'
import { generateFacturePDF } from '@/lib/pdf-utils'
import { STATUT_LABELS, MODE_PAIEMENT, type FactureStatut } from '@/lib/facture-statut'
import PaymentModal from '@/components/facturation/PaymentModal'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'

export default function FactureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params)

  const [facture, setFacture] = useState<any>(null)
  const [cabinet, setCabinet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  async function load() {
    setLoading(true)
    try {
      const r = await fetch(`/api/facturation/${id}`)
      const d = await r.json()
      if (r.ok) setFacture(d)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { fetch('/api/cabinet').then(r => r.json()).then(setCabinet).catch(() => {}) }, [])

  const reste = useMemo(() => facture ? Math.max(0, facture.montant - (facture.montantPaye ?? 0)) : 0, [facture])
  const pct   = useMemo(() => facture && facture.montant > 0 ? Math.min(100, (facture.montantPaye / facture.montant) * 100) : 0, [facture])

  async function exportPDF() {
    if (!facture) return
    const qrUrl = facture.patient?.publicToken ? `${APP_URL}/scan/${facture.patient.publicToken}` : undefined
    await generateFacturePDF(facture, cabinet, qrUrl)
  }

  if (loading) return <div><Topbar title="Facture" /><div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Chargement…</div></div>
  if (!facture) return <div><Topbar title="Facture" /><div style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}>Facture introuvable</div></div>

  const s = STATUT_LABELS[facture.statut as FactureStatut] ?? { label: facture.statut, bg: '#F1F5F9', color: '#64748B', icon: '' }
  const initials = `${facture.patient?.prenom?.[0] ?? ''}${facture.patient?.nom?.[0] ?? ''}`.toUpperCase()

  return (
    <div>
      <Topbar title="Détail facture" subtitle={`Facture #${facture.id.slice(-8)}`} />
      <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>

        <Link href="/facturation" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#475569', textDecoration: 'none', fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
          <ArrowLeft size={14} /> Retour à la liste
        </Link>

        {/* Header card */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 2px 12px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#1E40AF)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>{initials}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{facture.patient?.prenom} {facture.patient?.nom}</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>
                  {facture.seance?.seanceType?.nom || facture.seance?.typeSeance || 'Facture'} · {formatDate(facture.dateEmise)}
                </div>
              </div>
            </div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: s.bg, color: s.color, padding: '6px 14px', borderRadius: 999,
              fontSize: 13, fontWeight: 700,
            }}>
              <span>{s.icon}</span> {s.label}
            </span>
          </div>

          {/* Big progress */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatMoney(facture.montantPaye)} <span style={{ color: '#64748B', fontWeight: 600 }}>/ {formatMoney(facture.montant)}</span></span>
              <span style={{ fontWeight: 700, color: pct >= 100 ? '#16A34A' : '#F59E0B' }}>{Math.round(pct)}%</span>
            </div>
            <div style={{ height: 14, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: pct >= 100 ? 'linear-gradient(90deg,#22C55E,#16A34A)' : 'linear-gradient(90deg,#FBBF24,#F59E0B)',
                transition: 'width 0.4s',
              }} />
            </div>
            <div style={{ marginTop: 10, fontSize: 14, color: reste > 0 ? '#DC2626' : '#16A34A', fontWeight: 700 }}>
              {reste > 0 ? `${formatMoney(reste)} restants` : 'Entièrement payée 🎉'}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {reste > 0 && (
              <button onClick={() => setShowPayment(true)} style={btnPrimary}>
                <Wallet size={15} /> Enregistrer un paiement
              </button>
            )}
            <button onClick={exportPDF} style={btnSecondary}>
              <Download size={15} /> Générer PDF
            </button>
          </div>
        </div>

        {/* Payment history */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 0' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Historique des paiements
              {facture.paiements?.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>({facture.paiements.length})</span>
              )}
            </h3>
          </div>

          {facture.paiements?.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
              Aucun paiement enregistré pour le moment.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderTop: '1px solid #F1F5F9', borderBottom: '1.5px solid #E2E8F0', background: '#F8FAFC' }}>
                    <th style={th}>Date</th>
                    <th style={{ ...th, textAlign: 'right' }}>Montant</th>
                    <th style={th}>Mode</th>
                    <th style={th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {facture.paiements.map((p: any) => {
                    const m = MODE_PAIEMENT[p.modePaiement as keyof typeof MODE_PAIEMENT] ?? { label: p.modePaiement, icon: '💰', color: '#64748B' }
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={td}>{formatDate(p.datePaiement)}</td>
                        <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: '#16A34A' }}>+{formatMoney(p.montant)}</td>
                        <td style={td}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: `${m.color}15`, color: m.color,
                            padding: '4px 11px', borderRadius: 999,
                            fontSize: 12.5, fontWeight: 700,
                          }}>
                            <span>{m.icon}</span> {m.label}
                          </span>
                        </td>
                        <td style={{ ...td, color: '#64748B', fontStyle: p.notes ? 'normal' : 'italic' }}>
                          {p.notes || <span style={{ color: '#CBD5E1' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#F8FAFC' }}>
                    <td style={{ ...td, fontWeight: 700, color: '#64748B' }}>Total payé</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: '#16A34A', fontSize: 15 }}>{formatMoney(facture.montantPaye)}</td>
                    <td colSpan={2} />
                  </tr>
                  <tr>
                    <td style={{ ...td, fontWeight: 700, color: '#64748B' }}>Reste dû</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 800, color: reste > 0 ? '#DC2626' : '#16A34A', fontSize: 15 }}>{formatMoney(reste)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          facture={facture}
          onClose={() => setShowPayment(false)}
          onSuccess={msg => { showToast(msg); load() }}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 250, background: '#0F172A', color: 'white', padding: '14px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, boxShadow: '0 14px 36px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }
const td: React.CSSProperties = { padding: '14px 16px', color: '#0F172A', verticalAlign: 'middle' }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 11, background: '#16A34A', color: 'white', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 11, background: 'white', color: '#475569', border: '1.5px solid #E2E8F0', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
