import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/feedback/ready
 *
 * Renvoie la liste des séances "prêtes à envoyer" pour le cabinet
 * connecté. Depuis le commit qui supprime le délai 20 min, la transition
 * pending → ready n'existe plus : `/api/seances/[id]/terminer` pose
 * directement `feedbackStatus='ready'` + `feedbackToken` + `feedbackReadyAt`
 * au moment de la finalisation de la séance. Cette route n'est plus qu'un
 * SELECT — pas de promotion, pas de push (notification déjà inutile car
 * c'est le kiné qui termine la séance et voit l'effet immédiatement).
 *
 * Conservée car consommée par 3 composants UI :
 *   - whatsapp/page.tsx tab "Feedback prêt"
 *   - components/dashboard/FeedbackWidget.tsx (carte dashboard)
 *   - components/layout/FeedbackNotificationBar.tsx
 *
 * Pas de cron Vercel ne l'appelle (cf. vercel.json).
 */
export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { cabinetId } = session.user

  try {
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
