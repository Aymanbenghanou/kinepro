import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { editScoresSchema } from '@/lib/schemas/medical'
import { SeanceStatut } from '@prisma/client'

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * PATCH /api/seances/[id]/scores
 *
 * Édition des scores cliniques d'une séance réalisée, dans une fenêtre de
 * 24h après seanceEndTime (= completedAt sémantique). Pas de modification du
 * statut, pas de modification du RDV lié.
 *
 * Codes d'erreur :
 *   - 404 séance introuvable
 *   - 409 not_realisee  : statut ≠ 'realisee'
 *   - 409 scores_locked : > 24h après seanceEndTime
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
      where:  { id, cabinetId },
      select: { id: true, statut: true, seanceEndTime: true },
    })
    if (!seance) {
      return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 })
    }

    if (seance.statut !== SeanceStatut.realisee) {
      return NextResponse.json(
        { error: 'not_realisee', current: seance.statut },
        { status: 409 },
      )
    }

    // Fenêtre 24h : verrouillage strict après expiration. Si seanceEndTime est
    // null (cas dégénéré : terminée avant l'introduction de ce champ), on
    // considère la fenêtre comme expirée immédiatement.
    const completedAt = seance.seanceEndTime
    const now = Date.now()
    if (!completedAt || (now - completedAt.getTime()) > EDIT_WINDOW_MS) {
      return NextResponse.json(
        {
          error: 'scores_locked',
          completedAt: completedAt?.toISOString() ?? null,
          lockedAt: completedAt ? new Date(completedAt.getTime() + EDIT_WINDOW_MS).toISOString() : null,
        },
        { status: 409 },
      )
    }

    const v = await validateBody(request, editScoresSchema)
    if ('error' in v) return v.error
    const body = v.data

    // Diff-only : on ne pose que les champs présents dans le body.
    const data: Record<string, unknown> = {}
    if ('douleurScore'     in body) data.douleurScore     = body.douleurScore     ?? null
    if ('mobiliteScore'    in body) data.mobiliteScore    = body.mobiliteScore    ?? null
    if ('forceScore'       in body) data.forceScore       = body.forceScore       ?? null
    if ('notesProgression' in body) data.notesProgression = body.notesProgression ?? null
    if ('observations'     in body) data.notesInternes    = body.observations     ?? null

    const updated = await prisma.seance.update({
      where: { id },
      data,
      include: {
        patient:    { select: { id: true, nom: true, prenom: true, telephone: true } },
        praticien:  { select: { id: true, nom: true, prenom: true } },
        rendezVous: { select: { id: true, statut: true } },
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/seances/[id]/scores]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
