import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { sendPushToCabinet } from '@/lib/push'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const DELAY_MS = 20 * 60 * 1000 // 20 minutes

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { cabinetId } = session.user

  try {
    const cutoff = new Date(Date.now() - DELAY_MS)

    // Lazy promotion: pending séances for this cabinet that have passed the delay
    const toPromote = await prisma.seance.findMany({
      where: {
        cabinetId,
        feedbackStatus: 'pending',
        seanceEndTime: { lte: cutoff },
      },
      include: { patient: { select: { prenom: true, nom: true } } },
    })

    if (toPromote.length > 0) {
      // Promote all to "ready" with unique tokens
      await Promise.all(
        toPromote.map((s) =>
          prisma.seance.update({
            where: { id: s.id },
            data: {
              feedbackStatus:  'ready',
              feedbackToken:   crypto.randomBytes(32).toString('hex'),
              feedbackReadyAt: new Date(),
            },
          })
        )
      )

      // Send push notification for the batch
      const names = toPromote.map((s) => `${s.patient.prenom} ${s.patient.nom}`)
      const body  = toPromote.length === 1
        ? `${names[0]} — Séance terminée il y a 20 min`
        : `${names.slice(0, 2).join(', ')}${toPromote.length > 2 ? ` +${toPromote.length - 2}` : ''}`

      await sendPushToCabinet(cabinetId, {
        title:              '⏰ Feedback prêt à envoyer',
        body,
        tag:                'feedback-ready',
        requireInteraction: true,
        data:               { url: '/whatsapp?tab=ready' },
        actions: [
          { action: 'open_whatsapp', title: '📱 Ouvrir WhatsApp' },
          { action: 'dismiss',       title: 'Plus tard' },
        ],
      }).catch(() => {}) // don't fail if push fails (no subscriptions yet)
    }

    // Return all ready séances for this cabinet
    const ready = await prisma.seance.findMany({
      where: {
        cabinetId,
        feedbackStatus: 'ready',
      },
      include: {
        patient:   { select: { id: true, nom: true, prenom: true, telephone: true } },
        praticien: { select: { nom: true, prenom: true } },
      },
      orderBy: { feedbackReadyAt: 'desc' },
    })

    return NextResponse.json(ready)
  } catch (error) {
    console.error('[feedback/ready]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
