import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const types = await prisma.seanceType.findMany({
      where: { actif: true },
      orderBy: { nom: 'asc' },
    })
    return NextResponse.json(types)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const type = await prisma.seanceType.create({
      data: {
        nom: body.nom,
        description: body.description || null,
        dureeDefaut: body.dureeDefaut || 45,
        tarifDefaut: body.tarifDefaut || 250,
        couleur: body.couleur || '#2563EB',
      },
    })
    return NextResponse.json(type, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
