'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Check, Crown, Copy, Star } from 'lucide-react'
import { getBankMeta, formatRib } from '@/lib/banks'
import { BankLogo } from '@/components/BankLogo'

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

function PlanCard({
  name, price, period, features, highlight, onSelect, selected,
}: {
  name: string
  price: string
  period: string
  features: string[]
  highlight?: boolean
  onSelect: () => void
  selected: boolean
}) {
  return (
    <div style={{
      border: `2px solid ${highlight ? '#2563EB' : '#E2E8F0'}`,
      borderRadius: 16, padding: 28,
      background: highlight ? '#EFF6FF' : 'white',
      flex: 1, position: 'relative', cursor: 'pointer',
      transition: 'box-shadow 0.2s',
      boxShadow: selected ? '0 0 0 3px #2563EB' : 'none',
    }} onClick={onSelect}>
      {highlight && (
        <div style={{
          position: 'absolute', top: -14, left: 12, right: 12,
          background: '#2563EB', color: 'white',
          fontSize: 10.5, fontWeight: 700,
          padding: '3px 10px', borderRadius: 99,
          textAlign: 'center',
          maxWidth: 'calc(100% - 24px)',
          overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          ⭐ MEILLEUR RAPPORT QUALITÉ-PRIX
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>{name}</h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'nowrap', minWidth: 0 }}>
          <span style={{
            fontSize: 'clamp(24px, 7vw, 32px)',
            fontWeight: 800, color: '#2563EB',
            whiteSpace: 'nowrap',
          }}>
            {/* espace insécable U+00A0 pour empêcher le retour à la ligne dans "2 499" */}
            {price.replace(/ /g, ' ')}
          </span>
          <span style={{ fontSize: 13, color: '#64748B', whiteSpace: 'nowrap' }}>
            MAD / {period}
          </span>
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#374151' }}>
            <Check size={14} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
            {f}
          </li>
        ))}
      </ul>
      <div style={{
        padding: '8px 0', textAlign: 'center', borderRadius: 8, fontWeight: 700, fontSize: 14,
        background: selected ? '#2563EB' : 'transparent',
        color: selected ? 'white' : '#2563EB',
        border: `2px solid #2563EB`,
      }}>
        {selected ? '✓ Sélectionné' : 'Choisir ce plan'}
      </div>
    </div>
  )
}

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

export default function AbonnementPage() {
  const { data: session } = useSession()
  const [selected, setSelected] = useState<'mensuel' | 'annuel'>('annuel')
  const [sent,     setSent]     = useState(false)
  const [sending,  setSending]  = useState(false)
  const [accounts, setAccounts] = useState<BankInfo[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [loadingBanks, setLoadingBanks] = useState(true)

  const user   = session?.user
  const status = user?.subscriptionStatus ?? 'TRIAL'
  const days   = user?.trialDaysLeft

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

  const amount = selected === 'mensuel' ? '299 MAD' : '2 499 MAD'

  async function handleVirementDone() {
    setSending(true)
    const montant = selected === 'mensuel' ? '299 MAD/mois' : '2499 MAD/an'
    const msg = encodeURIComponent(
      `🏥 *Nouveau virement KinéPro*\n\n` +
      `Cabinet: ${user?.cabinetId ?? 'N/A'}\n` +
      `Utilisateur: ${user?.prenom} ${user?.nom} (${user?.email})\n` +
      `Plan sélectionné: ${selected === 'mensuel' ? 'Mensuel' : 'Annuel'} — ${montant}\n\n` +
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
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Crown size={24} color="#2563EB" />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>Abonnement</h1>
          </div>
          {status === 'TRIAL' && days != null && days >= 0 && (
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              Votre essai gratuit se termine dans <strong>{days} jour{days > 1 ? 's' : ''}</strong>. Choisissez un plan pour continuer.
            </p>
          )}
          {(status === 'TRIAL' && (days == null || days < 0)) && (
            <p style={{ fontSize: 14, color: '#DC2626', margin: 0, fontWeight: 600 }}>
              ⚠️ Votre essai gratuit est expiré. Choisissez un plan pour retrouver l'accès complet.
            </p>
          )}
          {status === 'ACTIVE' && (
            <p style={{ fontSize: 14, color: '#16A34A', margin: 0, fontWeight: 600 }}>
              ✅ Votre abonnement est actif.
            </p>
          )}
        </div>

        {/* Plan cards */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
          <PlanCard
            name="Mensuel" price="299" period="mois"
            features={[
              'Accès complet à toutes les fonctionnalités',
              'Patients illimités', 'Agenda & séances',
              'Facturation & rapports', 'WhatsApp intégré', 'Support par email',
            ]}
            selected={selected === 'mensuel'}
            onSelect={() => setSelected('mensuel')}
          />
          <PlanCard
            name="Annuel" price="2 499" period="an"
            features={[
              'Tout le plan Mensuel inclus',
              '2 mois offerts (économisez 1 090 MAD)',
              'Support prioritaire',
              'Accès anticipé aux nouvelles fonctionnalités',
              "Formation d'intégration offerte",
              'Facturation annuelle unique',
            ]}
            highlight
            selected={selected === 'annuel'}
            onSelect={() => setSelected('annuel')}
          />
        </div>

        {/* Payment section */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
            💳 Comment payer ?
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748B', margin: '0 0 18px' }}>
            Effectuez un virement bancaire vers l'un de nos comptes ci-dessous, puis cliquez sur "J'ai effectué le virement".
            Votre accès sera activé dans les 24h ouvrées.
          </p>

          {loadingBanks ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 14, background: 'white', borderRadius: 14, border: '1px solid #E2E8F0' }}>
              Chargement des coordonnées bancaires...
            </div>
          ) : accounts.length === 0 ? (
            <div style={{ padding: 24, background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, color: '#92400E', fontSize: 14, fontWeight: 600 }}>
              ⚠️ Aucun compte bancaire n'est configuré pour le moment. Veuillez contacter le support sur WhatsApp.
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
              ✅ J'ai effectué le virement — Notifier l'équipe KinéPro
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
