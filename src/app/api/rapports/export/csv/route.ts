/**
 * GET /api/rapports/export/csv?from=YYYY-MM-DD&to=YYYY-MM-DD&praticienId=all|<id>
 * Raw seance-level export: date, patient, type, praticien, durée, montant, statut, score.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.cabinetId) return new NextResponse('Non autorisé', { status: 401 })
  const { cabinetId } = session.user

  const sp = req.nextUrl.searchParams
  const from = sp.get('from'); const to = sp.get('to')
  const praticienId = sp.get('praticienId') ?? 'all'
  if (!from || !to) return new NextResponse('from/to requis', { status: 400 })

  const fromD = new Date(from + 'T00:00:00')
  const toD   = new Date(to   + 'T23:59:59.999')
  const where: any = { cabinetId, date: { gte: fromD, lte: toD } }
  if (praticienId !== 'all') where.praticienId = praticienId

  const seances = await prisma.seance.findMany({
    where, orderBy: { date: 'asc' },
    include: {
      patient:    { select: { nom: true, prenom: true } },
      praticien:  { select: { nom: true, prenom: true } },
      seanceType: { select: { nom: true } },
      facture:    { select: { montant: true, statut: true } },
    },
  })

  // Map score → join with Feedback table by seanceId if present
  const seanceIds = seances.map(s => s.id)
  const feedbacks = await prisma.feedback.findMany({
    where: { seanceId: { in: seanceIds } },
    select: { seanceId: true, score: true },
  })
  const scoreBySeance: Record<string, number> = {}
  feedbacks.forEach(f => { if (f.seanceId) scoreBySeance[f.seanceId] = f.score })

  const headers = ['Date', 'Patient', 'Type séance', 'Praticien', 'Durée (min)', 'Montant (MAD)', 'Statut', 'Score feedback']
  const rows = seances.map(s => [
    s.date.toISOString().slice(0, 10),
    `${s.patient.prenom} ${s.patient.nom}`,
    s.seanceType?.nom ?? s.typeSeance ?? '',
    `${s.praticien.prenom} ${s.praticien.nom}`,
    s.duree,
    s.facture?.montant ?? '',
    s.statut,
    scoreBySeance[s.id] ?? '',
  ])

  const bom = '﻿' // Excel-friendly UTF-8 BOM
  const body = bom + [headers, ...rows].map(r => r.map(csvEscape).join(',')).join('\n')

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rapport-${from}-${to}.csv"`,
    },
  })
}
