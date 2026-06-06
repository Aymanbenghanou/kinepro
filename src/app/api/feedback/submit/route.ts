import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicLimiter, checkRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/feedback/submit
 *
 * Body : { token: string, score: number (1-10) }.
 *
 * Stockage :
 *   - Feedback.score    : score 1-10 brut.
 *   - Seance.scorePatient : idem.
 *   - Seance.feedbackStatus = 'sent', feedbackEnvoye = true,
 *     dateFeedback = now().
 *
 * Idempotence : si déjà soumis, on renvoie 200 avec l'état persisté +
 *   googleMapsLink (utile si le patient retombe sur la page).
 *
 * Réponse : { success, score, googleMapsLink, alreadySubmitted? }.
 *   Le client redirige vers googleMapsLink si score >= 8 ET URL valide.
 *
 * La clé `googleMapsLink` est un identifiant de transport (contrat client).
 * La source DB est Cabinet.googleReviewLink (cf. commit 9723ca9 / 63609e0).
 */
export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, publicLimiter); if (rl) return rl
  try {
    const body = await request.json()
    const { token, score } = body as { token?: unknown; score?: unknown }

    if (typeof token !== 'string' || typeof score !== 'number'
        || !Number.isInteger(score) || score < 1 || score > 10) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const seance = await prisma.seance.findUnique({
      where: { feedbackToken: token },
      include: { patient: { select: { id: true } } },
    })
    if (!seance) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })
    }

    const cab = await prisma.cabinet.findUnique({
      where: { id: seance.cabinetId },
      select: { googleReviewLink: true },
    })
    const googleMapsLink = cab?.googleReviewLink ?? null

    // Idempotence : déjà soumis → retourne l'état persisté.
    if (seance.feedbackEnvoye) {
      return NextResponse.json(
        {
          success: true,
          alreadySubmitted: true,
          score: seance.scorePatient ?? score,
          googleMapsLink,
        },
        { status: 200 },
      )
    }

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
        feedbackStatus:  'sent',
        feedbackEnvoye:  true,
        dateFeedback:    new Date(),
        scorePatient:    score,
      },
    })

    return NextResponse.json(
      { success: true, score, googleMapsLink, feedback },
      { status: 201 },
    )
  } catch (error) {
    console.error('[feedback/submit]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
