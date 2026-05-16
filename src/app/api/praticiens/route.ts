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
    // Pass ?actif=true to get only active praticiens (e.g. for dropdowns/agendas)
    const actifOnly = searchParams.get('actif') === 'true'

    const praticiens = await prisma.praticien.findMany({
      where: {
        cabinetId,
        ...(actifOnly ? { actif: true } : {}),
      },
      include: {
        user: {
          select: { id: true, email: true, isActive: true, role: true, lastLoginAt: true },
        },
      },
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
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const body = await request.json()
    if (!body.nom?.trim() || !body.prenom?.trim()) {
      return NextResponse.json({ error: 'Nom et prénom sont obligatoires' }, { status: 400 })
    }
    const praticien = await prisma.praticien.create({
      data: {
        cabinetId,
        nom:        body.nom.trim(),
        prenom:     body.prenom.trim(),
        specialite: body.specialite || null,
        telephone:  body.telephone  || null,
        email:      body.email      || null,
        couleur:    body.couleur    || '#2563EB',
      },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true } },
      },
    })
    return NextResponse.json(praticien, { status: 201 })
  } catch (error) {
    console.error('[POST /api/praticiens]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
