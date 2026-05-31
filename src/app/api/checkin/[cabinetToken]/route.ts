import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicLimiter, checkRateLimit } from '@/lib/rate-limit'
import { RdvStatut } from '@prisma/client'

async function getCabinetByToken(cabinetToken: string) {
  return prisma.cabinet.findUnique({
    where: { publicToken: cabinetToken },
    select: { id: true, nom: true },
  })
}

// GET — look up patient by phone number, return their next RDV
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cabinetToken: string }> }
) {
  const rl = await checkRateLimit(request, publicLimiter); if (rl) return rl
  const { cabinetToken } = await params
  const phone = request.nextUrl.searchParams.get('phone')

  const cabinet = await getCabinetByToken(cabinetToken)
  if (!cabinet) {
    return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 404 })
  }

  if (!phone) {
    return NextResponse.json({ cabinet: { nom: cabinet.nom } })
  }

  // Normalize phone: strip spaces and dashes
  const normalizedPhone = phone.replace(/[\s\-().+]/g, '')

  const patients = await prisma.patient.findMany({
    where: {
      cabinetId: cabinet.id,
      telephone: { contains: normalizedPhone.slice(-9) }, // last 9 digits
    },
    select: {
      id: true,
      prenom: true,
      nom: true,
      telephone: true,
      rendezVous: {
        where: { date: { gte: new Date() } },
        orderBy: { date: 'asc' },
        take: 1,
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

  if (patients.length === 0) {
    return NextResponse.json({ error: 'Aucun patient trouvé avec ce numéro' }, { status: 404 })
  }

  const patient = patients[0]
  return NextResponse.json({
    cabinet: { nom: cabinet.nom },
    patient: {
      id:     patient.id,
      prenom: patient.prenom,
      nom:    patient.nom,
    },
    nextRdv: patient.rendezVous[0] || null,
  })
}

// POST — confirm patient presence for a specific RDV
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cabinetToken: string }> }
) {
  const rl = await checkRateLimit(request, publicLimiter); if (rl) return rl
  const { cabinetToken } = await params
  const cabinet = await getCabinetByToken(cabinetToken)
  if (!cabinet) {
    return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 404 })
  }

  const body = await request.json()
  const { rdvId } = body

  if (!rdvId) {
    return NextResponse.json({ error: 'RDV manquant' }, { status: 400 })
  }

  // Verify RDV belongs to this cabinet
  const rdv = await prisma.rendezVous.findFirst({
    where: { id: rdvId, cabinetId: cabinet.id },
  })

  if (!rdv) {
    return NextResponse.json({ error: 'RDV introuvable' }, { status: 404 })
  }

  await prisma.rendezVous.update({
    where: { id: rdvId },
    // NOTE A3 : la valeur historique 'present' (1 row legacy) a été migrée
    // vers 'confirme' pour entrer dans l'enum RdvStatut. Cette ligne suit
    // la même règle. À reconsidérer si « patient arrivé » mérite un statut
    // dédié dans l'enum.
    data: { statut: RdvStatut.confirme },
  })

  return NextResponse.json({ success: true })
}
