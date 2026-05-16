import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const now = new Date()
    const since12Months = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    const [factures, seances, totalPatients, nouveauxPatients] = await Promise.all([
      prisma.facture.findMany({
        where: {
          cabinetId,
          statut: 'paye',
          dateEmise: { gte: since12Months },
        },
        select: { montant: true, dateEmise: true },
      }),
      prisma.seance.findMany({
        where: {
          cabinetId,
          date: { gte: since12Months },
        },
        select: { date: true, statut: true },
      }),
      prisma.patient.count({ where: { cabinetId, actif: true } }),
      prisma.patient.count({
        where: {
          cabinetId,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
      }),
    ])

    // Grouper par mois
    const moisMap: Record<string, { revenus: number; seances: number; noShow: number }> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      moisMap[key] = { revenus: 0, seances: 0, noShow: 0 }
    }

    factures.forEach(f => {
      const d   = new Date(f.dateEmise)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (moisMap[key]) moisMap[key].revenus += f.montant
    })

    seances.forEach(s => {
      const d   = new Date(s.date)
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

    return NextResponse.json({ data, totalPatients, nouveauxPatients })
  } catch (error) {
    console.error('[GET /api/rapports/revenus]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
