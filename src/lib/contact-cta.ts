/**
 * URL de contact pour le CTA "Demander une démo" du landing.
 * Priorité : NEXT_PUBLIC_CONTACT_WHATSAPP > NEXT_PUBLIC_SUPER_ADMIN_WA > mailto fallback.
 * Côté client (composants 'use client') les NEXT_PUBLIC_* sont inlinés au build.
 */
export function getContactCtaUrl(): string {
  const wa =
    process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ||
    process.env.NEXT_PUBLIC_SUPER_ADMIN_WA
  if (wa) {
    const clean = wa.replace(/[^\d]/g, '')
    const msg = encodeURIComponent(
      "Bonjour, je suis kinésithérapeute et je souhaite découvrir KinéPro."
    )
    return `https://wa.me/${clean}?text=${msg}`
  }
  return 'mailto:contact@kinepro.ma?subject=Demande%20de%20démo%20KinéPro'
}

export const CONTACT_CTA_LABEL = 'Demander une démo'
