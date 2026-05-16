import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const praticien = await prisma.praticien.update({
      where: { id },
      data: {
        nom: body.nom,
        prenom: body.prenom,
        specialite: body.specialite,
        telephone: body.telephone,
        email: body.email,
        couleur: body.couleur,
        actif: body.actif,
      },
    })
    return NextResponse.json(praticien)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
