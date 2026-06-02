import { CabinetPlan, CabinetPlanStatus } from '@prisma/client'
import { getPlanState, getTrialDaysLeft, type CabinetPlanInfo } from '@/lib/plan'
import { getContactCtaUrl } from '@/lib/contact-cta'

const PLAN_LABEL: Record<CabinetPlan, string> = {
  trial:   'Essai',
  starter: 'Starter',
  pro:     'Pro',
}

const STATUS_BADGE: Record<CabinetPlanStatus, { label: string; bg: string; color: string }> = {
  trialing:  { label: 'En période d\'essai', bg: '#DBEAFE', color: '#1D4ED8' },
  active:    { label: 'Actif',               bg: '#DCFCE7', color: '#166534' },
  expired:   { label: 'Expiré',              bg: '#FEF3C7', color: '#92400E' },
  suspended: { label: 'Suspendu',            bg: '#FEE2E2', color: '#991B1B' },
}

export interface AbonnementViewCabinet extends CabinetPlanInfo {
  planEndsAt: Date | null
  suspensionReason: string | null
}

function frDate(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Vue "Mon abonnement" — LECTURE SEULE, partagée desktop (/abonnement)
 * et mobile (/m/abonnement). Aucun prix, aucun bouton de paiement, aucun
 * RIB. Le composant ne rend PAS de topbar/layout : c'est aux pages de
 * placer leur propre header (Topbar desktop ou MobileTopbar mobile).
 *
 * @param cabinet  champs billing du Cabinet (null = pas de session/cabinet)
 * @param compact  true → padding/fonts réduits pour les pages /m/* mobile
 */
export default function AbonnementView({
  cabinet,
  compact = false,
}: {
  cabinet: AbonnementViewCabinet | null
  compact?: boolean
}) {
  const contactUrl = getContactCtaUrl()
  const status = cabinet?.planStatus
    ? (cabinet.planStatus as CabinetPlanStatus)
    : CabinetPlanStatus.trialing
  const planName = cabinet ? PLAN_LABEL[cabinet.plan as CabinetPlan] : '—'
  const badge = STATUS_BADGE[status]
  const effectiveState = cabinet ? getPlanState(cabinet) : 'trialing'

  let message = ''
  if (status === CabinetPlanStatus.suspended) {
    message = 'Abonnement suspendu. Contactez le support pour réactivation.'
  } else if (status === CabinetPlanStatus.expired || effectiveState === 'trial_expired') {
    message = 'Abonnement expiré. Contactez le support pour renouveler.'
  } else if (status === CabinetPlanStatus.trialing) {
    const days = getTrialDaysLeft(cabinet?.trialEndsAt ?? null)
    message = `Vous êtes en période d'essai. ${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}.`
  } else if (cabinet?.planEndsAt) {
    message = `Abonnement actif jusqu'au ${frDate(cabinet.planEndsAt)}.`
  } else {
    message = 'Abonnement actif.'
  }

  const expiryDate = cabinet?.planEndsAt
    ? frDate(cabinet.planEndsAt)
    : cabinet?.trialEndsAt
      ? frDate(new Date(cabinet.trialEndsAt))
      : null

  const isWarn   = status === CabinetPlanStatus.expired || effectiveState === 'trial_expired'
  const isSusp   = status === CabinetPlanStatus.suspended
  const msgBg    = isSusp ? '#FEF2F2' : isWarn ? '#FFFBEB' : '#F0F9FF'
  const msgBd    = isSusp ? '#FECACA' : isWarn ? '#FDE68A' : '#BAE6FD'
  const msgFg    = isSusp ? '#991B1B' : isWarn ? '#92400E' : '#075985'

  // Variantes responsive
  const outerPad      = compact ? '12px 16px' : 28
  const cardPad       = compact ? 18 : 28
  const cardPadSmall  = compact ? 16 : 24
  const planFont      = compact ? 22 : 28
  const maxW          = compact ? '100%' : 720

  return (
    <div style={{ padding: outerPad, maxWidth: maxW, margin: '0 auto' }}>
      {/* Card principale */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', padding: cardPad, marginBottom: compact ? 12 : 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: compact ? 14 : 20 }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 4 }}>Plan actuel</div>
            <div style={{ fontSize: planFont, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{planName}</div>
          </div>
          <span style={{ fontSize: 12, background: badge.bg, color: badge.color, padding: '5px 12px', borderRadius: 99, fontWeight: 700 }}>
            {badge.label}
          </span>
        </div>

        {expiryDate && (
          <div style={{ display: 'grid', gridTemplateColumns: compact ? '130px 1fr' : '160px 1fr', gap: '8px 12px', fontSize: compact ? 13 : 14, marginBottom: 14 }}>
            <span style={{ color: '#64748B' }}>
              {status === CabinetPlanStatus.trialing ? "Fin de l'essai" : "Date d'expiration"}
            </span>
            <span style={{ fontWeight: 600, color: '#0F172A' }}>{expiryDate}</span>
          </div>
        )}

        <div style={{
          background: msgBg, border: `1px solid ${msgBd}`,
          borderRadius: 10, padding: compact ? 12 : 14, fontSize: compact ? 13 : 14, color: msgFg,
        }}>
          {message}
        </div>

        {cabinet?.suspensionReason && (
          <div style={{ marginTop: 12, fontSize: compact ? 12 : 13, color: '#64748B' }}>
            <strong style={{ color: '#0F172A' }}>Raison communiquée :</strong> {cabinet.suspensionReason}
          </div>
        )}
      </div>

      {/* Section Contact */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', padding: cardPadSmall }}>
        <h2 style={{ fontSize: compact ? 14 : 15, fontWeight: 700, color: '#0F172A', margin: '0 0 12px' }}>Contact</h2>
        <p style={{ fontSize: compact ? 13 : 14, color: '#475569', margin: '0 0 14px', lineHeight: 1.6 }}>
          Pour toute question sur votre abonnement, renouvellement ou réactivation, contactez-nous directement.
        </p>
        <a href={contactUrl} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: compact ? '10px 18px' : '12px 22px', borderRadius: 10,
            background: '#25D366', color: 'white', fontWeight: 700,
            fontSize: compact ? 13 : 14, textDecoration: 'none',
          }}>
          💬 Contacter le support
        </a>
      </div>
    </div>
  )
}
