/**
 * GET /api/super-admin/sites
 * Lists all cabinets with their site configuration status.
 * Super admin only.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertSuperAdmin } from '@/lib/super-admin-guard'

export async function GET() {
  const __sa = await assertSuperAdmin(); if (__sa) return __sa

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
