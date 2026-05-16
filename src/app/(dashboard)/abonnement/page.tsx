'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Check, Crown, Building2, Copy } from 'lucide-react'

const SUPER_ADMIN_WA = process.env.NEXT_PUBLIC_SUPER_ADMIN_WA || '212600000000'

const RIB = {
  banque:   'Attijariwafa Bank',
  rib:      '007 780 0001234567890 12',
  titulaire:'KinéPro SARL',
  ref:      'ABONNEMENT KINEPRO',
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
      borderRadius: 16,
      padding: 28,
      background: highlight ? '#EFF6FF' : 'white',
      flex: 1,
      position: 'relative',
      cursor: 'pointer',
      transition: 'box-shadow 0.2s',
      boxShadow: selected ? '0 0 0 3px #2563EB' : 'none',
    }} onClick={onSelect}>
      {highlight && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: '#2563EB', color: 'white',
          fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 99,
          whiteSpace: 'nowrap',
        }}>
          ⭐ MEILLEUR RAPPORT QUALITÉ-PRIX
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>{name}</h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: '#2563EB' }}>{price}</span>
          <span style={{ fontSize: 14, color: '#64748B' }}>MAD / {period}</span>
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
        border: `2px solid ${selected ? '#2563EB' : '#2563EB'}`,
      }}>
        {selected ? '✓ Sélectionné' : 'Choisir ce plan'}
      </div>
    </div>
  )
}

export default function AbonnementPage() {
  const { data: session } = useSession()
  const [selected, setSelected]   = useState<'mensuel' | 'annuel'>('annuel')
  const [copied,   setCopied]     = useState(false)
  const [sent,     setSent]       = useState(false)
  const [sending,  setSending]    = useState(false)

  const user   = session?.user
  const status = user?.subscriptionStatus ?? 'TRIAL'
  const days   = user?.trialDaysLeft

  function copyRib() {
    navigator.clipboard.writeText(RIB.rib)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
    // Notify SUPER_ADMIN via WhatsApp
    window.open(`https://wa.me/${SUPER_ADMIN_WA}?text=${msg}`, '_blank')
    setSent(true)
    setSending(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Crown size={24} color="#2563EB" />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>Abonnement</h1>
          </div>
          {status === 'TRIAL' && days != null && days >= 0 && (
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              Votre essai gratuit se termine dans <strong>{days} jour{days > 1 ? 's' : ''}</strong>.
              Choisissez un plan pour continuer.
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
        <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
          <PlanCard
            name="Mensuel"
            price="299"
            period="mois"
            features={[
              'Accès complet à toutes les fonctionnalités',
              'Patients illimités',
              'Agenda & séances',
              'Facturation & rapports',
              'WhatsApp intégré',
              'Support par email',
            ]}
            selected={selected === 'mensuel'}
            onSelect={() => setSelected('mensuel')}
          />
          <PlanCard
            name="Annuel"
            price="2 499"
            period="an"
            features={[
              'Tout le plan Mensuel inclus',
              '2 mois offerts (économisez 1 090 MAD)',
              'Support prioritaire',
              'Accès anticipé aux nouvelles fonctionnalités',
              'Formation d\'intégration offerte',
              'Facturation annuelle unique',
            ]}
            highlight
            selected={selected === 'annuel'}
            onSelect={() => setSelected('annuel')}
          />
        </div>

        {/* Payment instructions */}
        <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #E2E8F0', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>
            💳 Paiement par virement bancaire
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px' }}>
            Effectuez un virement bancaire avec les informations ci-dessous, puis cliquez sur "J'ai effectué le virement".
            Votre accès sera activé dans les 24h ouvrées.
          </p>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px 16px', fontSize: 14 }}>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Banque</span>
              <span style={{ color: '#0F172A' }}>{RIB.banque}</span>
              <span style={{ color: '#64748B', fontWeight: 600 }}>RIB</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#0F172A', fontFamily: 'monospace', fontWeight: 600 }}>{RIB.rib}</span>
                <button onClick={copyRib} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#16A34A' : '#2563EB', padding: 0 }}>
                  <Copy size={14} />
                </button>
                {copied && <span style={{ fontSize: 11, color: '#16A34A' }}>Copié !</span>}
              </span>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Titulaire</span>
              <span style={{ color: '#0F172A' }}>{RIB.titulaire}</span>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Montant</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                {selected === 'mensuel' ? '299 MAD' : '2 499 MAD'}
              </span>
              <span style={{ color: '#64748B', fontWeight: 600 }}>Référence</span>
              <span style={{ color: '#0F172A' }}>{RIB.ref}</span>
            </div>
          </div>

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
              disabled={sending}
              style={{
                width: '100%', padding: '14px', borderRadius: 10,
                background: sending ? '#93C5FD' : '#2563EB',
                color: 'white', border: 'none', fontWeight: 700, fontSize: 15,
                cursor: sending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              📱 J'ai effectué le virement — Notifier l'équipe KinéPro
            </button>
          )}
        </div>

        {/* FAQ */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Questions fréquentes</h3>
          {[
            {
              q: 'Quand mon accès sera-t-il activé ?',
              a: 'Sous 24h ouvrées après réception et vérification de votre virement.',
            },
            {
              q: 'Puis-je annuler mon abonnement ?',
              a: 'Oui, à tout moment. Il n\'y a aucun engagement minimum. Contactez-nous par WhatsApp.',
            },
            {
              q: 'Mes données sont-elles sécurisées ?',
              a: 'Oui. Vos données sont isolées et chiffrées. Nous sommes conformes RGPD.',
            },
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
