import { z } from 'zod'
import { CabinetPlan } from '@prisma/client'

/**
 * Schema pour POST /api/super-admin/cabinets/create.
 * Création high-touch d'un cabinet par le super-admin :
 *   - infos cabinet + identifiants owner
 *   - plan initial (trial → durée en jours, sinon → date d'expiration)
 */
export const createCabinetByAdminSchema = z
  .object({
    cabinet: z.object({
      nom:       z.string().min(1).max(200),
      ville:     z.string().max(100).optional().nullable(),
      telephone: z.string().max(50).optional().nullable(),
      email:     z.string().email().max(200).optional().nullable(),
    }),
    owner: z.object({
      email:    z.string().email().max(200),
      password: z.string().min(8).max(200),
      nom:      z.string().min(1).max(100),
      prenom:   z.string().min(1).max(100),
    }),
    plan:        z.nativeEnum(CabinetPlan),               // trial | starter | pro
    trialDays:   z.number().int().min(1).max(365).optional(),  // requis si plan='trial'
    planEndsAt:  z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(), // requis si starter/pro (ISO ou YYYY-MM-DD)
  })
  .refine(d => d.plan !== CabinetPlan.trial || typeof d.trialDays === 'number', {
    message: 'trialDays requis pour le plan trial',
    path: ['trialDays'],
  })
  .refine(d => d.plan === CabinetPlan.trial || !!d.planEndsAt, {
    message: "planEndsAt requis pour les plans payants",
    path: ['planEndsAt'],
  })

/**
 * Schema pour PATCH /api/super-admin/cabinets/[id]/plan.
 * Actions : changer le plan, modifier la date d'expiration, étendre 1 an,
 * suspendre (avec raison), réactiver.
 */
export const updateCabinetPlanSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('setPlan'),
    plan:   z.nativeEnum(CabinetPlan),
  }),
  z.object({
    action:     z.literal('setExpiry'),
    planEndsAt: z.string(),
  }),
  z.object({
    action: z.literal('extendOneYear'),
  }),
  z.object({
    action: z.literal('suspend'),
    reason: z.string().min(1).max(200),
  }),
  z.object({
    action: z.literal('reactivate'),
  }),
])
