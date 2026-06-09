/**
 * URL de base de l'application — source unique pour construire les liens
 * publics (feedback patient, scan/[token], facture publique, etc.).
 *
 * Lue depuis NEXT_PUBLIC_APP_URL côté build (inlined par Next dans les
 * bundles client). Pour changer de domaine (ex. passer à `https://kinepro.ma`),
 * il suffit de mettre à jour cette variable dans Vercel — aucun code
 * applicatif à modifier.
 *
 * Comportement si la variable est absente :
 *  - On retourne `''` (chaîne vide) plutôt qu'un fallback hardcodé vers
 *    le domaine de preview Vercel : ainsi un oubli de configuration
 *    devient immédiatement visible (liens cassés / relatifs) au lieu
 *    de pointer silencieusement vers la mauvaise URL.
 *  - On NE throw PAS : `process.env.NEXT_PUBLIC_*` est inlined à la
 *    compilation côté Next. Un throw au top-level casserait `npm run
 *    build` en local quand la var n'est pas définie. Un warning
 *    serveur reste suffisamment bruyant pour qu'on le voie.
 */

const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? ''

if (!raw && typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Warn côté serveur uniquement (pas répété 100× côté navigateur).
  console.warn(
    '[app-url] NEXT_PUBLIC_APP_URL is missing — public links will be ' +
    'broken (relative URLs). Set it in Vercel env vars.',
  )
}

/**
 * URL de base de l'app — sans slash final.
 * Ex: `'https://kinepro.ma'` ou `''` si la var manque (lien cassé visible).
 */
export const APP_URL = raw.replace(/\/+$/, '')
