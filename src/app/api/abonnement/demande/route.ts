import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { assertOwner } from '@/lib/permissions-server'
import { prisma } from '@/lib/prisma'
import { getMontant } from '@/lib/abonnement'
import { validateBody } from '@/lib/validate'
import { demandeAbonnementSchema } from '@/lib/schemas/billing'

// POST /api/abonnement/demande — crée (ou met à jour) une demande "en_attente"
// pour le cabinet. Le montant est calculé côté serveur (jamais reçu du client).
export async function POST(request: NextRequest) {
  const __own = await assertOwner(); if (__own) return __own;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const v = await validateBody(request, demandeAbonnementSchema)
    if ('error' in v) return v.error
    const { plan, billingCycle } = v.data

    // Montant calculé serveur — on ne fait jamais confiance au client.
    const montant = getMontant(plan, billingCycle)

    // Évite les doublons : réutilise une demande "en_attente" existante.
    const existing = await prisma.demandeAbonnement.findFirst({
      where: { cabinetId, statut: 'en_attente' },
      select: { id: true },
    })

    const select = { plan: true, billingCycle: true, montant: true } as const
    const saved = existing
      ? await prisma.demandeAbonnement.update({ where: { id: existing.id }, data: { plan, billingCycle, montant }, select })
      : await prisma.demandeAbonnement.create({ data: { cabinetId, plan, billingCycle, montant, statut: 'en_attente' }, select })

    // Renvoie la demande à jour pour permettre une mise à jour d'UI en place (sans reload).
    return NextResponse.json({ ok: true, demande: saved })
  } catch (error) {
    console.error('[POST /api/abonnement/demande]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
