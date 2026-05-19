import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple in-memory rate limiter: token → { count, resetAt }
const rateMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(token: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(token)
  if (!entry || now > entry.resetAt) {
    rateMap.set(token, { count: 1, resetAt: now + 60_000 })
    return false
  }
  if (entry.count >= 10) return true
  entry.count++
  return false
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params

  if (isRateLimited(token)) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { publicToken: token },
      select: {
        id: true,
        prenom: true,
        nom: true,
        publicToken: true,
        cabinet: {
          select: { nom: true, adresse: true, ville: true, telephone: true, email: true },
        },
        rendezVous: {
          where: { date: { gte: new Date() } },
          orderBy: { date: 'asc' },
          take: 3,
          select: { id: true, date: true, statut: true, notes: true },
        },
        seances: {
          orderBy: { date: 'desc' },
          take: 5,
          select: { id: true, date: true, typeSeance: true, statut: true, duree: true },
        },
        factures: {
          orderBy: { dateEmise: 'desc' },
          take: 1,
          select: { id: true, montant: true, statut: true, dateEmise: true, datePaiement: true },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (err) {
    console.error('[GET /api/scan/[token]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
