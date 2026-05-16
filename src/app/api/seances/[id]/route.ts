import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const seance = await prisma.seance.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, nom: true, prenom: true, telephone: true } },
        praticien: { select: { id: true, nom: true, prenom: true } },
      },
    })
    if (!seance) return NextResponse.json({ error: 'Séance non trouvée' }, { status: 404 })
    return NextResponse.json(seance)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const seance = await prisma.seance.update({
      where: { id },
      data: {
        statut:         body.statut         !== undefined ? body.statut         : undefined,
        scorePatient:   body.scorePatient   !== undefined ? body.scorePatient   : undefined,
        notesInternes:  body.notesInternes  !== undefined ? body.notesInternes  : undefined,
        feedbackEnvoye: body.feedbackEnvoye !== undefined ? body.feedbackEnvoye : undefined,
        dateFeedback:   body.feedbackEnvoye ? new Date() : undefined,
        notes:          body.notes          !== undefined ? body.notes          : undefined,
      },
      include: {
        patient: { select: { id: true, nom: true, prenom: true, telephone: true } },
        praticien: { select: { id: true, nom: true, prenom: true } },
      },
    })
    return NextResponse.json(seance)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
