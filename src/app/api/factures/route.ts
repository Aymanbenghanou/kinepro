import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statut = searchParams.get('statut')

    const factures = await prisma.facture.findMany({
      where: statut ? { statut } : {},
      include: {
        patient: { select: { id: true, nom: true, prenom: true } },
        seance: { select: { id: true, typeSeance: true, date: true } },
      },
      orderBy: { dateEmise: 'desc' },
    })
    return NextResponse.json(factures)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const facture = await prisma.facture.create({
      data: {
        montant: body.montant,
        statut: body.statut || 'en_attente',
        patientId: body.patientId,
        seanceId: body.seanceId || null,
      },
      include: {
        patient: { select: { id: true, nom: true, prenom: true } },
      },
    })
    return NextResponse.json(facture, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
