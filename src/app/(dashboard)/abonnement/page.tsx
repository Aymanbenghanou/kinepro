import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/layout/Topbar'
import AbonnementView from '@/components/abonnement/AbonnementView'

export const dynamic = 'force-dynamic'

// Page "Mon abonnement" desktop — délègue le rendu au composant partagé
// `AbonnementView` (lecture seule, aucun prix, aucun bouton paiement).
export default async function AbonnementPage() {
  const session = await auth()
  const cabinet = session?.user?.cabinetId
    ? await prisma.cabinet.findUnique({
        where: { id: session.user.cabinetId },
        select: {
          plan: true, planStatus: true, planEndsAt: true, trialEndsAt: true,
          suspensionReason: true, createdAt: true,
        },
      })
    : null

  return (
    <div>
      <Topbar title="Mon abonnement" subtitle="Statut et contact" />
      <AbonnementView cabinet={cabinet} />
    </div>
  )
}
