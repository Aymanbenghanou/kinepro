import 'server-only'
import { unstable_cache, updateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'

/**
 * Config globale plateforme (numéro support WhatsApp, etc.).
 * Pattern singleton : une seule row avec id='singleton'.
 *
 * Cache server-side via unstable_cache :
 *  - revalidate: 3600 (1h) → hit DB max 1x/heure par instance Next
 *  - tag: APP_CONFIG_TAG → invalidation explicite à chaque PATCH super-admin
 *
 * Économise massivement les tokens Supabase (10k+ requests Free → quelques /h).
 */
const APP_CONFIG_TAG = 'app-config'

export const getAppConfig = unstable_cache(
  async () => {
    return await prisma.appConfig.upsert({
      where:  { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    })
  },
  ['app-config-singleton'],
  { revalidate: 3600, tags: [APP_CONFIG_TAG] }
)

/** Appelée par PATCH /api/super-admin/app-config pour propager immédiatement.
 *  Next 16 : `updateTag(tag)` (anciennement `revalidateTag(tag)` à 1 arg en Next ≤15). */
export function invalidateAppConfigCache() {
  updateTag(APP_CONFIG_TAG)
}
