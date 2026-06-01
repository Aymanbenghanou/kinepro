import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { terminerSeanceSchema } from '@/lib/schemas/medical'
import { Prisma, SeanceStatut, RdvStatut } from '@prisma/client'

/**
 * PATCH /api/seances/[id]/terminer
 * Passe une séance "planifiee" en "realisee" avec saisie des notes médicales,
 * et bascule le RDV lié en "realise" si présent (transaction atomique).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('dossierMedical'); if (__perm instanceof NextResponse) return __perm;

  const session = await auth()
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { cabinetId } = session.user
  const { id } = await params

  try {
    const seance = await prisma.seance.findFirst({
      where: { id, cabinetId },
      select: { id: true, statut: true, rendezVousId: true },
    })
    if (!seance) {
      return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 })
    }

    if (seance.statut !== SeanceStatut.planifiee) {
      return NextResponse.json(
        { error: 'invalid_state', message: 'Séance déjà terminée ou non planifiée' },
        { status: 400 },
      )
    }

    const v = await validateBody(request, terminerSeanceSchema)
    if ('error' in v) return v.error
    const body = v.data

    // Diff-only : on ne pose que les champs effectivement envoyés.
    // observations → notesInternes (la séance n'a pas de champ "observations").
    const seanceData: Record<string, unknown> = {
      statut:         SeanceStatut.realisee,
      seanceEndTime:  new Date(),
      feedbackStatus: 'pending',
    }
    if ('douleurScore'     in body) seanceData.douleurScore     = body.douleurScore
    if ('mobiliteScore'    in body) seanceData.mobiliteScore    = body.mobiliteScore
    if ('forceScore'       in body) seanceData.forceScore       = body.forceScore
    if ('notesProgression' in body) seanceData.notesProgression = body.notesProgression
    if ('observations'     in body) seanceData.notesInternes    = body.observations

    // Transaction : maj séance + bascule du RDV lié si présent.
    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.seance.update({
        where: { id: seance.id },
        data: seanceData,
        include: {
          patient:   { select: { id: true, nom: true, prenom: true, telephone: true } },
          praticien: { select: { id: true, nom: true, prenom: true } },
          rendezVous: { select: { id: true, statut: true } },
        },
      }),
    ]
    if (seance.rendezVousId) {
      ops.push(
        prisma.rendezVous.update({
          where: { id: seance.rendezVousId },
          data: { statut: RdvStatut.realise },
        }),
      )
    }

    const [updatedSeance] = await prisma.$transaction(ops)
    return NextResponse.json(updatedSeance)
  } catch (error) {
    console.error('[seances/terminer]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
