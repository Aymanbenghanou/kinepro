import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import AbonnementClient from './AbonnementClient'

// Server component : charge la demande "en_attente" la plus récente du cabinet
// courant (montant déjà calculé serveur à l'étape 2), puis délègue l'UI au client.
export default async function AbonnementPage() {
  const session = await auth()

  let demande: { plan: string; billingCycle: string; montant: number } | null = null
  if (session?.user?.cabinetId) {
    demande = await prisma.demandeAbonnement.findFirst({
      where: { cabinetId: session.user.cabinetId, statut: 'en_attente' },
      orderBy: { createdAt: 'desc' },
      select: { plan: true, billingCycle: true, montant: true },
    })
  }

  return <AbonnementClient demande={demande} />
}
