import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicLimiter, checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, publicLimiter); if (rl) return rl
  try {
    const body = await request.json()
    const { token, score, commentaire } = body

    if (!token || typeof score !== 'number' || score < 1 || score > 10) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    // Find the séance by token
    const seance = await prisma.seance.findUnique({
      where: { feedbackToken: token },
      include: { patient: { select: { id: true } } },
    })

    if (!seance) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })
    }

    if (seance.feedbackStatus === 'sent' || seance.feedbackEnvoye) {
      return NextResponse.json({ error: 'Feedback déjà soumis' }, { status: 409 })
    }

    // Create the feedback record
    const feedback = await prisma.feedback.create({
      data: {
        score,
        commentaire:  commentaire || null,
        typeMessage:  'post_seance',
        cabinetId:    seance.cabinetId,
        patientId:    seance.patientId,
        seanceId:     seance.id,
      },
    })

    // Mark séance as feedback sent
    await prisma.seance.update({
      where: { id: seance.id },
      data: {
        feedbackStatus:  'sent',
        feedbackEnvoye:  true,
        dateFeedback:    new Date(),
        scorePatient:    score,
      },
    })

    return NextResponse.json({ success: true, feedback }, { status: 201 })
  } catch (error) {
    console.error('[feedback/submit]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
