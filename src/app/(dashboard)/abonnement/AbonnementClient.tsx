'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Check, Crown, Copy, Star } from 'lucide-react'
import { getBankMeta, formatRib } from '@/lib/banks'
import { BankLogo } from '@/components/BankLogo'
import { PRIX, type Plan } from '@/lib/abonnement'

const SUPER_ADMIN_WA = process.env.NEXT_PUBLIC_SUPER_ADMIN_WA || '212600000000'

interface BankInfo {
  id: string
  bankName: string
  accountHolder: string
  rib: string
  iban?: string | null
  swift?: string | null
  city?: string | null
  isDefault: boolean
}

type DemandeInfo = { plan: string; billingCycle: string; montant: number } | null

function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') // espace insécable
}
const PLAN_LABEL: Record<string, string> = { starter: 'Starter', pro: 'Pro' }
const CYCLE_LABEL: Record<string, string> = { monthly: 'mensuel', annual: 'annuel' }

// ── Carte plan (informative) — affiche les deux prix via les constantes partagées ──
function PlanCard({ plan, highlight }: { plan: Plan; highlight?: boolean }) {
  const features = plan === 'starter'
    ? ['Dossiers patients', 'Agenda & séances', 'Facturation', 'Rappels WhatsApp', 'Réservation en ligne', 'Rapports']
    : ['Tout du plan Starter', "Programmes d'exercices IA", 'Upload de documents', 'Support prioritaire']
  return (
    <div style={{
      border: `2px solid ${highlight ? '#2563EB' : '#E2E8F0'}`,
      borderRadius: 16, padding: 28, background: highlight ? '#EFF6FF' : 'white',
      flex: 1, position: 'relative', minWidth: 240,
    }}>
      {highlight && (
        <div style={{
          position: 'absolute', top: -14, left: 12, right: 12, background: '#2563EB', color: 'white',
          fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 99, textAlign: 'center',
          maxWidth: 'calc(100% - 24px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          ⭐ RECOMMANDÉ
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>{PLAN_LABEL[plan]}</h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 800, color: '#2563EB', whiteSpace: 'nowrap' }}>
            {fmt(PRIX[plan].monthly)} DH
          </span>
          <span style={{ fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>/ mois</span>
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
          ou <strong style={{ color: '#0F172A' }}>{fmt(PRIX[plan].annual)} DH</strong> / an <span style={{ color: '#16A34A', fontWeight: 700 }}>(2 mois offerts)</span>
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#374151' }}>
            <Check size={14} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Carte banque — PRÉSERVÉE telle quelle (affichage RIB/virement inchangé) ──
function BankCard({ acc, amount }: { acc: BankInfo; amount: string }) {
  const meta = getBankMeta(acc.bankName)
  const [copied, setCopied] = useState(false)

  function copyRib() {
    navigator.clipboard.writeText(acc.rib)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: 'white', borderRadius: 14, border: '1px solid #E2E8F0',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    }}>
      {/* Header strip with brand color */}
      <div style={{ background: meta.color, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <BankLogo bankName={acc.bankName} size={48} />
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.bankName}</span>
        </div>
        {acc.isDefault && (
          <span style={{ background: 'rgba(255,255,255,0.22)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Star size={11} fill="white" /> Recommandé
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '10px 12px', fontSize: 13.5 }}>
          <span style={{ color: '#64748B', fontWeight: 600 }}>Titulaire</span>
          <span style={{ color: '#0F172A', fontWeight: 600 }}>{acc.accountHolder}</span>

          <span style={{ color: '#64748B', fontWeight: 600 }}>RIB</span>
          <span style={{ color: '#0F172A', fontFamily: 'ui-monospace, monospace', fontWeight: 700, wordBreak: 'break-all' }}>
            {formatRib(acc.rib)}
          </span>

          {acc.iban && (<>
            <span style={{ color: '#64748B', fontWeight: 600 }}>IBAN</span>
            <span style={{ color: '#0F172A', fontFamily: 'ui-monospace, monospace', fontSize: 12.5, wordBreak: 'break-all' }}>{acc.iban}</span>
          </>)}

          {acc.swift && (<>
            <span style={{ color: '#64748B', fontWeight: 600 }}>SWIFT</span>
            <span style={{ color: '#0F172A', fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }}>{acc.swift}</span>
          </>)}

          {acc.city && (<>
            <span style={{ color: '#64748B', fontWeight: 600 }}>Agence</span>
            <span style={{ color: '#0F172A' }}>{acc.city}</span>
          </>)}

          <span style={{ color: '#64748B', fontWeight: 600 }}>Montant</span>
          <span style={{ color: '#0F172A', fontWeight: 800 }}>{amount}</span>
        </div>

        <button onClick={copyRib} style={{
          marginTop: 16, width: '100%', padding: '11px 16px',
          background: copied ? '#16A34A' : '#F1F5F9',
          color: copied ? 'white' : '#0F172A',
          border: 'none', borderRadius: 10, cursor: 'pointer',
          fontWeight: 700, fontSize: 13.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.2s, color 0.2s',
        }}>
          {copied ? <><Check size={15} /> Copié !</> : <><Copy size={15} /> Copier le RIB</>}
        </button>
      </div>
    </div>
  )
}

export default function AbonnementClient({ demande }: { demande: DemandeInfo }) {
  const { data: session } = useSession()
  const [sent,     setSent]     = useState(false)
  const [sending,  setSending]  = useState(false)
  const [accounts, setAccounts] = useState<BankInfo[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [loadingBanks, setLoadingBanks] = useState(true)

  const user = session?.user

  useEffect(() => {
    fetch('/api/payment-info')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setAccounts(data)
          if (data.length > 0) setActiveTab(data[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBanks(false))
  }, [])

  // Montant à virer : vient de la demande (calculé serveur), jamais recalculé ici.
  const amount = demande ? `${fmt(demande.montant)} DH` : '—'

  async function handleVirementDone() {
    setSending(true)
    const planTxt = demande
      ? `${PLAN_LABEL[demande.plan] ?? demande.plan} — ${CYCLE_LABEL[demande.billingCycle] ?? demande.billingCycle} — ${fmt(demande.montant)} DH`
      : 'non spécifié'
    const msg = encodeURIComponent(
      `🏥 *Nouveau virement KinéPro*\n\n` +
      `Cabinet: ${user?.cabinetId ?? 'N/A'}\n` +
      `Utilisateur: ${user?.prenom} ${user?.nom} (${user?.email})\n` +
      `Plan demandé: ${planTxt}\n\n` +
      `Veuillez vérifier le virement et activer l'abonnement.`
    )
    window.open(`https://wa.me/${SUPER_ADMIN_WA}?text=${msg}`, '_blank')
    setSent(true)
    setSending(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px 24px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Crown size={24} color="#2563EB" />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>Abonnement</h1>
          </div>
        </div>

        {/* Bloc montant à virer — demande en cours */}
        {demande && (
          <div style={{
            background: 'linear-gradient(135deg, #1E3A5F, #2563EB)', color: 'white',
            borderRadius: 16, padding: '22px 26px', marginBottom: 28,
            boxShadow: '0 8px 28px rgba(37,99,235,0.25)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85, marginBottom: 6 }}>
              Votre demande : <strong>{PLAN_LABEL[demande.plan] ?? demande.plan}</strong> — {CYCLE_LABEL[demande.billingCycle] ?? demande.billingCycle}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, opacity: 0.85 }}>Montant à virer :</span>
              <span style={{ fontSize: 'clamp(30px, 8vw, 40px)', fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap' }}>{fmt(demande.montant)} DH</span>
            </div>
          </div>
        )}

        {/* Plans Starter / Pro (informatif) */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
          <PlanCard plan="starter" />
          <PlanCard plan="pro" highlight />
        </div>

        {/* Payment section — PRÉSERVÉE (banques / RIB) */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
            💳 Comment payer ?
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748B', margin: '0 0 18px' }}>
            Effectuez un virement bancaire vers l&apos;un de nos comptes ci-dessous, puis cliquez sur &quot;J&apos;ai effectué le virement&quot;.
            Votre accès sera activé dans les 24h ouvrées.
          </p>

          {loadingBanks ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 14, background: 'white', borderRadius: 14, border: '1px solid #E2E8F0' }}>
              Chargement des coordonnées bancaires...
            </div>
          ) : accounts.length === 0 ? (
            <div style={{ padding: 24, background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, color: '#92400E', fontSize: 14, fontWeight: 600 }}>
              ⚠️ Aucun compte bancaire n&apos;est configuré pour le moment. Veuillez contacter le support sur WhatsApp.
            </div>
          ) : accounts.length === 1 ? (
            <BankCard acc={accounts[0]} amount={amount} />
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {accounts.map(acc => {
                  const meta = getBankMeta(acc.bankName)
                  const isActive = activeTab === acc.id
                  return (
                    <button
                      key={acc.id} onClick={() => setActiveTab(acc.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '7px 14px 7px 7px',
                        background: isActive ? meta.color : 'white',
                        color:      isActive ? 'white'    : '#475569',
                        border: `1.5px solid ${isActive ? meta.color : '#E2E8F0'}`,
                        borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <BankLogo bankName={acc.bankName} size={28} />
                      {acc.bankName}
                      {acc.isDefault && <Star size={11} fill={isActive ? 'white' : '#F59E0B'} color={isActive ? 'white' : '#F59E0B'} />}
                    </button>
                  )
                })}
              </div>
              {accounts.filter(a => a.id === activeTab).map(acc => (
                <BankCard key={acc.id} acc={acc} amount={amount} />
              ))}
            </>
          )}

          <p style={{ fontSize: 13, color: '#64748B', margin: '18px 0 14px', textAlign: 'center' }}>
            Après le virement, cliquez ci-dessous pour notifier notre équipe.
          </p>

          {sent ? (
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: 16,
              fontSize: 14, color: '#166534', fontWeight: 600, textAlign: 'center',
            }}>
              ✅ Merci ! Notre équipe a été notifiée. Votre abonnement sera activé dans les 24h ouvrées.
            </div>
          ) : (
            <button
              onClick={handleVirementDone}
              disabled={sending || accounts.length === 0}
              style={{
                width: '100%', padding: '15px', borderRadius: 12,
                background: sending || accounts.length === 0 ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: 'white', border: 'none', fontWeight: 700, fontSize: 15,
                cursor: sending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
              }}
            >
              ✅ J&apos;ai effectué le virement — Notifier l&apos;équipe KinéPro
            </button>
          )}
        </div>

        {/* FAQ */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Questions fréquentes</h3>
          {[
            { q: 'Quand mon accès sera-t-il activé ?', a: 'Sous 24h ouvrées après réception et vérification de votre virement.' },
            { q: 'Puis-je annuler mon abonnement ?', a: "Oui, à tout moment. Il n'y a aucun engagement minimum. Contactez-nous par WhatsApp." },
            { q: 'Mes données sont-elles sécurisées ?', a: 'Oui. Vos données sont isolées et chiffrées. Nous sommes conformes RGPD.' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 16 : 0, paddingBottom: i < 2 ? 16 : 0, borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>{item.q}</p>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
