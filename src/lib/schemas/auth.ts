import { z } from 'zod'

/**
 * Schemas zod pour les routes auth (/api/auth/*, /api/compte/*).
 * Adaptés EXACTEMENT aux champs réellement lus par les handlers — pas plus,
 * pas moins. Toute évolution du body doit aller dans les deux endroits.
 */

// POST /api/auth/register
// Body imbriqué : { cabinet: {...}, admin: {...} }. Aligné sur ce que le
// handler actuel exige (nom cabinet + email/password admin requis ; reste opt.).
export const registerSchema = z.object({
  cabinet: z.object({
    nom:       z.string().min(1).max(200),
    ville:     z.string().max(100).optional().nullable(),
    telephone: z.string().max(50).optional().nullable(),
    email:     z.string().email().max(200).optional().nullable(),
  }),
  admin: z.object({
    email:    z.string().email().max(200),
    password: z.string().min(8).max(200),
    nom:      z.string().max(100).optional().nullable(),
    prenom:   z.string().max(100).optional().nullable(),
  }),
})

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
