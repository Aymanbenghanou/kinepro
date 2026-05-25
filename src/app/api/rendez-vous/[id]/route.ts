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
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    const existing = await prisma.rendezVous.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 })

    const body = await request.json()
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
        praticienId: body.praticienId,
      },
    })
    return NextResponse.json(rdv)
  } catch (error) {
    console.error('[PUT /api/rendez-vous/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

// PATCH — déplacement (reschedule) d'un RDV : ne change que la date/heure.
// Garde la durée d'origine, vérifie l'appartenance au cabinet, refuse les
// créneaux passés, les statuts figés et les conflits (même praticien, chevauchement).
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

    const existing = await prisma.rendezVous.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 })

    const body = await request.json()
    if (!body?.date) {
      return NextResponse.json({ error: 'Date manquante' }, { status: 400 })
    }
    const newStart = new Date(body.date)
    if (isNaN(newStart.getTime())) {
      return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
    }

    // Statut figé : non déplaçable
    const frozen = ['annule', 'annulee', 'realisee', 'termine', 'honore', 'absent', 'no_show']
    if (existing.statut && frozen.includes(existing.statut.toLowerCase())) {
      return NextResponse.json({ error: 'Ce RDV ne peut pas être déplacé' }, { status: 409 })
    }

    // Pas de créneau passé (tolérance 1 min pour le tout récent)
    if (newStart.getTime() < Date.now() - 60_000) {
      return NextResponse.json({ error: 'Impossible de déplacer vers un créneau passé' }, { status: 409 })
    }

    // Conflit : même praticien, chevauchement horaire (hors ce RDV)
    const duree = existing.duree ?? 45
    const newEnd = new Date(newStart.getTime() + duree * 60_000)
    const sameDayOthers = await prisma.rendezVous.findMany({
      where: {
        cabinetId,
        praticienId: existing.praticienId,
        id: { not: id },
        statut: { notIn: frozen },
        date: {
          gte: new Date(newStart.getFullYear(), newStart.getMonth(), newStart.getDate(), 0, 0, 0),
          lte: new Date(newStart.getFullYear(), newStart.getMonth(), newStart.getDate(), 23, 59, 59),
        },
      },
      select: { date: true, duree: true },
    })
    const overlaps = sameDayOthers.some(o => {
      const oStart = new Date(o.date).getTime()
      const oEnd = oStart + (o.duree ?? 45) * 60_000
      return newStart.getTime() < oEnd && newEnd.getTime() > oStart
    })
    if (overlaps) {
      return NextResponse.json({ error: 'Ce créneau est déjà occupé' }, { status: 409 })
    }

    const rdv = await prisma.rendezVous.update({
      where: { id },
      data: { date: newStart },
      include: { patient: { select: { id: true, nom: true, prenom: true, telephone: true } }, praticien: { select: { id: true, nom: true, prenom: true, couleur: true } } },
    })
    return NextResponse.json(rdv)
  } catch (error) {
    console.error('[PATCH /api/rendez-vous/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function DELETE(
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

    const existing = await prisma.rendezVous.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 })

    await prisma.rendezVous.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/rendez-vous/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
