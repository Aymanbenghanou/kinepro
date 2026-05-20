/**
 * GET /api/rapports/stats?from=YYYY-MM-DD&to=YYYY-MM-DD&praticienId=all|<id>
 *
 * Comprehensive analytics for the /rapports page. Returns KPIs (with trend %
 * vs previous period), revenue/RDV/patient/satisfaction breakdowns, heatmap
 * data, and per-praticien performance.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function errMsg(e: unknown): string { return e instanceof Error ? e.message : 'Erreur' }

function ym(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

function isoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const wk = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${t.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`
}

function deltaPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

/** Bucket values across `buckets` equal slices of [from..to]. */
function sparkline(values: { date: Date; v: number }[], from: Date, to: Date, buckets = 8): number[] {
  const span = Math.max(1, to.getTime() - from.getTime())
  const out = new Array(buckets).fill(0)
  for (const { date, v } of values) {
    const idx = Math.min(buckets - 1, Math.floor(((date.getTime() - from.getTime()) / span) * buckets))
    if (idx >= 0) out[idx] += v
  }
  return out
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const sp = req.nextUrl.searchParams
    const fromStr     = sp.get('from')
    const toStr       = sp.get('to')
    const praticienId = sp.get('praticienId') ?? 'all'
    if (!fromStr || !toStr) {
      return NextResponse.json({ error: 'Paramètres from/to requis' }, { status: 400 })
    }

    const from = new Date(fromStr + 'T00:00:00')
    const to   = new Date(toStr   + 'T23:59:59.999')
    const span = to.getTime() - from.getTime()
    const prevTo   = new Date(from.getTime() - 1)
    const prevFrom = new Date(prevTo.getTime() - span)

    const praticienFilter = praticienId !== 'all' ? { praticienId } : {}
    const factureSeanceFilter = praticienId !== 'all' ? { seance: { praticienId } } : {}

    // ── Fetch everything in parallel ────────────────────────────────────────
    const [
      rendezVousCur, rendezVousPrev,
      seancesCur,    seancesPrev,
      facturesCur,   facturesPrev,
      patientsCur,   patientsPrev,
      feedbacksCur,  feedbacksPrev,
      seanceTypes,   praticiens,
      // Patients seen in period (for fidelity calc)
      patientsAvecSeance,
    ] = await Promise.all([
      prisma.rendezVous.findMany({
        where: { cabinetId, date: { gte: from, lte: to }, ...praticienFilter },
        select: { id: true, date: true, statut: true, praticienId: true, seanceTypeId: true },
      }),
      prisma.rendezVous.count({ where: { cabinetId, date: { gte: prevFrom, lte: prevTo }, ...praticienFilter } }),

      prisma.seance.findMany({
        where: { cabinetId, date: { gte: from, lte: to }, ...praticienFilter },
        select: {
          id: true, date: true, statut: true, scorePatient: true,
          praticienId: true, patientId: true, seanceTypeId: true,
        },
      }),
      prisma.seance.count({ where: { cabinetId, date: { gte: prevFrom, lte: prevTo }, statut: 'realisee', ...praticienFilter } }),

      prisma.facture.findMany({
        where: { cabinetId, statut: 'paye', dateEmise: { gte: from, lte: to }, ...factureSeanceFilter },
        select: {
          id: true, montant: true, dateEmise: true,
          seance: { select: { id: true, praticienId: true, seanceType: { select: { id: true, nom: true, couleur: true } } } },
        },
      }),
      prisma.facture.aggregate({
        where: { cabinetId, statut: 'paye', dateEmise: { gte: prevFrom, lte: prevTo }, ...factureSeanceFilter },
        _sum: { montant: true },
      }),

      prisma.patient.findMany({
        where: { cabinetId, createdAt: { gte: from, lte: to } },
        select: { id: true, createdAt: true, pathologie: true },
      }),
      prisma.patient.count({ where: { cabinetId, createdAt: { gte: prevFrom, lte: prevTo } } }),

      prisma.feedback.findMany({
        where: { cabinetId, createdAt: { gte: from, lte: to } },
        select: { id: true, score: true, commentaire: true, createdAt: true, patient: { select: { nom: true, prenom: true } } },
      }),
      prisma.feedback.aggregate({
        where: { cabinetId, createdAt: { gte: prevFrom, lte: prevTo } },
        _avg: { score: true },
      }),

      prisma.seanceType.findMany({ where: { cabinetId, actif: true }, select: { id: true, nom: true, couleur: true } }),
      prisma.praticien.findMany({ where: { cabinetId, actif: true }, select: { id: true, nom: true, prenom: true, couleur: true } }),

      prisma.seance.findMany({
        where: { cabinetId, date: { gte: from, lte: to }, ...praticienFilter },
        select: { patientId: true, date: true, praticienId: true },
        orderBy: { date: 'asc' },
      }),
    ])

    // Chart 1: revenus current period vs SAME period previous year ───────────
    const oneYearAgoFrom = new Date(from); oneYearAgoFrom.setFullYear(oneYearAgoFrom.getFullYear() - 1)
    const oneYearAgoTo   = new Date(to);   oneYearAgoTo.setFullYear(oneYearAgoTo.getFullYear() - 1)
    const facturesYearAgo = await prisma.facture.findMany({
      where: { cabinetId, statut: 'paye', dateEmise: { gte: oneYearAgoFrom, lte: oneYearAgoTo }, ...factureSeanceFilter },
      select: { montant: true, dateEmise: true },
    })

    // ── Compute month buckets covering the period ───────────────────────────
    const monthKeys: string[] = []
    {
      const cursor = new Date(from.getFullYear(), from.getMonth(), 1)
      const endK   = ym(to)
      while (true) {
        const k = ym(cursor)
        monthKeys.push(k)
        if (k === endK) break
        cursor.setMonth(cursor.getMonth() + 1)
        if (monthKeys.length > 60) break
      }
    }

    const revByMonth: Record<string, number>    = Object.fromEntries(monthKeys.map(k => [k, 0]))
    const revByMonthPrev: Record<string, number> = Object.fromEntries(monthKeys.map(k => [k, 0]))
    facturesCur.forEach(f => { const k = ym(f.dateEmise); if (revByMonth[k] !== undefined) revByMonth[k] += f.montant })
    facturesYearAgo.forEach(f => {
      const d = new Date(f.dateEmise); d.setFullYear(d.getFullYear() + 1) // shift to align with current keys
      const k = ym(d); if (revByMonthPrev[k] !== undefined) revByMonthPrev[k] += f.montant
    })
    const revenusParMois = monthKeys.map(k => ({
      mois: monthLabel(k),
      current: Math.round(revByMonth[k]),
      previous: Math.round(revByMonthPrev[k]),
    }))

    // Chart 2 & 3: revenus par type de séance ───────────────────────────────
    const revByType: Record<string, { nom: string; couleur: string; montant: number }> = {}
    facturesCur.forEach(f => {
      const st = f.seance?.seanceType
      const key = st?.id ?? 'autre'
      const nom = st?.nom ?? 'Autre'
      const couleur = st?.couleur ?? '#64748B'
      if (!revByType[key]) revByType[key] = { nom, couleur, montant: 0 }
      revByType[key].montant += f.montant
    })
    const revByTypeArr = Object.values(revByType).map(r => ({ ...r, montant: Math.round(r.montant) })).sort((a, b) => b.montant - a.montant)
    const totalRev = revByTypeArr.reduce((s, r) => s + r.montant, 0)
    const repartitionRevenus = revByTypeArr.map(r => ({
      ...r,
      pct: totalRev > 0 ? Math.round((r.montant / totalRev) * 100) : 0,
    }))

    // Chart 4: RDV par mois (stacked statuts) ───────────────────────────────
    const STATUTS = ['realise', 'annule', 'no_show', 'attente'] as const
    type StatutKey = typeof STATUTS[number]
    const rdvByMonth: Record<string, Record<StatutKey, number>> = Object.fromEntries(
      monthKeys.map(k => [k, { realise: 0, annule: 0, no_show: 0, attente: 0 }])
    )
    rendezVousCur.forEach(r => {
      const k = ym(r.date)
      const s = r.statut.toLowerCase()
      let key: StatutKey =
        s === 'realise' || s === 'realisee' || s === 'confirme' ? 'realise' :
        s === 'annule' || s === 'annulee'                       ? 'annule'  :
        s === 'no_show' || s === 'noshow'                       ? 'no_show' :
                                                                  'attente'
      if (rdvByMonth[k]) rdvByMonth[k][key] += 1
    })
    const rdvParMois = monthKeys.map(k => ({ mois: monthLabel(k), ...rdvByMonth[k] }))

    // Chart 5: taux présence par jour de semaine ─────────────────────────────
    const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    const byDay: { realise: number; total: number }[] = DAYS.map(() => ({ realise: 0, total: 0 }))
    seancesCur.forEach(s => {
      const d = new Date(s.date).getDay() // 0=Sun..6=Sat
      const idx = d === 0 ? 6 : d - 1
      byDay[idx].total += 1
      if (s.statut === 'realisee') byDay[idx].realise += 1
    })
    const tauxParJour = DAYS.map((jour, i) => ({
      jour,
      taux: byDay[i].total > 0 ? Math.round((byDay[i].realise / byDay[i].total) * 100) : 0,
      total: byDay[i].total,
    }))

    // Chart 6: heatmap (day x hour) ─────────────────────────────────────────
    const heatmap: { day: number; hour: number; count: number }[] = []
    const heat: number[][] = Array.from({ length: 7 }, () => new Array(11).fill(0))
    rendezVousCur.forEach(r => {
      const d = new Date(r.date)
      const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
      const h = d.getHours()
      if (h >= 8 && h <= 18) heat[dow][h - 8] += 1
    })
    for (let dow = 0; dow < 6; dow++) {
      for (let hi = 0; hi < 11; hi++) heatmap.push({ day: dow, hour: hi + 8, count: heat[dow][hi] })
    }

    // Section 4: patients ────────────────────────────────────────────────────
    const nouveauxByMonth: Record<string, number> = Object.fromEntries(monthKeys.map(k => [k, 0]))
    patientsCur.forEach(p => { const k = ym(p.createdAt); if (nouveauxByMonth[k] !== undefined) nouveauxByMonth[k] += 1 })
    const nouveauxParMois = monthKeys.map(k => ({ mois: monthLabel(k), nouveaux: nouveauxByMonth[k] }))

    const pathologieMap: Record<string, number> = {}
    patientsAvecSeance.forEach(s => { /* placeholder if needed later */ void s })
    // Use patient.pathologie joined via seance.patient
    const patientIdsInPeriod = Array.from(new Set(seancesCur.map(s => s.patientId)))
    const patientsForPath = patientIdsInPeriod.length > 0
      ? await prisma.patient.findMany({ where: { id: { in: patientIdsInPeriod } }, select: { id: true, pathologie: true, nom: true, prenom: true } })
      : []
    patientsForPath.forEach(p => {
      const key = (p.pathologie || 'Non spécifiée').trim() || 'Non spécifiée'
      pathologieMap[key] = (pathologieMap[key] ?? 0) + 1
    })
    const pathologies = Object.entries(pathologieMap)
      .sort(([, a], [, b]) => b - a).slice(0, 10)
      .map(([nom, count]) => ({ nom, count }))

    // Fidélité: patient was "new" in period = createdAt within period
    // Récurrent = has seance in period AND createdAt before period
    const newPatientIds = new Set(patientsCur.map(p => p.id))
    const recurrents = patientIdsInPeriod.filter(id => !newPatientIds.has(id)).length
    const nouveauxAvecSeance = patientIdsInPeriod.filter(id => newPatientIds.has(id)).length
    const fidelite = { nouveaux: nouveauxAvecSeance, recurrents, total: patientIdsInPeriod.length }

    // Patient le plus fidèle
    const countByPatient: Record<string, number> = {}
    patientsAvecSeance.forEach(s => { countByPatient[s.patientId] = (countByPatient[s.patientId] ?? 0) + 1 })
    let plusFidele: { id: string; nom: string; count: number } | null = null
    {
      const entries = Object.entries(countByPatient).sort(([, a], [, b]) => b - a)
      if (entries.length) {
        const [pid, count] = entries[0]
        const p = patientsForPath.find(x => x.id === pid)
        plusFidele = { id: pid, nom: p ? `${p.prenom} ${p.nom}` : 'Patient', count }
      }
    }

    // Durée moyenne traitement + espacement entre séances
    const datesByPatient: Record<string, Date[]> = {}
    patientsAvecSeance.forEach(s => {
      if (!datesByPatient[s.patientId]) datesByPatient[s.patientId] = []
      datesByPatient[s.patientId].push(new Date(s.date))
    })
    const durations: number[] = []
    const gaps: number[]      = []
    Object.values(datesByPatient).forEach(dates => {
      if (dates.length < 2) return
      const sorted = dates.sort((a, b) => a.getTime() - b.getTime())
      durations.push((sorted[sorted.length - 1].getTime() - sorted[0].getTime()) / 86400000)
      for (let i = 1; i < sorted.length; i++) {
        gaps.push((sorted[i].getTime() - sorted[i - 1].getTime()) / 86400000)
      }
    })
    const dureeMoyenne   = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
    const espacementMoy  = gaps.length > 0      ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0

    // Section 5: satisfaction ───────────────────────────────────────────────
    const weeklyMap: Record<string, { sum: number; n: number }> = {}
    feedbacksCur.forEach(f => {
      const wk = isoWeek(f.createdAt)
      if (!weeklyMap[wk]) weeklyMap[wk] = { sum: 0, n: 0 }
      weeklyMap[wk].sum += f.score; weeklyMap[wk].n += 1
    })
    const evolutionSat = Object.entries(weeklyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([wk, v]) => ({ semaine: wk.slice(-3), score: Math.round((v.sum / v.n) * 10) / 10 }))

    const distribSat = Array.from({ length: 10 }, (_, i) => ({ score: i + 1, count: 0 }))
    feedbacksCur.forEach(f => {
      const s = Math.max(1, Math.min(10, f.score))
      distribSat[s - 1].count += 1
    })

    const moyenneSat   = feedbacksCur.length > 0 ? Math.round((feedbacksCur.reduce((s, f) => s + f.score, 0) / feedbacksCur.length) * 10) / 10 : 0
    const pctExcellent = feedbacksCur.length > 0 ? Math.round((feedbacksCur.filter(f => f.score >= 8).length / feedbacksCur.length) * 100) : 0
    const negatifs     = feedbacksCur
      .filter(f => f.score < 5)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map(f => ({
        patient: f.patient ? `${f.patient.prenom} ${f.patient.nom}` : 'Anonyme',
        date: f.createdAt, score: f.score,
        commentaire: f.commentaire || '',
      }))

    // Section 6: performance par praticien ──────────────────────────────────
    const praticienStats = praticiens.map(p => {
      const myRdv      = rendezVousCur.filter(r => r.praticienId === p.id)
      const mySeances  = seancesCur.filter(s => s.praticienId === p.id)
      const realises   = mySeances.filter(s => s.statut === 'realisee').length
      const taux       = myRdv.length > 0 ? Math.round((realises / myRdv.length) * 100) : 0
      const revenus    = facturesCur.filter(f => f.seance?.praticienId === p.id).reduce((s, f) => s + f.montant, 0)
      const scores     = mySeances.map(s => s.scorePatient).filter((x): x is number => typeof x === 'number')
      const scoreMoy   = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
      return {
        id: p.id, nom: `${p.prenom} ${p.nom}`, couleur: p.couleur,
        rdv: myRdv.length, seances: realises, taux,
        revenus: Math.round(revenus), score: scoreMoy,
      }
    })

    // ── KPIs with trends ────────────────────────────────────────────────────
    const totalRevenuCur  = facturesCur.reduce((s, f) => s + f.montant, 0)
    const totalRevenuPrev = facturesPrev._sum.montant ?? 0
    const totalRdvCur     = rendezVousCur.length
    const seancesRealCur  = seancesCur.filter(s => s.statut === 'realisee').length
    const tauxPresCur     = totalRdvCur > 0 ? Math.round((seancesRealCur / totalRdvCur) * 100) : 0
    const tauxPresPrev    = rendezVousPrev > 0 ? Math.round((seancesPrev / rendezVousPrev) * 100) : 0
    const satPrev         = feedbacksPrev._avg.score ?? 0

    const kpis = {
      revenus: {
        value: Math.round(totalRevenuCur), previous: Math.round(totalRevenuPrev),
        deltaPct: deltaPct(totalRevenuCur, totalRevenuPrev),
        sparkline: sparkline(facturesCur.map(f => ({ date: f.dateEmise, v: f.montant })), from, to),
      },
      rdv: {
        value: totalRdvCur, previous: rendezVousPrev,
        deltaPct: deltaPct(totalRdvCur, rendezVousPrev),
        sparkline: sparkline(rendezVousCur.map(r => ({ date: r.date, v: 1 })), from, to),
      },
      seancesRealisees: {
        value: seancesRealCur, previous: seancesPrev,
        deltaPct: deltaPct(seancesRealCur, seancesPrev),
        sparkline: sparkline(seancesCur.filter(s => s.statut === 'realisee').map(s => ({ date: s.date, v: 1 })), from, to),
      },
      nouveauxPatients: {
        value: patientsCur.length, previous: patientsPrev,
        deltaPct: deltaPct(patientsCur.length, patientsPrev),
        sparkline: sparkline(patientsCur.map(p => ({ date: p.createdAt, v: 1 })), from, to),
      },
      tauxPresence: {
        value: tauxPresCur, previous: tauxPresPrev,
        deltaPct: tauxPresCur - tauxPresPrev,
        sparkline: sparkline(seancesCur.filter(s => s.statut === 'realisee').map(s => ({ date: s.date, v: 1 })), from, to),
      },
      satisfaction: {
        value: moyenneSat, previous: Math.round(satPrev * 10) / 10,
        deltaPct: Math.round((moyenneSat - satPrev) * 10),
        sparkline: sparkline(feedbacksCur.map(f => ({ date: f.createdAt, v: f.score })), from, to),
      },
    }

    return NextResponse.json({
      period: { from: fromStr, to: toStr },
      kpis,
      revenus: { parMois: revenusParMois, parType: revByTypeArr, repartition: repartitionRevenus },
      rdv: { parMois: rdvParMois, parJour: tauxParJour, heatmap },
      patients: { nouveauxParMois, pathologies, fidelite, plusFidele, dureeMoyenne, espacementMoyen: espacementMoy },
      satisfaction: { evolution: evolutionSat, distribution: distribSat, summary: { total: feedbacksCur.length, moyenne: moyenneSat, pctExcellent, negatifs } },
      praticiensStats: praticienStats,
      meta: { praticiens, seanceTypes },
    })
  } catch (e) {
    console.error('[GET /api/rapports/stats]', e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
