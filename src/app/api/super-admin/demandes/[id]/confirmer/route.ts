import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertSuperAdmin } from '@/lib/super-admin-guard'

// POST /api/super-admin/demandes/[id]/confirmer
// Confirme une demande d'abonnement → active le plan du cabinet. Super Admin only.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const __sa = await assertSuperAdmin(); if (__sa) return __sa

  try {
    const { id } = await params
    const demande = await prisma.demandeAbonnement.findUnique({ where: { id } })
    if (!demande) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
    if (demande.statut !== 'en_attente') {
      // Déjà traitée → évite une double-confirmation.
      return NextResponse.json({ error: 'Demande déjà traitée' }, { status: 409 })
    }

    // Une seule transaction : marque la demande confirmée + active le plan du cabinet.
    // On ne touche PAS trialEndsAt : planStatus "active" suffit (getPlanState → "active").
    await prisma.$transaction([
      prisma.demandeAbonnement.update({
        where: { id },
        data: { statut: 'confirmee', confirmedAt: new Date() },
      }),
      prisma.cabinet.update({
        where: { id: demande.cabinetId },
        data: {
          plan: demande.plan,
          billingCycle: demande.billingCycle,
          planStatus: 'active',
        },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/super-admin/demandes/[id]/confirmer]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
