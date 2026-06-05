import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'

/** GET /api/facturation/[id]/delete-preview — lecture seule. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __perm = await requirePermission('factures')
  if (__perm instanceof NextResponse) return __perm

  const session = await auth()
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { cabinetId } = session.user
  const { id } = await params

  const facture = await prisma.facture.findFirst({
    where:  { id, cabinetId },
    select: { id: true, montant: true, montantPaye: true },
  })
  if (!facture) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

  const paiementsCount = await prisma.paiement.count({ where: { factureId: id } })
  const canDelete = paiementsCount === 0
  return NextResponse.json({
    canDelete,
    reason: canDelete ? null : 'facture_has_payments',
    paiementsCount,
    montantTotal: facture.montant,
    montantPaye:  facture.montantPaye,
  })
}
