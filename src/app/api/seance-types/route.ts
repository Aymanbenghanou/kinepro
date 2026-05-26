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
    const all         = searchParams.get('all') === 'true'   // include inactive
    const praticienId = searchParams.get('praticienId')      // scope to kiné

    const types = await prisma.seanceType.findMany({
      where: {
        cabinetId,
        ...(all ? {} : { actif: true }),
        ...(praticienId ? {
          OR: [
            { praticienId: null },      // global types
            { praticienId },            // this kiné's personal types
          ],
        } : {}),
      },
      include: { praticien: { select: { id: true, nom: true, prenom: true } } },
      orderBy: [{ praticienId: 'asc' }, { nom: 'asc' }],
    })
    return NextResponse.json(types)
  } catch (error) {
    console.error('[GET /api/seance-types]', error)
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
    if (!body.nom?.trim()) {
      return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 })
    }
    const type = await prisma.seanceType.create({
      data: {
        cabinetId,
        nom:         body.nom.trim(),
        description: body.description  || null,
        dureeDefaut: body.dureeDefaut  ? parseInt(body.dureeDefaut)   : 45,
        tarifDefaut: body.tarifDefaut  ? parseFloat(body.tarifDefaut) : 300,
        couleur:     body.couleur      || '#2563EB',
        actif:       body.actif        !== undefined ? Boolean(body.actif) : true,
        praticienId: body.praticienId  || null,
      },
      include: { praticien: { select: { id: true, nom: true, prenom: true } } },
    })
    return NextResponse.json(type, { status: 201 })
  } catch (error) {
    console.error('[POST /api/seance-types]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
