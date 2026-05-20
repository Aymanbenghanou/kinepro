'use client'

import { useSession } from 'next-auth/react'
import { translations, type Lang } from '@/lib/translations'

/**
 * Returns the active language, its translation bundle, and an isRTL flag.
 * Reads from session.user.preferredLang (defaults to "fr").
 */
export function useTranslation() {
  const { data: session } = useSession()
  const lang: Lang = ((session?.user as any)?.preferredLang === 'ar' ? 'ar' : 'fr')
  return {
    t:     translations[lang],
    lang,
    isRTL: lang === 'ar',
  }
}
