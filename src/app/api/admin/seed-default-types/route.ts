/**
 * POST /api/admin/seed-default-types
 *
 * One-time migration endpoint: seeds the 10 default SeanceType records
 * for every cabinet that currently has 0 session types.
 *
 * Protected: requires SUPER_ADMIN role OR a secret header for automation.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { DEFAULT_SEANCE_TYPES } from '@/lib/default-seance-types'

export async function POST(request: NextRequest) {
  try {
    // Allow SUPER_ADMIN session OR a shared secret for one-time CLI calls
    const session = await auth()
    const secret  = request.headers.get('x-seed-secret')
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
    const hasSecret    = secret === (process.env.SEED_SECRET || 'kinepro-seed-2026')

    if (!isSuperAdmin && !hasSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Find all cabinets with 0 SeanceType records
    const allCabinets = await prisma.cabinet.findMany({ select: { id: true, nom: true } })

    const results: { cabinetId: string; nom: string; created: number }[] = []

    for (const cabinet of allCabinets) {
      const count = await prisma.seanceType.count({ where: { cabinetId: cabinet.id } })
      if (count === 0) {
        await prisma.seanceType.createMany({
          data: DEFAULT_SEANCE_TYPES.map(t => ({
            ...t,
            cabinetId: cabinet.id,
            isDefault: true,
            actif:     true,
          })),
        })
        results.push({ cabinetId: cabinet.id, nom: cabinet.nom, created: DEFAULT_SEANCE_TYPES.length })
      }
    }

    return NextResponse.json({
      success: true,
      seeded:  results.length,
      skipped: allCabinets.length - results.length,
      details: results,
    })
  } catch (error) {
    console.error('[POST /api/admin/seed-default-types]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
