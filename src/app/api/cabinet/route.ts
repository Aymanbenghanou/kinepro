import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { assertOwner } from '@/lib/permissions-server'
import { validateBody } from '@/lib/validate'
import { updateCabinetSchema } from '@/lib/schemas/cabinet'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId } })
    return NextResponse.json(cabinet || {})
  } catch (error) {
    console.error('[GET /api/cabinet]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

// PATCH — partial update of cabinet settings
export async function PATCH(request: NextRequest) {
  const __own = await assertOwner(); if (__own) return __own;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const v = await validateBody(request, updateCabinetSchema)
    if ('error' in v) return v.error
    const body = v.data

    const data = {
      ...(body.nom              !== undefined && { nom: body.nom }),
      ...(body.ville            !== undefined && { ville: body.ville }),
      ...(body.adresse          !== undefined && { adresse: body.adresse }),
      ...(body.telephone        !== undefined && { telephone: body.telephone }),
      ...(body.email            !== undefined && { email: body.email }),
      ...(body.googleMapsLink   !== undefined && { googleMapsLink: body.googleMapsLink }),
      ...(body.whatsappNumber   !== undefined && { whatsappNumber: body.whatsappNumber }),
      ...(body.googleReviewLink !== undefined && { googleReviewLink: body.googleReviewLink }),
      // Booking settings
      ...(body.slug             !== undefined && { slug: body.slug || null }),
      ...(body.bookingEnabled   !== undefined && { bookingEnabled: Boolean(body.bookingEnabled) }),
      ...(body.workStartTime    !== undefined && { workStartTime: body.workStartTime }),
      ...(body.workEndTime      !== undefined && { workEndTime: body.workEndTime }),
      ...(body.lunchStartTime   !== undefined && { lunchStartTime: body.lunchStartTime }),
      ...(body.lunchEndTime     !== undefined && { lunchEndTime: body.lunchEndTime }),
      ...(body.bookingMessage   !== undefined && { bookingMessage: body.bookingMessage || null }),
      ...(body.workingDays      !== undefined && { workingDays: body.workingDays }),
    }

    const cabinet = await prisma.cabinet.update({
      where: { id: cabinetId },
      data,
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
