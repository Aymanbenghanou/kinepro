import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicLimiter, checkRateLimit } from '@/lib/rate-limit'
import { isDbConnectivityError } from '@/lib/db-errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const rl = await checkRateLimit(request, publicLimiter); if (rl) return rl
  const { token: rawToken } = await params
  // trim défensif — un scanner QR ou un copier-coller peut ajouter des
  // caractères invisibles (newline, whitespace) qui font échouer le lookup
  // pour un token pourtant valide en base.
  const token = (rawToken ?? '').trim()

  let patient
  try {
    patient = await prisma.patient.findUnique({
      where: { publicToken: token },
      select: {
        id: true,
        prenom: true,
        nom: true,
        cabinetId: true,
        cabinet: {
          select: { nom: true, telephone: true, adresse: true, ville: true },
        },
        rendezVous: {
          where: { date: { gte: new Date() } },
          orderBy: { date: 'asc' },
          take: 3,
          select: {
            id: true,
            date: true,
            duree: true,
            typeSeance: true,
            statut: true,
            praticien: { select: { prenom: true, nom: true } },
          },
        },
      },
    })
  } catch (err) {
    // Distinction cruciale : connectivité DB (Supabase paused, timeout pool,
    // cold-start) → 503, à ne PAS confondre avec un vrai 404 côté UI (sinon
    // on affiche "dossier introuvable" à tort et on laisse croire au patient
    // que son dossier a été supprimé). Cf. src/lib/db-errors.ts.
    if (isDbConnectivityError(err)) {
      console.error('[GET /api/patient-public/[token]] DB unreachable:', err)
      return NextResponse.json(
        { error: 'service_unavailable' },
        { status: 503, headers: { 'Retry-After': '10' } },
      )
    }
    // Autre erreur applicative → 500 (bug à investiguer, pas connectivité).
    console.error('[GET /api/patient-public/[token]]', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  if (!patient) {
    // Log pour tracer combien de 404 réels arrivent et sur quels tokens
    // (les 4 derniers caractères suffisent — le token complet reste secret).
    const suffix = token.length >= 4 ? token.slice(-4) : token
    console.error(`[GET /api/patient-public/[token]] 404 not_found (token …${suffix})`)
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Identify today's vs upcoming RDVs
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const todayRdv  = patient.rendezVous.filter(r => {
    const d = new Date(r.date)
    return d >= todayStart && d <= todayEnd
  })
  const nextRdv = patient.rendezVous.find(r => new Date(r.date) > todayEnd) || null

  return NextResponse.json({
    prenom:   patient.prenom,
    nom:      patient.nom,
    cabinet:  patient.cabinet,
    todayRdv,
    nextRdv,
  })
}
