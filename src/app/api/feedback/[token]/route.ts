import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicLimiter, checkRateLimit } from '@/lib/rate-limit'

/**
 * GET /api/feedback/[token]
 *
 * Endpoint public utilisé par la page /feedback/<token> au mount pour
 * pré-charger le lien Google du cabinet. Cela permet de rediriger même
 * si le POST /submit échoue (ex: réseau flaky côté patient) tant qu'on
 * dispose du lien et que le score est éligible.
 *
 * Réponse : { valid: boolean, googleMapsLink: string|null, alreadySubmitted: boolean }.
 * Ne renvoie aucune donnée sensible (pas de patient, pas de cabinetId).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const rl = await checkRateLimit(request, publicLimiter); if (rl) return rl
  try {
    const { token } = await params
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ valid: false, googleMapsLink: null, alreadySubmitted: false }, { status: 200 })
    }
    const seance = await prisma.seance.findUnique({
      where: { feedbackToken: token },
      select: { cabinetId: true, feedbackEnvoye: true },
    })
    if (!seance) {
      return NextResponse.json({ valid: false, googleMapsLink: null, alreadySubmitted: false }, { status: 200 })
    }
    const cab = await prisma.cabinet.findUnique({
      where: { id: seance.cabinetId },
      select: { googleReviewLink: true },
    })
    return NextResponse.json({
      valid: true,
      googleMapsLink: cab?.googleReviewLink ?? null,
      alreadySubmitted: seance.feedbackEnvoye,
    }, { status: 200 })
  } catch (error) {
    console.error('[GET /api/feedback/[token]]', error)
    return NextResponse.json({ valid: false, googleMapsLink: null, alreadySubmitted: false }, { status: 200 })
  }
}
