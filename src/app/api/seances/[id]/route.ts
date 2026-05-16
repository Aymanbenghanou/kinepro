import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    const seance = await prisma.seance.findFirst({
      where: { id, cabinetId },
      include: {
        patient:   { select: { id: true, nom: true, prenom: true, telephone: true } },
        praticien: { select: { id: true, nom: true, prenom: true } },
      },
    })
    if (!seance) return NextResponse.json({ error: 'Séance non trouvée' }, { status: 404 })
    return NextResponse.json(seance)
  } catch (error) {
    console.error('[GET /api/seances/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    const existing = await prisma.seance.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'Séance non trouvée' }, { status: 404 })

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
        patient:   { select: { id: true, nom: true, prenom: true, telephone: true } },
        praticien: { select: { id: true, nom: true, prenom: true } },
      },
    })
    return NextResponse.json(seance)
  } catch (error) {
    console.error('[PATCH /api/seances/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
