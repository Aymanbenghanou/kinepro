import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET() {
  try {
    const cabinet = await prisma.cabinet.findFirst()
    return NextResponse.json(cabinet || {})
  } catch (error) {
    console.error('[GET /api/cabinet]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

// PATCH — partial update of cabinet settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const existing = await prisma.cabinet.findFirst()

    const data = {
      ...(body.nom              !== undefined && { nom: body.nom }),
      ...(body.adresse          !== undefined && { adresse: body.adresse }),
      ...(body.telephone        !== undefined && { telephone: body.telephone }),
      ...(body.email            !== undefined && { email: body.email }),
      ...(body.googleMapsLink   !== undefined && { googleMapsLink: body.googleMapsLink }),
      ...(body.whatsappNumber   !== undefined && { whatsappNumber: body.whatsappNumber }),
      ...(body.googleReviewLink !== undefined && { googleReviewLink: body.googleReviewLink }),
    }

    const cabinet = existing
      ? await prisma.cabinet.update({ where: { id: existing.id }, data })
      : await prisma.cabinet.create({
          data: {
            nom: body.nom || 'Mon Cabinet',
            ...data,
          },
        })

    return NextResponse.json(cabinet)
  } catch (error) {
    console.error('[PATCH /api/cabinet]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

// PUT — kept for backward compatibility
export async function PUT(request: NextRequest) {
  return PATCH(request)
}
