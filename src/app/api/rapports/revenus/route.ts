import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const factures = await prisma.facture.findMany({
      where: {
        statut: 'paye',
        dateEmise: {
          gte: new Date(now.getFullYear(), now.getMonth() - 11, 1),
        },
      },
      select: { montant: true, dateEmise: true },
    })

    const seances = await prisma.seance.findMany({
      where: {
        date: {
          gte: new Date(now.getFullYear(), now.getMonth() - 11, 1),
        },
      },
      select: { date: true, statut: true },
    })

    // Grouper par mois
    const moisMap: Record<string, { revenus: number; seances: number; noShow: number }> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      moisMap[key] = { revenus: 0, seances: 0, noShow: 0 }
    }

    factures.forEach(f => {
      const d = new Date(f.dateEmise)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (moisMap[key]) moisMap[key].revenus += f.montant
    })

    seances.forEach(s => {
      const d = new Date(s.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (moisMap[key]) {
        moisMap[key].seances += 1
        if (s.statut === 'no_show') moisMap[key].noShow += 1
      }
    })

    const data = Object.entries(moisMap).map(([key, val]) => {
      const [year, month] = key.split('-')
      const d = new Date(parseInt(year), parseInt(month) - 1, 1)
      return {
        mois: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        ...val,
        tauxNoShow: val.seances > 0 ? Math.round((val.noShow / val.seances) * 100) : 0,
      }
    })

    const totalPatients = await prisma.patient.count({ where: { actif: true } })
    const nouveauxPatients = await prisma.patient.count({
      where: {
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    })

    return NextResponse.json({ data, totalPatients, nouveauxPatients })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
