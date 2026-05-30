import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { updateRdvSchema } from '@/lib/schemas/medical'

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

    const existing = await prisma.rendezVous.findFirst({ where: { id, cabinetId } })
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

    const rdv = await prisma.rendezVous.update({
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
    })
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

    const existing = await prisma.rendezVous.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 })

    // Garde-fou : un PRATICIEN ne peut supprimer QUE ses propres RDV.
    if (role === 'PRATICIEN') {
      if (!sessionPraticienId || existing.praticienId !== sessionPraticienId) {
        return NextResponse.json({ error: 'not_your_rdv' }, { status: 403 })
      }
    }

    await prisma.rendezVous.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/rendez-vous/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
