/**
 * POST /api/exercise-programs — persist a generated/edited program
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertPro } from '@/lib/plan-server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Verrou Pro : enregistrer un programme d'exercices = fonctionnalité Pro.
  const __perm = await requirePermission('programmesEtDocs'); if (__perm instanceof NextResponse) return __perm;

  const proGate = await assertPro(); if (proGate) return proGate

  try {
    const body = await req.json()
    if (!body.patientId || !body.contenu) {
      return NextResponse.json({ error: 'patientId et contenu requis' }, { status: 400 })
    }

    const created = await prisma.exerciceProgram.create({
      data: {
        cabinetId: session.user.cabinetId,
        patientId: String(body.patientId),
        seanceId:  body.seanceId ?? null,
        titre:     String(body.titre || body.contenu?.titre || 'Programme d\'exercices'),
        contenu:   body.contenu,
        langue:    body.langue === 'ar' ? 'ar' : 'fr',
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    console.error('[POST /api/exercise-programs]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
