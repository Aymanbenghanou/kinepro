/**
 * GET  /api/facturation/[id]/paiements — list payments for a facture
 * POST /api/facturation/[id]/paiements — record a new payment, atomically
 *      update facture.montantPaye + recompute statut, set datePaiement
 *      when fully paid.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { computeStatut, MODE_PAIEMENT } from '@/lib/facture-statut'

type Context = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Context) {
  const session = await auth()
  if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  const facture = await prisma.facture.findFirst({ where: { id, cabinetId: session.user.cabinetId }, select: { id: true } })
  if (!facture) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  const paiements = await prisma.paiement.findMany({ where: { factureId: id }, orderBy: { datePaiement: 'desc' } })
  return NextResponse.json(paiements)
}

export async function POST(req: NextRequest, { params }: Context) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const { cabinetId } = session.user
    const { id } = await params

    const body = await req.json()
    const montant = Number(body.montant)
    if (!Number.isFinite(montant) || montant <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }
    const mode = String(body.modePaiement || '').toLowerCase()
    if (!(mode in MODE_PAIEMENT)) {
      return NextResponse.json({ error: 'Mode de paiement invalide' }, { status: 400 })
    }

    const facture = await prisma.facture.findFirst({ where: { id, cabinetId } })
    if (!facture) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

    const reste = Math.max(0, facture.montant - facture.montantPaye)
    if (montant > reste + 0.01) {
      return NextResponse.json({ error: `Montant supérieur au reste dû (${reste} MAD)` }, { status: 400 })
    }

    const datePaiement = body.datePaiement ? new Date(body.datePaiement) : new Date()

    const [, updated] = await prisma.$transaction([
      prisma.paiement.create({
        data: {
          factureId:    id,
          cabinetId,
          montant,
          modePaiement: mode,
          datePaiement,
          notes:        body.notes ? String(body.notes).trim() : null,
        },
      }),
      prisma.facture.update({
        where: { id },
        data: {
          montantPaye: { increment: montant },
        },
      }),
    ])

    const newStatut = computeStatut(updated.montant, updated.montantPaye, updated.dateEmise)
    const final = await prisma.facture.update({
      where: { id },
      data: {
        statut: newStatut,
        datePaiement: newStatut === 'paye' ? new Date() : null,
      },
      include: { paiements: { orderBy: { datePaiement: 'desc' } } },
    })

    return NextResponse.json({
      ...final,
      reste: Math.max(0, final.montant - final.montantPaye),
    }, { status: 201 })
  } catch (e) {
    console.error('[POST paiements]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
