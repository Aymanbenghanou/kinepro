import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertSuperAdmin } from '@/lib/super-admin-guard'

type Context = { params: Promise<{ cabinetId: string; testimonialId: string }> }

export async function DELETE(_req: NextRequest, { params }: Context) {
  const __sa = await assertSuperAdmin(); if (__sa) return __sa
  const { testimonialId } = await params
  try {
    await prisma.testimonial.delete({ where: { id: testimonialId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
