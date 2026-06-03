import { z } from 'zod'

/**
 * Schemas zod pour les routes /api/compte/*.
 * Adaptés EXACTEMENT aux champs réellement lus par les handlers.
 */

// POST /api/compte/password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword:     z.string().min(8).max(200),
})

// PATCH /api/compte/profile
// Tous optionnels — la route fait du diff par champ présent.
export const updateProfileSchema = z.object({
  nom:       z.string().min(1).max(100).optional(),
  prenom:    z.string().min(1).max(100).optional(),
  telephone: z.string().max(50).optional().nullable(),
  email:     z.string().email().max(200).optional(),
})

// POST /api/compte/2fa/verify
// Champ "token" (et non "code") car le handler actuel lit body.token.
export const verify2faSchema = z.object({
  token: z.string().regex(/^\d{6}$/, 'Code doit faire 6 chiffres'),
})
