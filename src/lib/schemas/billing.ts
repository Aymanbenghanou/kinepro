import { z } from 'zod'
import { FactureStatut, ModePaiement, CabinetPlan, BillingCycle } from '@prisma/client'

/**
 * Schemas zod pour les routes billing (/api/facturation/*, /api/factures,
 * /api/abonnement/*). Adaptés EXACTEMENT aux champs lus par les handlers.
 */

// POST /api/facturation  ET  POST /api/factures
// Les deux POST acceptent le même triplet (patientId, montant, seanceId?).
// /api/factures accepte EN PLUS un statut client (rétrocompat) ; on l'accepte
// ici en optionnel — /api/facturation l'ignorera naturellement.
export const createFactureSchema = z.object({
  patientId: z.string().min(1),
  montant:   z.number().positive().finite(),
  seanceId:  z.string().min(1).optional().nullable(),
  statut:    z.nativeEnum(FactureStatut).optional(),
})

// POST /api/facturation/[id]/paiements
// Le handler lit montant (Number, > 0), modePaiement (string lowercased,
// vérifié contre MODE_PAIEMENT = { especes, virement, cheque, carte }),
// notes (optional string), datePaiement (optional, parsée en Date).
export const enregistrerPaiementSchema = z.object({
  montant:      z.number().positive().finite(),
  modePaiement: z.nativeEnum(ModePaiement),
  notes:        z.string().max(1000).optional().nullable(),
  // Accepte une string parsable en Date (ISO ou yyyy-mm-dd) ; le handler
  // gère le défaut "maintenant" quand absent.
  datePaiement: z.string().min(1).optional().nullable(),
})

// POST /api/abonnement/demande — plan restreint à starter|pro (pas 'trial').
export const demandeAbonnementSchema = z.object({
  plan:         z.enum([CabinetPlan.starter, CabinetPlan.pro]),
  billingCycle: z.nativeEnum(BillingCycle),
})
