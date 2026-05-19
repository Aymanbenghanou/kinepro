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

// ─── Cabinet config (fetched at runtime, fallback defaults) ──────────────────
export const CABINET_TEL = '0522-456-789'
export const CABINET_NOM = 'Cabinet KinéPro'

// ─── 1. Confirmation RDV ─────────────────────────────────────────────────────
export function msgConfirmationRDV(p: {
  prenom: string
  date: string      // "Lundi 16/05/2026"
  heure: string     // "09:00"
  praticien: string // "Rachid Amrani"
  typeSeance: string
  duree: number
}): string {
  return `Bonjour ${p.prenom} 👋

Votre RDV au *${CABINET_NOM}* est confirmé :

📅 *${p.date}* à *${p.heure}*
👨‍⚕️ Praticien : Dr. ${p.praticien}
🏥 Séance : ${p.typeSeance}
⏱ Durée : ${p.duree} min

En cas d'empêchement, merci de nous prévenir 24h à l'avance.
À bientôt 🙏`
}

// ─── 2. Rappel RDV 24h avant ─────────────────────────────────────────────────
export function msgRappelRDV(p: {
  prenom: string
  date: string
  heure: string
  praticien: string
  typeSeance: string
  telCabinet?: string
}): string {
  return `Bonjour ${p.prenom} 👋

Petit rappel : vous avez rendez-vous *demain* au ${CABINET_NOM} 🏥

📅 *${p.date}* à *${p.heure}*
👨‍⚕️ Dr. ${p.praticien}
🏥 ${p.typeSeance}

Besoin de reporter ? Appelez-nous : ${p.telCabinet || CABINET_TEL}
À demain ! 💪`
}

// ─── 3. Post-séance Score 8-10 (Excellent) — includes Google Maps ────────────
export function msgFeedbackExcellent(p: {
  prenom: string
  numSeance: number
  totalSeances: number | null
  typeSeance: string
  googleMapsLink: string
}): string {
  const seanceLabel = p.totalSeances
    ? `Séance ${p.numSeance}/${p.totalSeances}`
    : `Séance ${p.numSeance}`
  return `Bonjour ${p.prenom} 😊

Merci pour votre séance d'aujourd'hui chez *${CABINET_NOM}* ! 💪

*${seanceLabel} — ${p.typeSeance}*

Continuez les exercices à la maison, ils font toute la différence ! 🏋️

---
⭐ *Un petit avis Google nous aiderait énormément :*
👉 ${p.googleMapsLink}
Merci infiniment, ça prend 30 secondes ! 🙏

À très bientôt,
*${CABINET_NOM}*`
}

// ─── 3. Post-séance Score 5-7 (Moyen) — NO Google link ──────────────────────
export function msgFeedbackMoyen(p: {
  prenom: string
  messagePersonnalise?: string
  prochainRdv?: string
  telCabinet?: string
}): string {
  const msg = p.messagePersonnalise?.trim()
    ? p.messagePersonnalise.trim()
    : `Chaque séance nous rapproche de votre objectif. Le corps prend du temps pour s'adapter, mais nous sommes là pour vous accompagner.`
  return `Bonjour ${p.prenom} 👋

Merci d'être venu(e) aujourd'hui chez *${CABINET_NOM}*.

Cette séance était un peu difficile — c'est tout à fait normal dans votre parcours 🙏

${msg}

Votre prochain RDV : *${p.prochainRdv || 'à planifier'}*

N'hésitez pas à nous appeler si vous avez des questions.
À bientôt 💪
*${CABINET_NOM}* — ${p.telCabinet || CABINET_TEL}`
}

// ─── 3. Post-séance Score 1-4 (Difficile) — empathie + promesse ─────────────
export function msgFeedbackDifficile(p: {
  prenom: string
  messagePersonnalise: string
  prochainRdv?: string
  telCabinet?: string
}): string {
  return `Bonjour ${p.prenom} 👋

Merci pour votre courage aujourd'hui — nous savons que cette séance était difficile 🙏

${p.messagePersonnalise}

Votre bien-être est notre priorité absolue. Lors de votre prochaine séance nous allons :
• Adapter l'intensité à votre ressenti
• Prendre plus de temps sur les zones sensibles
• Réévaluer votre programme si nécessaire

Votre prochain RDV : *${p.prochainRdv || 'à planifier'}*

Appelez-nous à tout moment : *${p.telCabinet || CABINET_TEL}*

Vous êtes entre de bonnes mains 💙
*${CABINET_NOM}*`
}

// ─── 4. Programme d'exercices ─────────────────────────────────────────────────
export function msgExercices(p: {
  prenom: string
  programme: string
}): string {
  return `Bonjour ${p.prenom} 👋

Voici votre programme d'exercices personnalisé 📋

*${p.programme}*

⚠️ En cas de douleur, arrêtez et contactez-nous.

Bon courage ! 💪
*${CABINET_NOM}*`
}

// ─── 5. Feedback automatique (lien token post-séance) ────────────────────────
export function msgFeedbackAuto(p: {
  prenom: string
  feedbackUrl: string
  nomCabinet?: string
}): string {
  const cab = p.nomCabinet || CABINET_NOM
  return `Bonjour ${p.prenom} 👋

Votre séance au *${cab}* vient de se terminer.

Nous aimerions connaître votre ressenti 🙏

👉 *Donnez votre avis ici (1 min) :*
${p.feedbackUrl}

Merci pour votre confiance 💙
*${cab}*`
}

// ─── 6. Demande d'avis Google Maps (score 8-10) ───────────────────────────────
export function msgAvisGoogle(p: {
  prenom: string
  googleMapsLink: string
}): string {
  return `Bonjour ${p.prenom} 😊

Nous espérons que votre séance s'est bien passée !

Un petit avis Google nous aiderait énormément 🙏⭐

👉 ${p.googleMapsLink}

Merci infiniment ! 🌟
*${CABINET_NOM}*`
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
