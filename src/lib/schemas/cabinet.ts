import { z } from 'zod'

/**
 * Schemas zod pour les routes cabinet + super-admin demandes.
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
  googleMapsLink:   z.string().max(1000).optional().nullable(),
  whatsappNumber:   z.string().max(50).optional().nullable(),
  googleReviewLink: z.string().max(1000).optional().nullable(),
  // Booking settings
  slug:             z.string().max(200).optional().nullable(),
  bookingEnabled:   z.boolean().optional(),
  workStartTime:    z.string().regex(/^\d{2}:\d{2}$/, 'Format attendu HH:MM').optional(),
  workEndTime:      z.string().regex(/^\d{2}:\d{2}$/, 'Format attendu HH:MM').optional(),
  lunchStartTime:   z.string().regex(/^\d{2}:\d{2}$/, 'Format attendu HH:MM').optional(),
  lunchEndTime:     z.string().regex(/^\d{2}:\d{2}$/, 'Format attendu HH:MM').optional(),
  bookingMessage:   z.string().max(2000).optional().nullable(),
  // Format CSV de jours, ex. "1,2,3,4,5,6". On laisse string libre côté zod.
  workingDays:      z.string().max(50).optional(),
})
