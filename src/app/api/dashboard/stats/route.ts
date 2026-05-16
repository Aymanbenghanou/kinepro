import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const [
      rdvAujourdHui,
      patientsActifs,
      revenusMonth,
      facturesImpayees,
      rdvDuJour,
      patientsRecents,
      seancesSemaine,
      facturesRecentes,
      praticiens,
    ] = await Promise.all([
      prisma.rendezVous.count({
        where: { date: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.patient.count({ where: { actif: true } }),
      prisma.facture.aggregate({
        where: {
          statut: 'paye',
          dateEmise: { gte: monthStart, lte: monthEnd },
        },
        _sum: { montant: true },
      }),
      prisma.facture.count({
        where: { statut: { in: ['en_attente', 'en_retard'] } },
      }),
      prisma.rendezVous.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        include: {
          patient: { select: { nom: true, prenom: true } },
          praticien: { select: { nom: true, prenom: true, couleur: true } },
        },
        orderBy: { date: 'asc' },
        take: 10,
      }),
      prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          seances: { select: { id: true }, where: { statut: 'realisee' } },
          rendezVous: { orderBy: { date: 'desc' }, take: 1 },
        },
      }),
      // Séances par jour cette semaine (lundi à dimanche)
      prisma.seance.findMany({
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1),
            lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7, 23, 59, 59),
          },
          statut: 'realisee',
        },
        select: { date: true },
      }),
      prisma.facture.findMany({
        take: 5,
        orderBy: { dateEmise: 'desc' },
        include: {
          patient: { select: { nom: true, prenom: true } },
        },
      }),
      prisma.praticien.findMany({
        where: { actif: true },
        include: {
          rendezVous: {
            where: { date: { gte: todayStart, lte: todayEnd } },
            select: { id: true },
          },
        },
      }),
    ])

    // Calcul séances par jour de la semaine
    const joursMap: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0, Sam: 0, Dim: 0 }
    const joursLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const joursDisplay = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    seancesSemaine.forEach(s => {
      const d = new Date(s.date)
      const label = joursLabels[d.getDay()]
      joursMap[label] = (joursMap[label] || 0) + 1
    })
    const seancesParJour = joursDisplay.map(j => ({ jour: j, count: joursMap[j] || 0 }))

    return NextResponse.json({
      stats: {
        rdvAujourdHui,
        patientsActifs,
        revenusMonth: revenusMonth._sum.montant || 0,
        facturesImpayees,
      },
      rdvDuJour,
      patientsRecents,
      seancesParJour,
      facturesRecentes,
      praticiens: praticiens.map(p => ({
        ...p,
        rdvAujourdHui: p.rendezVous.length,
      })),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
