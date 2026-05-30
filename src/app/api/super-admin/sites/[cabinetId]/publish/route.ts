import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertSuperAdmin } from '@/lib/super-admin-guard'

type Context = { params: Promise<{ cabinetId: string }> }

export async function POST(_req: NextRequest, { params }: Context) {
  const __sa = await assertSuperAdmin(); if (__sa) return __sa
  const { cabinetId } = await params
  try {
    const existing = await prisma.cabinetSite.findUnique({ where: { cabinetId } })
    const published = !existing?.published
    const site = await prisma.cabinetSite.upsert({
      where: { cabinetId },
      create: { cabinetId, published },
      update: { published },
    })
    return NextResponse.json({ published: site.published })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
