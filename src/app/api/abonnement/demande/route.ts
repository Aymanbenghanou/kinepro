import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getMontant, type Plan, type BillingCycle } from '@/lib/abonnement'

const PLANS: Plan[] = ['starter', 'pro']
const CYCLES: BillingCycle[] = ['monthly', 'annual']

// POST /api/abonnement/demande — crée (ou met à jour) une demande "en_attente"
// pour le cabinet. Le montant est calculé côté serveur (jamais reçu du client).
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const body = await request.json().catch(() => ({}))
    const plan = body?.plan
    const billingCycle = body?.billingCycle

    if (!PLANS.includes(plan) || !CYCLES.includes(billingCycle)) {
      return NextResponse.json({ error: 'Plan ou cycle invalide' }, { status: 400 })
    }

    // Montant calculé serveur — on ne fait jamais confiance au client.
    const montant = getMontant(plan, billingCycle)

    // Évite les doublons : réutilise une demande "en_attente" existante.
    const existing = await prisma.demandeAbonnement.findFirst({
      where: { cabinetId, statut: 'en_attente' },
      select: { id: true },
    })

    if (existing) {
      await prisma.demandeAbonnement.update({
        where: { id: existing.id },
        data: { plan, billingCycle, montant },
      })
    } else {
      await prisma.demandeAbonnement.create({
        data: { cabinetId, plan, billingCycle, montant, statut: 'en_attente' },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/abonnement/demande]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
