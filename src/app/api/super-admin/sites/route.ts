/**
 * GET /api/super-admin/sites
 * Lists all cabinets with their site configuration status.
 * Super admin only.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const cabinets = await prisma.cabinet.findMany({
      select: {
        id: true, nom: true, ville: true, slug: true,
        site: {
          select: {
            id: true, templateId: true, published: true, updatedAt: true,
          },
        },
      },
      orderBy: { nom: 'asc' },
    })
    return NextResponse.json(cabinets)
  } catch (err) {
    console.error('[GET /api/super-admin/sites]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
