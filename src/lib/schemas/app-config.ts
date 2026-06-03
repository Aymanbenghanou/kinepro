import { z } from 'zod'

/**
 * PATCH /api/super-admin/app-config — accepte le numéro support WhatsApp en
 * format libre (E.164 "+212649911970" OU format MA local "0649911970") ;
 * la normalisation côté serveur convertit le 2e en 1er.
 */
export const updateAppConfigSchema = z.object({
  supportWhatsapp: z.string().min(8).max(20),
})
