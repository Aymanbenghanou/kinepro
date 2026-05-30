/**
 * GET  /api/facturation
 *   ?patientId=&statut=&from=&to=&praticienId=&q=
 *   Lists factures with payment progress. Auto-recomputes statut so
 *   "en_retard" stays accurate without a cron job.
 * POST /api/facturation
 *   Creates a new facture (kept for compatibility with the create modal).
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { computeStatut } from '@/lib/facture-statut'
import { validateBody } from '@/lib/validate'
import { createFactureSchema } from '@/lib/schemas/billing'

function errMsg(e: unknown): string { return e instanceof Error ? e.message : 'Erreur' }

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const { cabinetId } = session.user

    const sp = req.nextUrl.searchParams
    const patientId   = sp.get('patientId')   || undefined
    const statut      = sp.get('statut')      || undefined
    const from        = sp.get('from')        || undefined
    const to          = sp.get('to')          || undefined
    const praticienId = sp.get('praticienId') || undefined
    const q           = (sp.get('q') || '').trim().toLowerCase()

    const where: any = { cabinetId }
    if (patientId) where.patientId = patientId
    if (from || to) {
      where.dateEmise = {}
      if (from) where.dateEmise.gte = new Date(from + 'T00:00:00')
      if (to)   where.dateEmise.lte = new Date(to   + 'T23:59:59.999')
    }
    if (praticienId && praticienId !== 'all') where.seance = { praticienId }

    let factures = await prisma.facture.findMany({
      where,
      include: {
        patient: { select: { id: true, nom: true, prenom: true, telephone: true, email: true, publicToken: true } },
        seance:  {
          select: {
            id: true, typeSeance: true, date: true, praticienId: true,
            praticien:  { select: { nom: true, prenom: true, couleur: true } },
            seanceType: { select: { nom: true, couleur: true } },
          },
        },
        _count: { select: { paiements: true } },
      },
      orderBy: { dateEmise: 'desc' },
    })

    // Recompute statut on the fly (handles 'en_retard' aging without DB writes)
    factures = factures.map((f: any) => {
      const newStatut = computeStatut(f.montant, f.montantPaye ?? 0, f.dateEmise)
      const reste = Math.max(0, f.montant - (f.montantPaye ?? 0))
      return { ...f, statut: newStatut, reste }
    })

    // Optional statut filter (after recomputation)
    if (statut && statut !== 'all') factures = factures.filter((f: any) => f.statut === statut)

    // Optional client-text search by patient name
    if (q) factures = factures.filter((f: any) => {
      const name = `${f.patient?.prenom ?? ''} ${f.patient?.nom ?? ''}`.toLowerCase()
      return name.includes(q)
    })

    return NextResponse.json(factures)
  } catch (e) {
    console.error('[GET /api/facturation]', e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('factures'); if (__perm instanceof NextResponse) return __perm;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const { cabinetId } = session.user

    const v = await validateBody(req, createFactureSchema)
    if ('error' in v) return v.error
    const body = v.data

    const facture = await prisma.facture.create({
      data: {
        cabinetId,
        patientId:   body.patientId,
        seanceId:    body.seanceId || null,
        montant:     body.montant,
        montantPaye: 0,
        statut:      'en_attente',
      },
      include: { patient: { select: { id: true, nom: true, prenom: true } } },
    })
    return NextResponse.json(facture, { status: 201 })
  } catch (e) {
    console.error('[POST /api/facturation]', e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
