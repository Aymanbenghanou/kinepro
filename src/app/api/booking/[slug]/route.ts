/**
 * Public booking API — no auth required.
 *
 * GET  /api/booking/[slug]           → cabinet public info
 * POST /api/booking/[slug]           → create online appointment
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

type Context = { params: Promise<{ slug: string }> }

// ─── GET — public cabinet info ────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Context) {
  const { slug } = await params

  try {
    const cabinet = await prisma.cabinet.findUnique({
      where: { slug },
      select: {
        id: true,
        nom: true,
        ville: true,
        adresse: true,
        telephone: true,
        bookingEnabled: true,
        bookingMessage: true,
        workStartTime: true,
        workEndTime: true,
        lunchStartTime: true,
        lunchEndTime: true,
        workingDays: true,
        seanceTypes: {
          where: { actif: true },
          select: { id: true, nom: true, dureeDefaut: true, tarifDefaut: true, couleur: true, description: true },
          orderBy: { nom: 'asc' },
        },
        praticiens: {
          where: { actif: true },
          select: { id: true, nom: true, prenom: true, specialite: true, couleur: true },
          orderBy: { nom: 'asc' },
        },
      },
    })

    if (!cabinet) {
      return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 404 })
    }

    return NextResponse.json(cabinet)
  } catch (err) {
    console.error('[GET /api/booking/[slug]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST — create online booking ────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: Context) {
  const { slug } = await params

  try {
    const body = await req.json()
    const { seanceTypeId, praticienId, date, time, patient: patientInput } = body

    // Validate required
    if (!seanceTypeId || !date || !time || !patientInput?.prenom || !patientInput?.nom || !patientInput?.telephone) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    // Find cabinet
    const cabinet = await prisma.cabinet.findUnique({
      where: { slug },
      select: {
        id: true, nom: true, ville: true,
        bookingEnabled: true, workingDays: true,
      },
    })
    if (!cabinet) return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 404 })
    if (!cabinet.bookingEnabled) return NextResponse.json({ error: 'Réservation en ligne désactivée' }, { status: 403 })

    // Validate seanceType
    const seanceType = await prisma.seanceType.findFirst({
      where: { id: seanceTypeId, cabinetId: cabinet.id, actif: true },
    })
    if (!seanceType) return NextResponse.json({ error: 'Type de séance invalide' }, { status: 400 })

    // Validate praticien (if provided)
    let resolvedPraticienId = praticienId
    if (praticienId) {
      const praticien = await prisma.praticien.findFirst({
        where: { id: praticienId, cabinetId: cabinet.id, actif: true },
      })
      if (!praticien) return NextResponse.json({ error: 'Praticien invalide' }, { status: 400 })
    } else {
      // Pick first available praticien
      const anyPraticien = await prisma.praticien.findFirst({
        where: { cabinetId: cabinet.id, actif: true },
        orderBy: { nom: 'asc' },
      })
      if (!anyPraticien) return NextResponse.json({ error: 'Aucun praticien disponible' }, { status: 400 })
      resolvedPraticienId = anyPraticien.id
    }

    // Build DateTime
    const [h, m] = time.split(':').map(Number)
    const appointmentDate = new Date(`${date}T00:00:00`)
    appointmentDate.setHours(h, m, 0, 0)

    // Check slot still available (race condition protection)
    const slotEnd = new Date(appointmentDate.getTime() + seanceType.dureeDefaut * 60_000)
    const collision = await prisma.rendezVous.findFirst({
      where: {
        cabinetId: cabinet.id,
        praticienId: resolvedPraticienId,
        date: {
          gte: new Date(appointmentDate.getTime() - (seanceType.dureeDefaut - 1) * 60_000),
          lt: slotEnd,
        },
      },
    })
    if (collision) {
      return NextResponse.json({ error: 'Ce créneau vient d\'être réservé. Veuillez choisir un autre.' }, { status: 409 })
    }

    // Find or create patient by telephone
    let patient = await prisma.patient.findFirst({
      where: {
        cabinetId: cabinet.id,
        telephone: patientInput.telephone,
      },
    })

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          cabinetId: cabinet.id,
          nom: patientInput.nom.trim(),
          prenom: patientInput.prenom.trim(),
          telephone: patientInput.telephone.trim(),
          email: patientInput.email?.trim() || null,
          publicToken: randomBytes(16).toString('hex'),
        },
      })
    }

    // Create RDV
    const rdv = await prisma.rendezVous.create({
      data: {
        cabinetId: cabinet.id,
        date: appointmentDate,
        duree: seanceType.dureeDefaut,
        typeSeance: seanceType.nom,
        seanceTypeId: seanceType.id,
        praticienId: resolvedPraticienId,
        patientId: patient.id,
        statut: 'confirme',
        source: 'online',
        patientNotes: patientInput.notes?.trim() || null,
        confirmedAt: new Date(),
      },
      include: {
        patient:    { select: { id: true, nom: true, prenom: true } },
        praticien:  { select: { id: true, nom: true, prenom: true } },
        seanceType: { select: { nom: true, dureeDefaut: true } },
      },
    })

    return NextResponse.json({
      success: true,
      rdv: {
        id: rdv.id,
        date: rdv.date,
        duree: rdv.duree,
        typeSeance: rdv.typeSeance,
        patient: rdv.patient,
        praticien: rdv.praticien,
        cabinet: { nom: cabinet.nom, ville: cabinet.ville },
      },
    }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/booking/[slug]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
