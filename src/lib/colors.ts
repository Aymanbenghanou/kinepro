/**
 * Palette de couleurs par défaut pour les Praticiens (avatars, blocs agenda,
 * graphes, badges). Source unique réutilisée :
 *  - UI /personnel (color picker)
 *  - création automatique du Praticien de l'owner cabinet
 *  - script de backfill
 */
export const PRATICIEN_COULEURS = [
  '#2563EB', // blue
  '#16A34A', // green
  '#F59E0B', // amber
  '#EC4899', // pink
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#EF4444', // red
  '#F97316', // orange
] as const

/** Couleur déterministe à partir d'une chaîne (cuid, email…) — évite Math.random
 *  pour rester reproductible (cohérent avec une réimport éventuelle). */
export function deterministicPraticienColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  const idx = Math.abs(h) % PRATICIEN_COULEURS.length
  return PRATICIEN_COULEURS[idx]
}
