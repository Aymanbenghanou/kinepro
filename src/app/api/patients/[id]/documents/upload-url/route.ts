import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled, assertPro } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { documentUploadUrlSchema } from '@/lib/schemas/medical'
import { buildStoragePath, createUploadTicket } from '@/lib/supabase'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

/**
 * POST /api/patients/[id]/documents/upload-url
 * Délivre un ticket d'upload signé pour Supabase Storage (bucket privé).
 * Le navigateur upload ensuite le fichier directement vers Supabase avec ce ticket.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('programmesEtDocs'); if (__perm instanceof NextResponse) return __perm;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const proGate = await assertPro(); if (proGate) return proGate
    const { cabinetId } = session.user
    const { id: patientId } = await params

    // Le patient doit appartenir au cabinet.
    const patient = await prisma.patient.findFirst({ where: { id: patientId, cabinetId } })
    if (!patient) return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 })

    const v = await validateBody(request, documentUploadUrlSchema)
    if ('error' in v) return v.error

    const path = buildStoragePath(cabinetId, patientId, v.data.filename)
    const ticket = await createUploadTicket(path)

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('[POST /api/patients/[id]/documents/upload-url]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
