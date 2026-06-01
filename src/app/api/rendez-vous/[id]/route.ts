import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { updateRdvSchema } from '@/lib/schemas/medical'
import { Prisma, RdvStatut, SeanceStatut } from '@prisma/client'

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

    const rdv = await prisma.rendezVous.findFirst({
      where: { id, cabinetId },
      include: { patient: true, praticien: true },
    })
    if (!rdv) return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 })
    return NextResponse.json(rdv)
  } catch (error) {
    console.error('[GET /api/rendez-vous/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('agenda'); if (__perm instanceof NextResponse) return __perm;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId, role, praticienId: sessionPraticienId } = session.user
    const { id } = await params

    const existing = await prisma.rendezVous.findFirst({
      where: { id, cabinetId },
      include: { seance: { select: { id: true, statut: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 })

    // Garde-fou : un PRATICIEN ne peut modifier QUE ses propres RDV.
    if (role === 'PRATICIEN') {
      if (!sessionPraticienId || existing.praticienId !== sessionPraticienId) {
        return NextResponse.json({ error: 'not_your_rdv' }, { status: 403 })
      }
    }

    const v = await validateBody(request, updateRdvSchema)
    if ('error' in v) return v.error
    const body = v.data

    // Un PRATICIEN ne peut pas réassigner le RDV à un collègue : on force.
    const praticienIdFinal = role === 'PRATICIEN'
      ? sessionPraticienId
      : body.praticienId

    // Propagation à la séance liée tant qu'elle est encore "planifiee" :
    //  - changements de date/praticien/patient/type/durée → recopiés.
    //  - passage RDV à "annule" → séance "planifiee" devient "annulee".
    // Si la séance est déjà "realisee", on ne touche à rien (les notes restent intactes).
    const seanceLinked = existing.seance
    const propagateToSeance = seanceLinked?.statut === SeanceStatut.planifiee

    const seanceData: Record<string, unknown> = {}
    if (propagateToSeance) {
      if (body.date        !== undefined) seanceData.date        = new Date(body.date)
      if (body.duree       !== undefined) seanceData.duree       = body.duree
      if (body.typeSeance  !== undefined) seanceData.typeSeance  = body.typeSeance
      if (body.patientId   !== undefined) seanceData.patientId   = body.patientId
      if (praticienIdFinal !== undefined && praticienIdFinal !== null) {
        seanceData.praticienId = praticienIdFinal
      }
      if (body.statut === RdvStatut.annule) {
        seanceData.statut = SeanceStatut.annulee
      }
    }

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.rendezVous.update({
        where: { id },
        data: {
          date:        body.date        ? new Date(body.date) : undefined,
          duree:       body.duree,
          typeSeance:  body.typeSeance,
          salle:       body.salle,
          notes:       body.notes,
          statut:      body.statut,
          patientId:   body.patientId,
          praticienId: praticienIdFinal,
        },
      }),
    ]
    if (seanceLinked && Object.keys(seanceData).length > 0) {
      ops.push(
        prisma.seance.update({
          where: { id: seanceLinked.id },
          data: seanceData,
        }),
      )
    }

    const [rdv] = await prisma.$transaction(ops)
    return NextResponse.json(rdv)
  } catch (error) {
    console.error('[PUT /api/rendez-vous/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('agenda'); if (__perm instanceof NextResponse) return __perm;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId, role, praticienId: sessionPraticienId } = session.user
    const { id } = await params

    const existing = await prisma.rendezVous.findFirst({
      where: { id, cabinetId },
      include: { seance: { select: { id: true, statut: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 })

    // Garde-fou : un PRATICIEN ne peut supprimer QUE ses propres RDV.
    if (role === 'PRATICIEN') {
      if (!sessionPraticienId || existing.praticienId !== sessionPraticienId) {
        return NextResponse.json({ error: 'not_your_rdv' }, { status: 403 })
      }
    }

    // Séance "planifiee" (sans notes) → on la supprime aussi (rien à conserver).
    // Séance dans tout autre statut (realisee/annulee/no_show) → on la garde ;
    // le FK ON DELETE SET NULL effacera rendezVousId automatiquement.
    const seanceToDelete =
      existing.seance && existing.seance.statut === SeanceStatut.planifiee
        ? existing.seance.id
        : null

    if (seanceToDelete) {
      await prisma.$transaction([
        prisma.seance.delete({ where: { id: seanceToDelete } }),
        prisma.rendezVous.delete({ where: { id } }),
      ])
    } else {
      await prisma.rendezVous.delete({ where: { id } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/rendez-vous/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
