import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import AgendaClient from './AgendaClient'

/**
 * Server shell — pré-charge la liste initiale des RDV en SSR. Le drag-drop,
 * les sensors @dnd-kit, le popover, la création modal et tous les fetch
 * dropdown (patients/praticiens/seance-types) RESTENT côté client dans
 * AgendaClient.
 *
 * Shape strictement identique à GET /api/rendez-vous :
 *   - même where { cabinetId }
 *   - même scope PRATICIEN-only (un PRATICIEN ne voit que ses propres RDV)
 *   - mêmes selects/includes patient + praticien
 *   - même take=300 (borne par défaut héritée de la pagination P3)
 *   - même orderBy { date: 'asc' }
 *
 * fetchRdv() côté client reste utilisé pour les refresh post-mutation
 * (déplacement drag-drop, suppression, création).
 */
export default async function AgendaPage() {
  const session = await auth()
  if (!session?.user?.cabinetId) redirect('/login')
  const { cabinetId, role, praticienId } = session.user

  // PRATICIEN sans praticienId rattaché → liste vide (safe-guard identique
  // à /api/rendez-vous route).
  if (role === 'PRATICIEN' && !praticienId) {
    return <AgendaClient initialRdvList={[]} />
  }

  const initialRdvList = await prisma.rendezVous.findMany({
    where: {
      cabinetId,
      ...(role === 'PRATICIEN' ? { praticienId: praticienId! } : {}),
    },
    include: {
      patient:   { select: { id: true, nom: true, prenom: true, telephone: true } },
      praticien: { select: { id: true, nom: true, prenom: true, couleur: true } },
    },
    orderBy: { date: 'asc' },
    take: 300,
  })

  return <AgendaClient initialRdvList={initialRdvList} />
}
