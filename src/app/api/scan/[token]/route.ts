import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicLimiter, checkRateLimit } from '@/lib/rate-limit'
import { isDbConnectivityError } from '@/lib/db-errors'

// Rate limit centralisé via Upstash (cf. src/lib/rate-limit.ts).
// L'ancien rate limiter en-mémoire (par token) ne survivait pas entre
// instances serverless ; remplacé par le limiter Upstash par IP.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const rl = await checkRateLimit(req, publicLimiter); if (rl) return rl
  const { token: rawToken } = await params
  const token = (rawToken ?? '').trim()

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
      const suffix = token.length >= 4 ? token.slice(-4) : token
      console.error(`[GET /api/scan/[token]] 404 not_found (token …${suffix})`)
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (err) {
    // Distinction connectivité DB (Supabase paused, timeout, cold-start) vs
    // bug applicatif — cf. src/lib/db-errors.ts et le patch équivalent sur
    // /api/patient-public/[token].
    if (isDbConnectivityError(err)) {
      console.error('[GET /api/scan/[token]] DB unreachable:', err)
      return NextResponse.json(
        { error: 'service_unavailable' },
        { status: 503, headers: { 'Retry-After': '10' } },
      )
    }
    console.error('[GET /api/scan/[token]]', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
