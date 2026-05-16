import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const logs = await prisma.whatsAppLog.findMany({
      where: patientId ? { patientId } : {},
      include: {
        patient: { select: { id: true, nom: true, prenom: true, telephone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json(logs)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const log = await prisma.whatsAppLog.create({
      data: {
        type: body.type,
        patientId: body.patientId,
        patientNom: body.patientNom,
        telephone: body.telephone,
        message: body.message,
      },
    })
    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
