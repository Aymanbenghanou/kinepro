import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { cabinetId } = session.user

  try {
    const [pending, avgScoreData] = await Promise.all([
      prisma.seance.count({
        where: { cabinetId, feedbackStatus: 'pending' },
      }),
      prisma.feedback.aggregate({
        where: { cabinetId },
        _avg: { score: true },
      }),
    ])

    return NextResponse.json({
      pending,
      avgScore: avgScoreData._avg.score
        ? Math.round(avgScoreData._avg.score * 10) / 10
        : null,
    })
  } catch (error) {
    console.error('[dashboard/feedback-stats]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
