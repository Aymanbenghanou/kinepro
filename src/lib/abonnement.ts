// Source de vérité unique des prix d'abonnement (en DH).
// Annuel = mensuel × 10 (≈ 2 mois offerts).

export type Plan = 'starter' | 'pro'
export type BillingCycle = 'monthly' | 'annual'

export const PRIX: Record<Plan, Record<BillingCycle, number>> = {
  starter: { monthly: 299, annual: 2990 },
  pro:     { monthly: 499, annual: 4990 },
}

/** Montant (DH) pour un plan + cycle de facturation donnés. */
export function getMontant(plan: Plan, billingCycle: BillingCycle): number {
  return PRIX[plan][billingCycle]
}
