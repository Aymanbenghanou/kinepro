import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { CabinetPlan, CabinetPlanStatus } from '@prisma/client'
import { getPlanState, getTrialDaysLeft } from '@/lib/plan'
import { getContactCtaUrl } from '@/lib/contact-cta'
import Topbar from '@/components/layout/Topbar'

export const dynamic = 'force-dynamic'

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

function frDate(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Page "Mon abonnement" — LECTURE SEULE.
// Source de vérité = Cabinet.{plan,planStatus,planEndsAt,trialEndsAt} (AGENTS.md §7).
// Aucun prix, aucun bouton de paiement, aucun RIB, aucun formulaire.
export default async function AbonnementPage() {
  const session = await auth()
  const cabinet = session?.user?.cabinetId
    ? await prisma.cabinet.findUnique({
        where: { id: session.user.cabinetId },
        select: {
          plan: true, planStatus: true, planEndsAt: true, trialEndsAt: true,
          suspensionReason: true, createdAt: true,
        },
      })
    : null

  const contactUrl = getContactCtaUrl()
  const status = cabinet?.planStatus ?? CabinetPlanStatus.trialing
  const planName = cabinet ? PLAN_LABEL[cabinet.plan] : '—'
  const badge = STATUS_BADGE[status]
  const effectiveState = cabinet ? getPlanState(cabinet) : 'trialing'

  // Message principal selon l'état
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

  // Date d'expiration affichée
  const expiryDate = cabinet?.planEndsAt
    ? frDate(cabinet.planEndsAt)
    : cabinet?.trialEndsAt
      ? frDate(cabinet.trialEndsAt)
      : null

  return (
    <div>
      <Topbar title="Mon abonnement" subtitle="Statut et contact" />
      <div style={{ padding: 28, maxWidth: 720, margin: '0 auto' }}>
        {/* Card principale */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500, marginBottom: 4 }}>Plan actuel</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{planName}</div>
            </div>
            <span style={{ fontSize: 13, background: badge.bg, color: badge.color, padding: '6px 14px', borderRadius: 99, fontWeight: 700 }}>
              {badge.label}
            </span>
          </div>

          {expiryDate && (
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '8px 12px', fontSize: 14, marginBottom: 16 }}>
              <span style={{ color: '#64748B' }}>
                {status === CabinetPlanStatus.trialing ? "Fin de l'essai" : "Date d'expiration"}
              </span>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>{expiryDate}</span>
            </div>
          )}

          <div style={{
            background: status === CabinetPlanStatus.suspended ? '#FEF2F2'
                      : status === CabinetPlanStatus.expired || effectiveState === 'trial_expired' ? '#FFFBEB'
                      : '#F0F9FF',
            border: '1px solid ' + (
              status === CabinetPlanStatus.suspended ? '#FECACA'
              : status === CabinetPlanStatus.expired || effectiveState === 'trial_expired' ? '#FDE68A'
              : '#BAE6FD'
            ),
            borderRadius: 12, padding: 14, fontSize: 14,
            color: status === CabinetPlanStatus.suspended ? '#991B1B'
                 : status === CabinetPlanStatus.expired || effectiveState === 'trial_expired' ? '#92400E'
                 : '#075985',
          }}>
            {message}
          </div>

          {cabinet?.suspensionReason && (
            <div style={{ marginTop: 14, fontSize: 13, color: '#64748B' }}>
              <strong style={{ color: '#0F172A' }}>Raison communiquée :</strong> {cabinet.suspensionReason}
            </div>
          )}
        </div>

        {/* Section Contact */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>Contact</h2>
          <p style={{ fontSize: 14, color: '#475569', margin: '0 0 16px', lineHeight: 1.6 }}>
            Pour toute question sur votre abonnement, renouvellement ou réactivation, contactez-nous directement.
          </p>
          <a href={contactUrl} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 10, background: '#25D366',
              color: 'white', fontWeight: 700, fontSize: 14, textDecoration: 'none',
            }}>
            💬 Contacter le support
          </a>
        </div>
      </div>
    </div>
  )
}
