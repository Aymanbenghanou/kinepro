import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

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
    const statut      = searchParams.get('statut')

    const seances = await prisma.seance.findMany({
      where: {
        cabinetId,
        ...(patientId   ? { patientId }   : {}),
        ...(praticienId ? { praticienId } : {}),
        ...(statut      ? { statut }      : {}),
      },
      include: {
        patient:   { select: { id: true, nom: true, prenom: true } },
        praticien: { select: { id: true, nom: true, prenom: true, couleur: true } },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(seances)
  } catch (error) {
    console.error('[GET /api/seances]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const body = await request.json()
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
