import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { updateSeanceSchema } from '@/lib/schemas/medical'
import { SeanceStatut } from '@prisma/client'

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000
const CLINICAL_FIELDS = ['douleurScore', 'mobiliteScore', 'forceScore', 'notesProgression', 'notesInternes'] as const

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

/**
 * PATCH /api/seances/[id]
 *
 * Édition admin/feedback (notes, scorePatient, feedbackEnvoye) — libre.
 * Édition champs cliniques (douleur/mobilité/force/notesProgression/notesInternes) :
 *   garde 24h identique à /scores : statut === 'realisee' ET now - seanceEndTime <= 24h.
 *   Sinon 409 not_realisee / scores_locked.
 *
 * Le statut N'EST PAS éditable ici (force le passage par /terminer pour les transitions).
 * Le champ a été retiré de `updateSeanceSchema` — un body { statut: ... } est silently stripped.
 */
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

    const existing = await prisma.seance.findFirst({
      where:  { id, cabinetId },
      select: { id: true, statut: true, seanceEndTime: true },
    })
    if (!existing) return NextResponse.json({ error: 'Séance non trouvée' }, { status: 404 })

    const v = await validateBody(request, updateSeanceSchema)
    if ('error' in v) return v.error
    const body = v.data

    // Garde clinique : si l'un des champs cliniques est présent, on enforce
    // la même fenêtre 24h que /api/seances/[id]/scores.
    const touchesClinical = CLINICAL_FIELDS.some(k => (body as Record<string, unknown>)[k] !== undefined)
    if (touchesClinical) {
      if (existing.statut !== SeanceStatut.realisee) {
        return NextResponse.json(
          { error: 'not_realisee', current: existing.statut },
          { status: 409 },
        )
      }
      const completedAt = existing.seanceEndTime
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
    }

    const seance = await prisma.seance.update({
      where: { id },
      data: {
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
