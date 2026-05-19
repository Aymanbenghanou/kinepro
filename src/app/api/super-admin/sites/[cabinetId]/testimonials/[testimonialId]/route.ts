import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

type Context = { params: Promise<{ cabinetId: string; testimonialId: string }> }

export async function DELETE(_req: NextRequest, { params }: Context) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { testimonialId } = await params
  try {
    await prisma.testimonial.delete({ where: { id: testimonialId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
