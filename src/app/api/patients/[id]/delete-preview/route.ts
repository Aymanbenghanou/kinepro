import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { FactureStatut } from '@prisma/client'
import { requirePermission } from '@/lib/permissions-server'

/**
 * GET /api/patients/[id]/delete-preview
 * Lecture seule (pas de wall, juste auth + permission 'patients').
 * Retourne les counts par modèle enfant + flag canDelete (false si facture payée).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __perm = await requirePermission('patients')
  if (__perm instanceof NextResponse) return __perm

  const session = await auth()
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { cabinetId } = session.user
  const { id } = await params

  const exists = await prisma.patient.findFirst({ where: { id, cabinetId, deletedAt: null }, select: { id: true } })
  if (!exists) return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 })

  const [rdv, seances, facturesNonPayees, facturesPayees, documents, programmes, feedbacks, whatsappLogs] = await Promise.all([
    prisma.rendezVous.count({ where: { patientId: id, cabinetId } }),
    prisma.seance.count({ where: { patientId: id, cabinetId } }),
    prisma.facture.count({ where: { patientId: id, cabinetId, statut: { not: FactureStatut.paye } } }),
    prisma.facture.count({ where: { patientId: id, cabinetId, statut: FactureStatut.paye } }),
    prisma.document.count({ where: { patientId: id, cabinetId } }),
    prisma.exerciceProgram.count({ where: { patientId: id, cabinetId } }),
    prisma.feedback.count({ where: { patientId: id } }),
    prisma.whatsAppLog.count({ where: { patientId: id, cabinetId } }),
  ])

  const canDelete = facturesPayees === 0
  return NextResponse.json({
    canDelete,
    reason: canDelete ? null : 'patient_has_paid_factures',
    counts: { rdv, seances, facturesNonPayees, facturesPayees, documents, programmes, feedbacks, whatsappLogs },
  })
}
