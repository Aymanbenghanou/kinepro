import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET() {
  try {
    const praticiens = await prisma.praticien.findMany({
      where: { actif: true },
      orderBy: { nom: 'asc' },
    })
    return NextResponse.json(praticiens)
  } catch (error) {
    console.error('[GET /api/praticiens]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.nom?.trim() || !body.prenom?.trim()) {
      return NextResponse.json({ error: 'Nom et prénom sont obligatoires' }, { status: 400 })
    }
    const praticien = await prisma.praticien.create({
      data: {
        nom: body.nom.trim(),
        prenom: body.prenom.trim(),
        specialite: body.specialite || null,
        telephone: body.telephone || null,
        email: body.email || null,
        couleur: body.couleur || '#2563EB',
      },
    })
    return NextResponse.json(praticien, { status: 201 })
  } catch (error) {
    console.error('[POST /api/praticiens]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
