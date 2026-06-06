import { z } from 'zod'

/**
 * Schemas zod pour les routes cabinet.
 * Adaptés EXACTEMENT aux champs lus par les handlers.
 */

// PATCH /api/cabinet (PUT delegate aussi à PATCH).
// Tous opt — le handler applique seulement les champs présents (spread).
export const updateCabinetSchema = z.object({
  nom:              z.string().min(1).max(200).optional(),
  ville:            z.string().max(100).optional().nullable(),
  adresse:          z.string().max(500).optional().nullable(),
  telephone:        z.string().max(50).optional().nullable(),
  email:            z.string().email().max(200).optional().nullable(),
  whatsappNumber:   z.string().max(50).optional().nullable(),
  googleReviewLink: z.string().max(1000).optional().nullable(),
  logoUrl:          z.string().max(1000).optional().nullable(),
})
