import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cabinet = await prisma.cabinet.findFirst()
    return NextResponse.json(cabinet || {})
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const existing = await prisma.cabinet.findFirst()
    const cabinet = existing
      ? await prisma.cabinet.update({
          where: { id: existing.id },
          data: {
            nom:           body.nom           || undefined,
            adresse:       body.adresse       || undefined,
            telephone:     body.telephone     || undefined,
            email:         body.email         || undefined,
            googleMapsLink: body.googleMapsLink !== undefined ? body.googleMapsLink : undefined,
          },
        })
      : await prisma.cabinet.create({ data: body })
    return NextResponse.json(cabinet)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
