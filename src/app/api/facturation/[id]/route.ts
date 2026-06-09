/**
 * GET /api/facturation/[id]    — single facture with payment history.
 * DELETE /api/facturation/[id] — supprime la facture si aucun paiement enregistré.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { computeStatut } from '@/lib/facture-statut'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { getOwnedOr404 } from '@/lib/tenant'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Démo du helper tenant `getOwnedOr404` (cf. src/lib/tenant.ts).
  // Équivaut au pattern manuel auth() + findFirst({id, cabinetId}) + 404.
  const f = await getOwnedOr404(prisma.facture, id, {
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
    notFoundMessage: 'Facture introuvable',
  })
  if (f instanceof NextResponse) return f

  const statut = computeStatut(f.montant, f.montantPaye, f.dateEmise)
  const reste  = Math.max(0, f.montant - f.montantPaye)
  return NextResponse.json({ ...f, statut, reste })
}

/**
 * DELETE /api/facturation/[id]
 * BLOQUÉ si la facture a au moins un Paiement enregistré (409). Sinon delete
 * direct (la FK Paiement → Facture est en Cascade côté schéma, mais le check
 * préalable garantit qu'il n'y a rien à cascader — sécurité produit).
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('factures'); if (__perm instanceof NextResponse) return __perm;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    const existing = await prisma.facture.findFirst({ where: { id, cabinetId }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

    const paiements = await prisma.paiement.count({ where: { factureId: id } })
    if (paiements > 0) {
      return NextResponse.json(
        { error: 'facture_has_payments', count: paiements },
        { status: 409 }
      )
    }

    await prisma.facture.delete({ where: { id } })
    return NextResponse.json({ deleted: true, factureId: id })
  } catch (error) {
    console.error('[DELETE /api/facturation/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
