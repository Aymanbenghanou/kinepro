import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

type Context = { params: Promise<{ cabinetId: string }> }

export async function POST(_req: NextRequest, { params }: Context) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
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
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
