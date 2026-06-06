import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { terminerSeanceSchema } from '@/lib/schemas/medical'
import { Prisma, SeanceStatut, RdvStatut } from '@prisma/client'
import crypto from 'crypto'

/**
 * PATCH /api/seances/[id]/terminer
 *
 * Finalise une séance planifiee vers l'un des 3 statuts terminaux :
 *   - 'realisee' : set scores + seanceEndTime (= completedAt sémantique pour la
 *     fenêtre d'édition 24h) + feedbackStatus 'ready' + feedbackToken généré
 *     + feedbackReadyAt = now() + bascule RDV → realise. Le lien feedback est
 *     immédiatement disponible côté WhatsApp Center (pas de délai 20 min).
 *   - 'no_show'  : seanceEndTime + scores + feedback restent null ; aucun
 *     changement du RDV lié (RdvStatut n'a pas de no_show, cf. AGENTS.md §8).
 *   - 'annulee'  : seanceEndTime + scores + feedback restent null ; RDV → annule.
 *
 * Idempotence : si la séance n'est plus planifiee → 409 statut_already_set.
 * La double-finalisation est ainsi impossible — un seul feedbackToken généré.
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
        { error: 'statut_already_set', current: seance.statut },
        { status: 409 },
      )
    }

    const v = await validateBody(request, terminerSeanceSchema)
    if ('error' in v) return v.error
    const body = v.data

    // Construction du data Seance selon le statut cible.
    const seanceData: Record<string, unknown> = { statut: body.statut }

    if (body.statut === SeanceStatut.realisee) {
      const now = new Date()
      seanceData.seanceEndTime   = now
      seanceData.feedbackStatus  = 'ready'
      seanceData.feedbackToken   = crypto.randomBytes(32).toString('hex')
      seanceData.feedbackReadyAt = now
      if ('douleurScore'     in body) seanceData.douleurScore     = body.douleurScore     ?? null
      if ('mobiliteScore'    in body) seanceData.mobiliteScore    = body.mobiliteScore    ?? null
      if ('forceScore'       in body) seanceData.forceScore       = body.forceScore       ?? null
      if ('notesProgression' in body) seanceData.notesProgression = body.notesProgression ?? null
      if ('observations'     in body) seanceData.notesInternes    = body.observations     ?? null
    } else {
      // no_show / annulee : aucun score, pas de finalisation, pas de feedback.
      seanceData.seanceEndTime    = null
      seanceData.feedbackStatus   = null
      seanceData.feedbackToken    = null
      seanceData.feedbackReadyAt  = null
      seanceData.douleurScore     = null
      seanceData.mobiliteScore    = null
      seanceData.forceScore       = null
      seanceData.notesProgression = null
    }

    // Mapping RDV lié (RdvStatut n'a pas no_show → on laisse le RDV inchangé).
    let rdvNewStatut: RdvStatut | null = null
    if      (body.statut === SeanceStatut.realisee) rdvNewStatut = RdvStatut.realise
    else if (body.statut === SeanceStatut.annulee)  rdvNewStatut = RdvStatut.annule

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.seance.update({
        where: { id: seance.id },
        data:  seanceData,
        include: {
          patient:    { select: { id: true, nom: true, prenom: true, telephone: true } },
          praticien:  { select: { id: true, nom: true, prenom: true } },
          rendezVous: { select: { id: true, statut: true } },
        },
      }),
    ]
    if (seance.rendezVousId && rdvNewStatut) {
      ops.push(
        prisma.rendezVous.update({
          where: { id: seance.rendezVousId },
          data:  { statut: rdvNewStatut },
        }),
      )
    }

    const [updatedSeance] = await prisma.$transaction(ops)
    return NextResponse.json(updatedSeance)
  } catch (error) {
    console.error('[PATCH /api/seances/[id]/terminer]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
