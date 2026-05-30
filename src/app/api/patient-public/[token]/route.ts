import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicLimiter, checkRateLimit } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const rl = await checkRateLimit(request, publicLimiter); if (rl) return rl
  const { token } = await params

  const patient = await prisma.patient.findUnique({
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
          salle: true,
          statut: true,
          praticien: { select: { prenom: true, nom: true } },
        },
      },
    },
  })

  if (!patient) {
    return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })
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
