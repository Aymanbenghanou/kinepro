import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import MobileTopbar from '@/components/mobile/MobileTopbar'
import AbonnementView from '@/components/abonnement/AbonnementView'

// Pendant mobile de /abonnement — même infos en lecture seule, layout /m/*.
// Utilise le composant partagé AbonnementView (variante compact).
export default async function MobileAbonnementPage() {
  const session = await auth()
  if (!session?.user?.cabinetId) redirect('/login')

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: session.user.cabinetId },
    select: {
      plan: true, planStatus: true, planEndsAt: true, trialEndsAt: true,
      suspensionReason: true, createdAt: true,
    },
  })

  return (
    <div>
      <MobileTopbar title="Mon abonnement" subtitle="Statut et contact" />
      <AbonnementView cabinet={cabinet} compact />
    </div>
  )
}
