import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const praticienId = searchParams.get('praticienId')

    const rendezVous = await prisma.rendezVous.findMany({
      where: {
        ...(date ? {
          date: {
            gte: new Date(date + 'T00:00:00'),
            lte: new Date(date + 'T23:59:59'),
          }
        } : {}),
        ...(praticienId ? { praticienId } : {}),
      },
      include: {
        patient: { select: { id: true, nom: true, prenom: true } },
        praticien: { select: { id: true, nom: true, prenom: true, couleur: true } },
      },
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(rendezVous)
  } catch (error) {
    console.error('[GET /api/rendez-vous]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rdv = await prisma.rendezVous.create({
      data: {
        date: new Date(body.date),
        duree: body.duree || 45,
        typeSeance: body.typeSeance,
        salle: body.salle || null,
        notes: body.notes || null,
        statut: body.statut || 'confirme',
        patientId: body.patientId,
        praticienId: body.praticienId,
      },
      include: {
        patient: { select: { id: true, nom: true, prenom: true } },
        praticien: { select: { id: true, nom: true, prenom: true, couleur: true } },
      },
    })
    return NextResponse.json(rdv, { status: 201 })
  } catch (error) {
    console.error('[POST /api/rendez-vous]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
