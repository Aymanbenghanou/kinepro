import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const praticiens = await prisma.praticien.findMany({
      where: { actif: true },
      orderBy: { nom: 'asc' },
    })
    return NextResponse.json(praticiens)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const praticien = await prisma.praticien.create({
      data: {
        nom: body.nom,
        prenom: body.prenom,
        specialite: body.specialite || null,
        telephone: body.telephone || null,
        email: body.email || null,
        couleur: body.couleur || '#2563EB',
      },
    })
    return NextResponse.json(praticien, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
