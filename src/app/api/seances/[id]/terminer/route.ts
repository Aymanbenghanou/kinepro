import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { assertNotWalled } from '@/lib/plan-server'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const session = await auth()
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { cabinetId } = session.user
  const { id } = await params

  try {
    const seance = await prisma.seance.findFirst({
      where: { id, cabinetId },
    })
    if (!seance) {
      return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 })
    }

    const updated = await prisma.seance.update({
      where: { id },
      data: {
        statut:        'realisee',
        seanceEndTime: new Date(),
        feedbackStatus: 'pending',
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[seances/terminer]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
