// ─── Phone formatter ─────────────────────────────────────────────────────────
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
  if (cleaned.startsWith('+212')) return cleaned.slice(1)       // +212... → 212...
  if (cleaned.startsWith('212')) return cleaned                  // already good
  if (cleaned.startsWith('0')) return '212' + cleaned.slice(1)  // 06... → 21206...
  return cleaned
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const formatted = formatPhoneForWhatsApp(phone)
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`
}

/**
 * Retourne le libellé à afficher pour le cabinet courant dans un message
 * WhatsApp. Le nom est utilisé tel quel (le kiné a déjà choisi sa formulation
 * — beaucoup mettent "Cabinet X", d'autres juste "X"). On n'ajoute jamais
 * "Cabinet" en préfixe pour éviter "Cabinet Cabinet Al Amal".
 * Fallback neutre si nom null/vide.
 */
export function cabinetLabel(nom?: string | null): string {
  const t = (nom ?? '').trim()
  return t.length > 0 ? t : 'votre cabinet'
}

// ─── 1. Confirmation RDV ─────────────────────────────────────────────────────
export function msgConfirmationRDV(p: {
  prenom: string
  date: string      // "Lundi 16/05/2026"
  heure: string     // "09:00"
  praticien: string // "Rachid Amrani"
  typeSeance: string
  duree: number
  nomCabinet?: string | null
}): string {
  return `Bonjour ${p.prenom} \u{1F44B}

Votre RDV au *${cabinetLabel(p.nomCabinet)}* est confirmé :

\u{1F4C5} *${p.date}* à *${p.heure}*
\u{1FA7A} Praticien : Dr. ${p.praticien}
\u{1F4AA} Séance : ${p.typeSeance}
\u{23F1}\u{FE0F} Durée : ${p.duree} min

En cas d'empêchement, merci de nous prévenir 24h à l'avance.
À bientôt \u{1F64F}`
}

// ─── 2. Rappel RDV 24h avant ─────────────────────────────────────────────────
export function msgRappelRDV(p: {
  prenom: string
  date: string
  heure: string
  praticien: string
  typeSeance: string
  telCabinet?: string | null
  nomCabinet?: string | null
}): string {
  return `Bonjour ${p.prenom} \u{1F44B}

Petit rappel : vous avez rendez-vous *demain* au ${cabinetLabel(p.nomCabinet)} \u{1F3E5}

\u{1F4C5} *${p.date}* à *${p.heure}*
\u{1FA7A} Dr. ${p.praticien}
\u{1F4AA} ${p.typeSeance}

${p.telCabinet ? `Besoin de reporter ? Appelez-nous : ${p.telCabinet}` : `Besoin de reporter ? Merci de nous contacter.`}
À demain ! \u{1F4AA}`
}

// ─── 4. Programme d'exercices ─────────────────────────────────────────────────
export function msgExercices(p: {
  prenom: string
  programme: string
  nomCabinet?: string | null
}): string {
  return `Bonjour ${p.prenom} \u{1F44B}

Voici votre programme d'exercices personnalisé \u{1F4CB}

*${p.programme}*

\u{26A0}\u{FE0F} En cas de douleur, arrêtez et contactez-nous.

Bon courage ! \u{1F4AA}
*${cabinetLabel(p.nomCabinet)}*`
}

// ─── 5. Feedback automatique (lien token post-séance) ────────────────────────
export function msgFeedbackAuto(p: {
  prenom: string
  feedbackUrl: string
  nomCabinet?: string | null
}): string {
  const cab = cabinetLabel(p.nomCabinet)
  return `Bonjour ${p.prenom} \u{1F44B}

Votre séance au *${cab}* vient de se terminer.

Nous aimerions connaître votre ressenti \u{1F64F}

\u{1F449} *Donnez votre avis ici (1 min) :*
${p.feedbackUrl}

Merci pour votre confiance \u{1F499}
*${cab}*`
}

// ─── Score helpers ────────────────────────────────────────────────────────────
export function scoreCategory(score: number): 'excellent' | 'moyen' | 'difficile' {
  if (score >= 8) return 'excellent'
  if (score >= 5) return 'moyen'
  return 'difficile'
}

export function scoreBadge(score: number): { emoji: string; label: string; bg: string; color: string } {
  const cat = scoreCategory(score)
  if (cat === 'excellent') return { emoji: '🟢', label: 'Excellent', bg: '#DCFCE7', color: '#16A34A' }
  if (cat === 'moyen')     return { emoji: '🟡', label: 'Moyen',     bg: '#FEF3C7', color: '#D97706' }
  return                         { emoji: '🔴', label: 'Difficile', bg: '#FEE2E2', color: '#DC2626' }
}

export function scoreColor(score: number): string {
  if (score >= 8) return '#16A34A'
  if (score >= 5) return '#F59E0B'
  return '#DC2626'
}

// ─── WhatsApp type metadata ───────────────────────────────────────────────────
export const WHATSAPP_TYPES = {
  confirmation_rdv:  { label: 'Confirmation RDV',   color: '#25D366', emoji: '✅' },
  rappel_rdv:        { label: 'Rappel RDV',          color: '#2563EB', emoji: '🔔' },
  feedback_seance:   { label: 'Feedback séance',     color: '#F59E0B', emoji: '⭐' },
  feedback_auto:     { label: 'Feedback auto',       color: '#8B5CF6', emoji: '🔔' },
  exercices:         { label: 'Programme exercices', color: '#7C3AED', emoji: '💪' },
  avis_google:       { label: 'Avis Google',         color: '#D97706', emoji: '⭐' },
} as const

export type WhatsAppType = keyof typeof WHATSAPP_TYPES
