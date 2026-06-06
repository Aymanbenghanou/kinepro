import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import SeancesClient from './SeancesClient'

/**
 * Server shell — récupère la liste initiale des séances en SSR via Prisma,
 * shape strictement identique à GET /api/seances (P2 perf).
 *
 * Tout le reste — filtres interactifs, modal Terminer, scoring clinique,
 * création, refresh post-mutation, modal Détail — reste dans
 * `SeancesClient` ('use client'). Les filtres déclenchent un re-fetch via
 * `/api/seances?...` exactement comme avant.
 *
 * Sécurité : le layout parent (`./layout.tsx`) applique déjà
 * `guardPermission('dossierMedical')` ; on se contente ici de garantir
 * la session pour récupérer le cabinetId.
 */
export default async function SeancesPage() {
  const session = await auth()
  if (!session?.user?.cabinetId) redirect('/login')
  const { cabinetId, role, praticienId } = session.user

  // PRATICIEN-scoped : tenu côté serveur, identique au routing /api/seances
  // (qui n'applique pas de scope par praticien — donc on garde la même
  // sémantique : toutes les séances du cabinet visibles aux dossierMedical).
  void role; void praticienId

  const initialSeances = await prisma.seance.findMany({
    where: { cabinetId },
    include: {
      patient:   { select: { id: true, nom: true, prenom: true } },
      praticien: { select: { id: true, nom: true, prenom: true, couleur: true } },
    },
    orderBy: { date: 'desc' },
    take: 200,
  })

  // Sérialisable côté Server → Client : on passe tel quel (les dates Prisma
  // sont des objets Date acceptés via le pont RSC).
  return <SeancesClient initialSeances={initialSeances} />
}
