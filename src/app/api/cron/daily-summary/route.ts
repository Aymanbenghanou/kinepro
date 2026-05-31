import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPushToCabinet } from '@/lib/push'
import { RdvStatut } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now        = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  try {
    // Get all cabinets with at least one push subscription
    const cabinets = await prisma.cabinet.findMany({
      where: {
        users: {
          some: {
            pushSubscriptions: { some: {} },
          },
        },
      },
      select: { id: true, nom: true },
    })

    let processed = 0

    for (const cabinet of cabinets) {
      const [rdvCount, pendingFeedbacks] = await Promise.all([
        prisma.rendezVous.count({
          where: {
            cabinetId: cabinet.id,
            date: { gte: todayStart, lte: todayEnd },
            statut: { not: RdvStatut.annule },
          },
        }),
        prisma.seance.count({
          where: {
            cabinetId: cabinet.id,
            feedbackStatus: { in: ['pending', 'ready'] },
          },
        }),
      ])

      // Only notify if there's something worth saying
      if (rdvCount === 0 && pendingFeedbacks === 0) continue

      const parts: string[] = []
      if (rdvCount > 0)           parts.push(`${rdvCount} RDV aujourd'hui`)
      if (pendingFeedbacks > 0)   parts.push(`${pendingFeedbacks} feedback${pendingFeedbacks > 1 ? 's' : ''} en attente`)

      await sendPushToCabinet(cabinet.id, {
        title: '📋 Votre journée KinéPro',
        body:  parts.join(' · '),
        tag:   'daily-summary',
        data:  { url: '/dashboard' },
      }).catch(() => {})

      processed++
    }

    return NextResponse.json({ processed })
  } catch (error) {
    console.error('[cron/daily-summary]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
