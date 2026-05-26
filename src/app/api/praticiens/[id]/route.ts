import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { assertNotWalled } from '@/lib/plan-server'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

// PATCH — update praticien fields (including actif toggle)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    const existing = await prisma.praticien.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'Praticien non trouvé' }, { status: 404 })

    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.nom        !== undefined) data.nom        = body.nom.trim()
    if (body.prenom     !== undefined) data.prenom     = body.prenom.trim()
    if (body.specialite !== undefined) data.specialite = body.specialite || null
    if (body.telephone  !== undefined) data.telephone  = body.telephone  || null
    if (body.email      !== undefined) data.email      = body.email      || null
    if (body.couleur    !== undefined) data.couleur    = body.couleur
    if (body.actif      !== undefined) data.actif      = Boolean(body.actif)

    const praticien = await prisma.praticien.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true, lastLoginAt: true } },
      },
    })
    return NextResponse.json(praticien)
  } catch (error) {
    console.error('[PATCH /api/praticiens/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

// PUT — backward-compatible alias for PATCH
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  return PATCH(request, { params })
}

// DELETE — soft delete (set actif: false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    const existing = await prisma.praticien.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'Praticien non trouvé' }, { status: 404 })

    await prisma.praticien.update({ where: { id }, data: { actif: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/praticiens/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
