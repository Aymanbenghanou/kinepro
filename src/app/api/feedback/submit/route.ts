import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicLimiter, checkRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/feedback/submit
 *
 * Nouveau flux : réponse binaire Oui/Non issue des liens dans le message
 * WhatsApp (cf. msgFeedbackAuto). Le score numérique 1-10 est supprimé.
 *
 * Stockage sans migration :
 *   - Feedback.score (Int requis) : Oui → 10, Non → 1. Conserve la
 *     compatibilité avec scoreCategory (>=8 excellent, <5 difficile)
 *     utilisé par les stats historiques du WhatsApp Center.
 *   - Seance.scorePatient : même mapping.
 *   - Seance.feedbackStatus : 'satisfait' | 'non_satisfait'.
 *
 * Idempotence : si le feedback est déjà soumis (feedbackEnvoye=true), on
 * renvoie 200 avec la réponse persistée + googleMapsLink (utile pour le cas
 * où le patient reclique le lien Oui après une 1re soumission).
 */
export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, publicLimiter); if (rl) return rl
  try {
    const body = await request.json()
    const { token, reponse } = body as { token?: unknown; reponse?: unknown }

    if (typeof token !== 'string' || (reponse !== 'oui' && reponse !== 'non')) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const seance = await prisma.seance.findUnique({
      where: { feedbackToken: token },
      include: { patient: { select: { id: true } } },
    })
    if (!seance) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })
    }

    // Source de vérité : Cabinet.googleReviewLink (colonne alimentée par le
     // formulaire /parametres/cabinet). Cabinet.googleMapsLink existe au
     // schéma mais n'est jamais écrit par l'UI → dette à nettoyer séparément.
    const cab = await prisma.cabinet.findUnique({
      where: { id: seance.cabinetId },
      select: { googleReviewLink: true },
    })
    const googleMapsLink = cab?.googleReviewLink ?? null

    // Idempotence : déjà soumis → on renvoie l'état actuel sans recréer.
    if (seance.feedbackEnvoye) {
      const satisfied = seance.feedbackStatus === 'satisfait'
      return NextResponse.json(
        { success: true, alreadySubmitted: true, satisfied, googleMapsLink },
        { status: 200 },
      )
    }

    const satisfied = reponse === 'oui'
    const score = satisfied ? 10 : 1
    const feedbackStatus = satisfied ? 'satisfait' : 'non_satisfait'

    const feedback = await prisma.feedback.create({
      data: {
        score,
        commentaire:  null,
        typeMessage:  'post_seance',
        cabinetId:    seance.cabinetId,
        patientId:    seance.patientId,
        seanceId:     seance.id,
      },
    })

    await prisma.seance.update({
      where: { id: seance.id },
      data: {
        feedbackStatus,
        feedbackEnvoye:  true,
        dateFeedback:    new Date(),
        scorePatient:    score,
      },
    })

    return NextResponse.json(
      { success: true, satisfied, googleMapsLink, feedback },
      { status: 201 },
    )
  } catch (error) {
    console.error('[feedback/submit]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
