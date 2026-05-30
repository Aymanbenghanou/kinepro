/**
 * GET /api/super-admin/sites/[cabinetId]  — get site config (create if missing)
 * PATCH /api/super-admin/sites/[cabinetId] — update site config
 * Super admin only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertSuperAdmin } from '@/lib/super-admin-guard'

type Context = { params: Promise<{ cabinetId: string }> }

export async function GET(_req: NextRequest, { params }: Context) {
  const __sa = await assertSuperAdmin(); if (__sa) return __sa
  const { cabinetId } = await params

  try {
    // Upsert: ensure a CabinetSite row exists
    let site = await prisma.cabinetSite.findUnique({
      where: { cabinetId },
      include: { testimonials: { orderBy: { createdAt: 'desc' } } },
    })

    if (!site) {
      site = await prisma.cabinetSite.create({
        data: { cabinetId },
        include: { testimonials: true },
      })
    }

    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { id: true, nom: true, ville: true, slug: true },
    })

    return NextResponse.json({ ...site, cabinet })
  } catch (err) {
    console.error('[GET /api/super-admin/sites/[cabinetId]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const __sa = await assertSuperAdmin(); if (__sa) return __sa
  const { cabinetId } = await params

  try {
    const body = await req.json()
    const allowed = ['templateId','primaryColor','secondaryColor','contentFr','contentAr','heroImageUrl','googleMapsEmbed','published'] as const
    const data: Record<string, any> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    const site = await prisma.cabinetSite.upsert({
      where: { cabinetId },
      create: { cabinetId, ...data },
      update: data,
      include: { testimonials: { orderBy: { createdAt: 'desc' } } },
    })
    return NextResponse.json(site)
  } catch (err) {
    console.error('[PATCH /api/super-admin/sites/[cabinetId]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST to this route = add testimonial
export async function POST(req: NextRequest, { params }: Context) {
  const __sa = await assertSuperAdmin(); if (__sa) return __sa
  const { cabinetId } = await params

  try {
    const body = await req.json()
    if (!body.patientName) {
      return NextResponse.json({ error: 'patientName requis' }, { status: 400 })
    }

    // Ensure site exists
    const site = await prisma.cabinetSite.upsert({
      where: { cabinetId },
      create: { cabinetId },
      update: {},
    })

    const testimonial = await prisma.testimonial.create({
      data: {
        cabinetSiteId: site.id,
        patientName: body.patientName,
        textFr: body.textFr ?? body.text ?? '',
        textAr: body.textAr ?? '',
        rating: body.rating ?? 5,
      },
    })
    return NextResponse.json(testimonial, { status: 201 })
  } catch (err) {
    console.error('[POST testimonial]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
