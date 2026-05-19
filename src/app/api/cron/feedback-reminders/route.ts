import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const expected   = `Bearer ${process.env.CRON_SECRET}`
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const delay = 20 * 60 * 1000 // 20 minutes in ms
  const cutoff = new Date(Date.now() - delay)

  try {
    // Find séances with feedbackStatus=pending and seanceEndTime <= cutoff
    const pending = await prisma.seance.findMany({
      where: {
        feedbackStatus: 'pending',
        seanceEndTime: { lte: cutoff },
      },
      select: { id: true },
    })

    if (pending.length === 0) {
      return NextResponse.json({ processed: 0 })
    }

    // Generate unique tokens and mark as ready
    let processed = 0
    for (const seance of pending) {
      const token = crypto.randomBytes(32).toString('hex')
      await prisma.seance.update({
        where: { id: seance.id },
        data: {
          feedbackStatus:  'ready',
          feedbackToken:   token,
          feedbackReadyAt: new Date(),
        },
      })
      processed++
    }

    return NextResponse.json({ processed })
  } catch (error) {
    console.error('[cron/feedback-reminders]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
