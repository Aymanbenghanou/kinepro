import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    const existing = await prisma.seanceType.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'Type de séance non trouvé' }, { status: 404 })

    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.nom         !== undefined) data.nom         = body.nom.trim()
    if (body.description !== undefined) data.description = body.description || null
    if (body.dureeDefaut !== undefined) data.dureeDefaut = parseInt(body.dureeDefaut)
    if (body.tarifDefaut !== undefined) data.tarifDefaut = parseFloat(body.tarifDefaut)
    if (body.couleur     !== undefined) data.couleur     = body.couleur
    if (body.actif       !== undefined) data.actif       = Boolean(body.actif)
    if (body.praticienId !== undefined) data.praticienId = body.praticienId || null

    const type = await prisma.seanceType.update({
      where: { id },
      data,
      include: { praticien: { select: { id: true, nom: true, prenom: true } } },
    })
    return NextResponse.json(type)
  } catch (error) {
    console.error('[PATCH /api/seance-types/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    const existing = await prisma.seanceType.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'Type de séance non trouvé' }, { status: 404 })

    await prisma.seanceType.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/seance-types/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
