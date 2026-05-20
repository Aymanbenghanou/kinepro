/**
 * Compute the canonical Facture status from total / paid / age.
 *  - paye       → fully paid (montantPaye >= montant)
 *  - en_attente → nothing paid yet and < 30 days
 *  - partielle  → some paid, but not all
 *  - en_retard  → unpaid (or partial) and > 30 days since emise
 */

export type FactureStatut = 'paye' | 'en_attente' | 'partielle' | 'en_retard'

const OVERDUE_DAYS = 30

export function computeStatut(
  montant: number,
  montantPaye: number,
  dateEmise: Date | string
): FactureStatut {
  if (montantPaye >= montant) return 'paye'
  const age = (Date.now() - new Date(dateEmise).getTime()) / 86400000
  if (age > OVERDUE_DAYS) return 'en_retard'
  if (montantPaye > 0) return 'partielle'
  return 'en_attente'
}

export const STATUT_LABELS: Record<FactureStatut, { label: string; bg: string; color: string; icon: string }> = {
  paye:       { label: 'Payée',                 bg: '#DCFCE7', color: '#15803D', icon: '✅' },
  en_attente: { label: 'En attente',            bg: '#FEF3C7', color: '#92400E', icon: '⏳' },
  partielle:  { label: 'Partiellement payée',   bg: '#FFEDD5', color: '#9A3412', icon: '🔶' },
  en_retard:  { label: 'En retard',             bg: '#FEE2E2', color: '#991B1B', icon: '🔴' },
}

export const MODE_PAIEMENT: Record<string, { label: string; icon: string; color: string }> = {
  especes:  { label: 'Espèces',  icon: '💵', color: '#16A34A' },
  virement: { label: 'Virement', icon: '🏦', color: '#2563EB' },
  cheque:   { label: 'Chèque',   icon: '📝', color: '#7C3AED' },
  carte:    { label: 'Carte',    icon: '💳', color: '#F59E0B' },
}
