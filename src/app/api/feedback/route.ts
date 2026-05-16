import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { cabinetId } = session.user

  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const feedbacks = await prisma.feedback.findMany({
      where: {
        cabinetId,
        ...(patientId ? { patientId } : {}),
      },
      include: {
        patient: { select: { id: true, nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json(feedbacks)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { cabinetId } = session.user

  try {
    const body = await request.json()
    const feedback = await prisma.feedback.create({
      data: {
        score: body.score,
        commentaire: body.commentaire || null,
        typeMessage: body.typeMessage || 'post_seance',
        cabinetId,
        patientId: body.patientId,
        seanceId: body.seanceId || null,
      },
      include: {
        patient: { select: { nom: true, prenom: true } },
      },
    })
    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
