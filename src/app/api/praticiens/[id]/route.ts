import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function PUT(
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

    // Verify ownership
    const existing = await prisma.praticien.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'Praticien non trouvé' }, { status: 404 })

    const body = await request.json()
    const praticien = await prisma.praticien.update({
      where: { id },
      data: {
        nom:        body.nom,
        prenom:     body.prenom,
        specialite: body.specialite,
        telephone:  body.telephone,
        email:      body.email,
        couleur:    body.couleur,
        actif:      body.actif,
      },
    })
    return NextResponse.json(praticien)
  } catch (error) {
    console.error('[PUT /api/praticiens/[id]]', error)
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

    const existing = await prisma.praticien.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'Praticien non trouvé' }, { status: 404 })

    await prisma.praticien.update({ where: { id }, data: { actif: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/praticiens/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
