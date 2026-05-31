/**
 * Compute the canonical Facture status from total / paid / age.
 *  - paye       → fully paid (montantPaye >= montant)
 *  - en_attente → nothing paid yet and < 30 days
 *  - partielle  → some paid, but not all
 *  - en_retard  → unpaid (or partial) and > 30 days since emise
 */
import { FactureStatut, ModePaiement } from '@prisma/client'

// Re-export pour les consommateurs qui importaient le type local.
export { FactureStatut, ModePaiement } from '@prisma/client'

const OVERDUE_DAYS = 30

export function computeStatut(
  montant: number,
  montantPaye: number,
  dateEmise: Date | string
): FactureStatut {
  if (montantPaye >= montant) return FactureStatut.paye
  const age = (Date.now() - new Date(dateEmise).getTime()) / 86400000
  if (age > OVERDUE_DAYS) return FactureStatut.en_retard
  if (montantPaye > 0) return FactureStatut.partielle
  return FactureStatut.en_attente
}

export const STATUT_LABELS: Record<FactureStatut, { label: string; bg: string; color: string; icon: string }> = {
  [FactureStatut.paye]:       { label: 'Payée',                 bg: '#DCFCE7', color: '#15803D', icon: '✅' },
  [FactureStatut.en_attente]: { label: 'En attente',            bg: '#FEF3C7', color: '#92400E', icon: '⏳' },
  [FactureStatut.partielle]:  { label: 'Partiellement payée',   bg: '#FFEDD5', color: '#9A3412', icon: '🔶' },
  [FactureStatut.en_retard]:  { label: 'En retard',             bg: '#FEE2E2', color: '#991B1B', icon: '🔴' },
}

export const MODE_PAIEMENT: Record<ModePaiement, { label: string; icon: string; color: string }> = {
  [ModePaiement.especes]:  { label: 'Espèces',  icon: '💵', color: '#16A34A' },
  [ModePaiement.virement]: { label: 'Virement', icon: '🏦', color: '#2563EB' },
  [ModePaiement.cheque]:   { label: 'Chèque',   icon: '📝', color: '#7C3AED' },
  [ModePaiement.carte]:    { label: 'Carte',    icon: '💳', color: '#F59E0B' },
}
