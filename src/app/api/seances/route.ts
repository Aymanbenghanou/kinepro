import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const praticienId = searchParams.get('praticienId')
    const statut = searchParams.get('statut')

    const seances = await prisma.seance.findMany({
      where: {
        ...(patientId ? { patientId } : {}),
        ...(praticienId ? { praticienId } : {}),
        ...(statut ? { statut } : {}),
      },
      include: {
        patient: { select: { id: true, nom: true, prenom: true } },
        praticien: { select: { id: true, nom: true, prenom: true, couleur: true } },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(seances)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const seance = await prisma.seance.create({
      data: {
        date: new Date(body.date),
        duree: body.duree || 45,
        typeSeance: body.typeSeance,
        notes: body.notes || null,
        statut: body.statut || 'realisee',
        patientId: body.patientId,
        praticienId: body.praticienId,
      },
      include: {
        patient: { select: { id: true, nom: true, prenom: true } },
        praticien: { select: { id: true, nom: true, prenom: true } },
      },
    })
    return NextResponse.json(seance, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
