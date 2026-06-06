import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { createSeanceSchema } from '@/lib/schemas/medical'
import { SeanceStatut } from '@prisma/client'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const { searchParams } = new URL(request.url)
    const patientId   = searchParams.get('patientId')
    const praticienId = searchParams.get('praticienId')
    const statutRaw   = searchParams.get('statut')
    const statut      = statutRaw && statutRaw in SeanceStatut ? statutRaw as SeanceStatut : null
    const from        = searchParams.get('from')
    const to          = searchParams.get('to')
    const takeParam   = searchParams.get('take')
    const skipParam   = searchParams.get('skip')
    const take = takeParam === 'all' ? undefined
      : Math.max(1, Math.min(1000, parseInt(takeParam ?? '200', 10) || 200))
    const skip = Math.max(0, parseInt(skipParam ?? '0', 10) || 0)

    const dateFilter = (from || to)
      ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
      : {}

    const seances = await prisma.seance.findMany({
      where: {
        cabinetId,
        ...(patientId   ? { patientId }   : {}),
        ...(praticienId ? { praticienId } : {}),
        ...(statut      ? { statut }      : {}),
        ...dateFilter,
      },
      include: {
        patient:    { select: { id: true, nom: true, prenom: true } },
        praticien:  { select: { id: true, nom: true, prenom: true, couleur: true } },
        // Tarif exposé pour le modal "Créer facture" (auto-fill montant).
        // Champ optionnel : si la séance n'est pas liée à un SeanceType, le
        // client retombe sur Patient.tarifSeance puis saisie manuelle.
        seanceType: { select: { id: true, nom: true, tarifDefaut: true } },
      },
      orderBy: { date: 'desc' },
      ...(take !== undefined ? { take } : {}),
      ...(skip > 0 ? { skip } : {}),
    })
    return NextResponse.json(seances)
  } catch (error) {
    console.error('[GET /api/seances]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('dossierMedical'); if (__perm instanceof NextResponse) return __perm;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const v = await validateBody(request, createSeanceSchema)
    if ('error' in v) return v.error
    const body = v.data

    const seance = await prisma.seance.create({
      data: {
        cabinetId,
        date:        new Date(body.date),
        duree:       body.duree       || 45,
        typeSeance:  body.typeSeance,
        notes:       body.notes       || null,
        statut:      body.statut      || 'realisee',
        patientId:   body.patientId,
        praticienId: body.praticienId,
      },
      include: {
        patient:   { select: { id: true, nom: true, prenom: true } },
        praticien: { select: { id: true, nom: true, prenom: true } },
      },
    })
    return NextResponse.json(seance, { status: 201 })
  } catch (error) {
    console.error('[POST /api/seances]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
