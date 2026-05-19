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
