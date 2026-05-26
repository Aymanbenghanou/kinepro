// État d'abonnement d'un cabinet — logique pure, réutilisable côté serveur.

/**
 * GARDE-FOU DE DÉPLOIEMENT.
 * Tout cabinet créé AVANT cette date existait avant la mise en place du système
 * de facturation. Ces cabinets ne doivent JAMAIS tomber sur le mur « essai
 * expiré » : ils sont traités comme "active" quel que soit leur trialEndsAt.
 * (Seuls les cabinets créés à partir de cette date suivent le cycle d'essai.)
 */
export const EXISTING_CABINETS_CUTOFF = new Date('2026-05-26T00:00:00Z')

export type PlanState = 'trialing' | 'trial_expired' | 'active'

export interface CabinetPlanInfo {
  plan: string | null
  planStatus: string | null
  trialEndsAt: Date | string | null
  createdAt: Date | string
}

/** Calcule l'état d'abonnement d'un cabinet. */
export function getPlanState(c: CabinetPlanInfo): PlanState {
  // Abonnement payant actif
  if ((c.plan === 'starter' || c.plan === 'pro') && c.planStatus === 'active') {
    return 'active'
  }

  if (c.plan === 'trial') {
    // Garde-fou : cabinets antérieurs au lancement de la facturation → jamais murés.
    if (new Date(c.createdAt) < EXISTING_CABINETS_CUTOFF) return 'active'

    const end = c.trialEndsAt ? new Date(c.trialEndsAt).getTime() : null
    if (end !== null && end > Date.now()) return 'trialing'
    return 'trial_expired'
  }

  // Plan inconnu / non défini → on ne mure pas.
  return 'active'
}

/** Jours entiers restants avant la fin de l'essai (min 0). */
export function getTrialDaysLeft(trialEndsAt: Date | string | null): number {
  if (!trialEndsAt) return 0
  const ms = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}
