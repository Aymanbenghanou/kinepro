/**
 * GET /api/facturation/[id] — single facture with payment history.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { computeStatut } from '@/lib/facture-statut'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params

  const f = await prisma.facture.findFirst({
    where: { id, cabinetId: session.user.cabinetId },
    include: {
      patient:   { select: { id: true, nom: true, prenom: true, telephone: true, email: true, publicToken: true } },
      seance:    {
        select: {
          id: true, typeSeance: true, date: true, duree: true,
          praticien:  { select: { nom: true, prenom: true, couleur: true } },
          seanceType: { select: { nom: true, couleur: true } },
        },
      },
      paiements: { orderBy: { datePaiement: 'desc' } },
    },
  })

  if (!f) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  const statut = computeStatut(f.montant, f.montantPaye, f.dateEmise)
  const reste  = Math.max(0, f.montant - f.montantPaye)
  return NextResponse.json({ ...f, statut, reste })
}
