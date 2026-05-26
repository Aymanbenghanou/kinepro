import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { assertNotWalled } from '@/lib/plan-server'

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
    const statut = searchParams.get('statut')

    const factures = await prisma.facture.findMany({
      where: {
        cabinetId,
        ...(statut ? { statut } : {}),
      },
      include: {
        patient: { select: { id: true, nom: true, prenom: true, telephone: true, email: true, publicToken: true } },
        seance:  { select: { id: true, typeSeance: true, date: true } },
      },
      orderBy: { dateEmise: 'desc' },
    })
    return NextResponse.json(factures)
  } catch (error) {
    console.error('[GET /api/factures]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const body = await request.json()
    const facture = await prisma.facture.create({
      data: {
        cabinetId,
        montant:   body.montant,
        statut:    body.statut    || 'en_attente',
        patientId: body.patientId,
        seanceId:  body.seanceId  || null,
      },
      include: {
        patient: { select: { id: true, nom: true, prenom: true } },
      },
    })
    return NextResponse.json(facture, { status: 201 })
  } catch (error) {
    console.error('[POST /api/factures]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
