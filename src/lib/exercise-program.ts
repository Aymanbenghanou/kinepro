/**
 * Types + helpers for AI-generated exercise programs.
 */

export interface Exercice {
  numero: number
  nom: string
  description: string
  duree: string
  serie: string
  position: string
  conseil: string
  attention?: string
}

export interface ProgrammeContenu {
  titre: string
  introduction: string
  exercices: Exercice[]
  conseils_generaux: string[]
  message_fin: string
  prochaine_seance?: string
}

const NUM_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

export interface FormatContext {
  patientPrenom: string
  pathologie: string
  seanceNumero?: number
  seanceTotal?: number
  cabinetNom?: string
  cabinetTel?: string
  prochainRdv?: string
  langue: 'fr' | 'ar'
}

export function formatWhatsAppMessage(p: ProgrammeContenu, ctx: FormatContext): string {
  if (ctx.langue === 'ar') return formatAr(p, ctx)
  return formatFr(p, ctx)
}

function formatFr(p: ProgrammeContenu, ctx: FormatContext): string {
  const lines: string[] = []
  lines.push(`*Programme d'exercices — ${ctx.patientPrenom}* 🏋️`)
  if (ctx.seanceNumero && ctx.seanceTotal) {
    lines.push(`_${ctx.pathologie} — Séance ${ctx.seanceNumero}/${ctx.seanceTotal}_`)
  } else {
    lines.push(`_${ctx.pathologie}_`)
  }
  lines.push('')
  if (p.introduction) { lines.push(p.introduction); lines.push('') }
  lines.push('*Exercices du jour :*')
  lines.push('')
  p.exercices.forEach((ex, i) => {
    const num = NUM_EMOJIS[i] ?? `${i + 1}.`
    lines.push(`*${num} ${ex.nom}*`)
    if (ex.position) lines.push(`📍 Position : ${ex.position}`)
    const dureeLine = [ex.duree, ex.serie].filter(Boolean).join(' × ')
    if (dureeLine) lines.push(`⏱ ${dureeLine}`)
    if (ex.description) lines.push(ex.description)
    if (ex.conseil)     lines.push(`💡 ${ex.conseil}`)
    if (ex.attention)   lines.push(`⚠️ ${ex.attention}`)
    lines.push('')
  })
  if (p.conseils_generaux?.length) {
    lines.push('*Conseils généraux :*')
    p.conseils_generaux.forEach(c => lines.push(`✅ ${c}`))
    lines.push('')
  }
  if (p.message_fin) { lines.push(p.message_fin); lines.push('') }
  if (ctx.prochainRdv) lines.push(`_Votre prochain RDV : ${ctx.prochainRdv}_`)
  if (ctx.cabinetNom)  lines.push(`_${ctx.cabinetNom}${ctx.cabinetTel ? ` — ${ctx.cabinetTel}` : ''}_`)
  return lines.join('\n').trim()
}

function formatAr(p: ProgrammeContenu, ctx: FormatContext): string {
  const lines: string[] = []
  lines.push(`*برنامج تمارين — ${ctx.patientPrenom}* 🏋️`)
  if (ctx.seanceNumero && ctx.seanceTotal) {
    lines.push(`_${ctx.pathologie} — الجلسة ${ctx.seanceNumero}/${ctx.seanceTotal}_`)
  } else {
    lines.push(`_${ctx.pathologie}_`)
  }
  lines.push('')
  if (p.introduction) { lines.push(p.introduction); lines.push('') }
  lines.push('*تمارين اليوم :*')
  lines.push('')
  p.exercices.forEach((ex, i) => {
    const num = NUM_EMOJIS[i] ?? `${i + 1}.`
    lines.push(`*${num} ${ex.nom}*`)
    if (ex.position) lines.push(`📍 الوضعية : ${ex.position}`)
    const dureeLine = [ex.duree, ex.serie].filter(Boolean).join(' × ')
    if (dureeLine) lines.push(`⏱ ${dureeLine}`)
    if (ex.description) lines.push(ex.description)
    if (ex.conseil)     lines.push(`💡 ${ex.conseil}`)
    if (ex.attention)   lines.push(`⚠️ ${ex.attention}`)
    lines.push('')
  })
  if (p.conseils_generaux?.length) {
    lines.push('*نصائح عامة :*')
    p.conseils_generaux.forEach(c => lines.push(`✅ ${c}`))
    lines.push('')
  }
  if (p.message_fin) { lines.push(p.message_fin); lines.push('') }
  if (ctx.prochainRdv) lines.push(`_موعدك القادم : ${ctx.prochainRdv}_`)
  if (ctx.cabinetNom)  lines.push(`_${ctx.cabinetNom}${ctx.cabinetTel ? ` — ${ctx.cabinetTel}` : ''}_`)
  return lines.join('\n').trim()
}

/** Format a Moroccan phone (212XXXXXXXXX). Accepts 0XXXXXXXXX. */
export function waPhone(raw: string): string {
  const clean = raw.replace(/[\s\-\+]/g, '')
  if (clean.startsWith('212')) return clean
  if (clean.startsWith('0'))    return '212' + clean.slice(1)
  return '212' + clean
}

export function waUrl(phone: string, message: string): string {
  return `https://wa.me/${waPhone(phone)}?text=${encodeURIComponent(message)}`
}
