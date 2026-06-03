/**
 * Helpers de construction des CTA WhatsApp / mailto.
 *
 * Source de vérité du numéro support :
 *   1. Côté server : `getAppConfig()` (cached) — table AppConfig.
 *   2. Côté client : valeur propagée via <AppConfigProvider> (cf. providers/app-config.tsx).
 *
 * Les anciennes env vars NEXT_PUBLIC_CONTACT_WHATSAPP / NEXT_PUBLIC_SUPER_ADMIN_WA
 * sont conservées en fallback pour les pages/composants qui n'ont pas (encore)
 * accès au contexte (e.g. page racine au tout premier render).
 */

const CTA_MESSAGE =
  'Bonjour, je suis kinésithérapeute et je souhaite découvrir KinéPro.'

/** Construit l'URL wa.me à partir d'un numéro E.164 ('+212649911970'). Pure. */
export function buildContactCtaUrl(supportWhatsapp?: string | null): string {
  const fallback = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || process.env.NEXT_PUBLIC_SUPER_ADMIN_WA
  const raw = (supportWhatsapp || fallback || '').trim()
  if (!raw) return 'mailto:contact@kinepro.ma?subject=Demande%20de%20démo%20KinéPro'
  const clean = raw.replace(/[^\d]/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(CTA_MESSAGE)}`
}

/** Affichage humain : '+212649911970' → '+212 649 91 19 70'. */
export function formatPhoneFR(supportWhatsapp: string): string {
  const s = supportWhatsapp.trim()
  if (!s) return ''
  if (s.startsWith('+212') && s.length === 13) {
    // +212 X XX XX XX XX
    return `+212 ${s.slice(4, 5)} ${s.slice(5, 7)} ${s.slice(7, 9)} ${s.slice(9, 11)} ${s.slice(11, 13)}`
  }
  return s
}

/**
 * Compat-rétro : ancienne signature sync utilisée encore par quelques pages
 * (landing page racine côté client si elles n'ont pas le contexte). Renvoie
 * la même chose que buildContactCtaUrl() avec uniquement les env vars.
 */
export function getContactCtaUrl(): string {
  return buildContactCtaUrl()
}

export const CONTACT_CTA_LABEL = 'Demander une démo'
