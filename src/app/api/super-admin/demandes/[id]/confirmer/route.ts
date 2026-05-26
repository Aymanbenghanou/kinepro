import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/super-admin/demandes/[id]/confirmer
// Confirme une demande d'abonnement → active le plan du cabinet. Super Admin only.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

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
