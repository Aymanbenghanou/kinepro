import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import PatientsClient from './PatientsClient'

/**
 * Server shell — récupère la liste initiale (sans search) en SSR. Shape
 * strictement identique à GET /api/patients (mêmes include _count.seances
 * + rendezVous take:1, même take=100 par défaut hérité de P3).
 *
 * La recherche dynamique reste côté client : un changement de `search`
 * déclenche un GET /api/patients?search=... exactement comme avant.
 */
export default async function PatientsPage() {
  const session = await auth()
  if (!session?.user?.cabinetId) redirect('/login')
  const { cabinetId } = session.user

  const initialPatients = await prisma.patient.findMany({
    where: { cabinetId, deletedAt: null },
    include: {
      _count:     { select: { seances: true } },
      rendezVous: { orderBy: { date: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return <PatientsClient initialPatients={initialPatients} />
}
