import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rdv = await prisma.rendezVous.findUnique({
      where: { id },
      include: {
        patient: true,
        praticien: true,
      },
    })
    if (!rdv) return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 })
    return NextResponse.json(rdv)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const rdv = await prisma.rendezVous.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        duree: body.duree,
        typeSeance: body.typeSeance,
        salle: body.salle,
        notes: body.notes,
        statut: body.statut,
        patientId: body.patientId,
        praticienId: body.praticienId,
      },
    })
    return NextResponse.json(rdv)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.rendezVous.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
