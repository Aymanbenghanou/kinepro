import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { updateSeanceSchema } from '@/lib/schemas/medical'

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
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('dossierMedical'); if (__perm instanceof NextResponse) return __perm;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    const existing = await prisma.seance.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'Séance non trouvée' }, { status: 404 })

    const v = await validateBody(request, updateSeanceSchema)
    if ('error' in v) return v.error
    const body = v.data

    const seance = await prisma.seance.update({
      where: { id },
      data: {
        statut:            body.statut            !== undefined ? body.statut            : undefined,
        scorePatient:      body.scorePatient      !== undefined ? body.scorePatient      : undefined,
        notesInternes:     body.notesInternes     !== undefined ? body.notesInternes     : undefined,
        feedbackEnvoye:    body.feedbackEnvoye    !== undefined ? body.feedbackEnvoye    : undefined,
        dateFeedback:      body.feedbackEnvoye ? new Date() : undefined,
        notes:             body.notes             !== undefined ? body.notes             : undefined,
        douleurScore:      body.douleurScore      !== undefined ? body.douleurScore      : undefined,
        mobiliteScore:     body.mobiliteScore     !== undefined ? body.mobiliteScore     : undefined,
        forceScore:        body.forceScore        !== undefined ? body.forceScore        : undefined,
        notesProgression:  body.notesProgression  !== undefined ? body.notesProgression  : undefined,
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
