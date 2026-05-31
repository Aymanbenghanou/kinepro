// Source de vérité unique des prix d'abonnement (en DH).
// Annuel = mensuel × 10 (≈ 2 mois offerts).
import { CabinetPlan, BillingCycle } from '@prisma/client'

// Re-export pour compat des call-sites qui importaient ces types.
export { CabinetPlan, BillingCycle } from '@prisma/client'

// Une demande/un cabinet payant peut être starter ou pro (pas 'trial').
export type PayingPlan = Exclude<CabinetPlan, typeof CabinetPlan.trial>
// Alias rétrocompat pour les imports existants (UI, routes).
export type Plan = PayingPlan

export const PRIX: Record<PayingPlan, Record<BillingCycle, number>> = {
  [CabinetPlan.starter]: { [BillingCycle.monthly]: 299, [BillingCycle.annual]: 2990 },
  [CabinetPlan.pro]:     { [BillingCycle.monthly]: 499, [BillingCycle.annual]: 4990 },
}

/** Montant (DH) pour un plan + cycle de facturation donnés. */
export function getMontant(plan: PayingPlan, billingCycle: BillingCycle): number {
  return PRIX[plan][billingCycle]
}
