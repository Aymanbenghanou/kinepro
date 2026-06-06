import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { createRdvSchema } from '@/lib/schemas/medical'
import { RdvStatut, SeanceStatut } from '@prisma/client'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId, role, praticienId: sessionPraticienId } = session.user

    // Scope par praticien : un PRATICIEN ne voit QUE ses propres RDV.
    // Safe-guard : si role=PRATICIEN sans praticienId rattaché → liste vide.
    if (role === 'PRATICIEN' && !sessionPraticienId) {
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const date          = searchParams.get('date')
    const queryPraticien = searchParams.get('praticienId')
    const from          = searchParams.get('from')
    const to            = searchParams.get('to')
    const takeParam     = searchParams.get('take')
    const skipParam     = searchParams.get('skip')
    const take = takeParam === 'all' ? undefined
      : Math.max(1, Math.min(1000, parseInt(takeParam ?? '300', 10) || 300))
    const skip = Math.max(0, parseInt(skipParam ?? '0', 10) || 0)

    // PRATICIEN : on ignore le filtre client, on impose son propre id.
    const effectivePraticienFilter = role === 'PRATICIEN'
      ? sessionPraticienId
      : queryPraticien

    // `date` (jour exact) reste prioritaire ; sinon une plage `from`/`to`
    // optionnelle peut être passée par les nouveaux call sites paginés.
    const dateFilter = date
      ? { date: { gte: new Date(date + 'T00:00:00'), lte: new Date(date + 'T23:59:59') } }
      : (from || to)
        ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}

    const rendezVous = await prisma.rendezVous.findMany({
      where: {
        cabinetId,
        ...dateFilter,
        ...(effectivePraticienFilter ? { praticienId: effectivePraticienFilter } : {}),
      },
      include: {
        patient:   { select: { id: true, nom: true, prenom: true, telephone: true } },
        praticien: { select: { id: true, nom: true, prenom: true, couleur: true } },
      },
      orderBy: { date: 'asc' },
      ...(take !== undefined ? { take } : {}),
      ...(skip > 0 ? { skip } : {}),
    })
    // include source & patientNotes in output (already in the model, returned by default)
    return NextResponse.json(rendezVous)
  } catch (error) {
    console.error('[GET /api/rendez-vous]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('agenda'); if (__perm instanceof NextResponse) return __perm;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId, role, praticienId: sessionPraticienId } = session.user

    const v = await validateBody(request, createRdvSchema)
    if ('error' in v) return v.error
    const body = v.data

    // Garde-fou serveur : un PRATICIEN ne peut créer un RDV que pour lui-même.
    // OWNER / SECRETAIRE / SUPER_ADMIN choisissent librement le praticien.
    let praticienIdFinal: string = body.praticienId
    if (role === 'PRATICIEN') {
      if (!sessionPraticienId) {
        return NextResponse.json({ error: 'praticien_not_linked' }, { status: 403 })
      }
      praticienIdFinal = sessionPraticienId
    }
    if (!praticienIdFinal) {
      return NextResponse.json({ error: 'praticienId requis' }, { status: 400 })
    }

    // Transaction : créer le RDV + générer la séance planifiée liée. Atomique :
    // si la création de la séance échoue, le RDV est rollback.
    const rdvDate = new Date(body.date)
    const rdvDuree = body.duree || 45
    const rdv = await prisma.$transaction(async (tx) => {
      const created = await tx.rendezVous.create({
        data: {
          cabinetId,
          date:        rdvDate,
          duree:       rdvDuree,
          typeSeance:  body.typeSeance,
          notes:       body.notes      ?? null,
          statut:      body.statut     || RdvStatut.confirme,
          patientId:   body.patientId,
          praticienId: praticienIdFinal,
        },
        include: {
          patient:   { select: { id: true, nom: true, prenom: true, telephone: true } },
          praticien: { select: { id: true, nom: true, prenom: true, couleur: true } },
        },
      })

      await tx.seance.create({
        data: {
          cabinetId,
          patientId:    created.patientId,
          praticienId:  created.praticienId,
          typeSeance:   created.typeSeance,
          duree:        rdvDuree,
          date:         rdvDate,
          statut:       SeanceStatut.planifiee,
          rendezVousId: created.id,
        },
      })

      return created
    })

    return NextResponse.json(rdv, { status: 201 })
  } catch (error) {
    console.error('[POST /api/rendez-vous]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
