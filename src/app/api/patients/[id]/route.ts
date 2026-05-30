import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { updatePatientSchema } from '@/lib/schemas/medical'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    const patient = await prisma.patient.findFirst({
      where: { id, cabinetId },
      include: {
        seances: {
          include: { praticien: true },
          orderBy: { date: 'desc' },
        },
        rendezVous: {
          include: { praticien: true },
          orderBy: { date: 'desc' },
        },
        factures: {
          orderBy: { dateEmise: 'desc' },
        },
        feedbacks: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, score: true, commentaire: true, createdAt: true, seanceId: true },
        },
      },
    })
    if (!patient) return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 })
    return NextResponse.json(patient)
  } catch (error) {
    console.error('[GET /api/patients/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('patients'); if (__perm instanceof NextResponse) return __perm;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    // Verify ownership
    const existing = await prisma.patient.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 })

    const v = await validateBody(request, updatePatientSchema)
    if ('error' in v) return v.error
    const body = v.data

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        nom:             body.nom,
        prenom:          body.prenom,
        dateNaissance:   body.dateNaissance ? new Date(body.dateNaissance) : null,
        sexe:            body.sexe            || null,
        telephone:       body.telephone       || null,
        email:           body.email           || null,
        adresse:         body.adresse         || null,
        ville:           body.ville           || null,
        cin:             body.cin             || null,
        pathologie:      body.pathologie      || null,
        antecedents:     body.antecedents     || null,
        allergies:       body.allergies       || null,
        medicaments:     body.medicaments     || null,
        medecinReferent: body.medecinReferent || null,
        medecinTelephone:body.medecinTelephone|| null,
        mutuelle:        body.mutuelle        || null,
        numeroPolice:    body.numeroPolice    || null,
        tarifSeance:     body.tarifSeance     ? parseFloat(String(body.tarifSeance)) : null,
        modePaiement:    body.modePaiement    || null,
        nbSeancesPrescrites: body.nbSeancesPrescrites ? parseInt(String(body.nbSeancesPrescrites)) : null,
        frequence:       body.frequence       || null,
        praticienAssigneId: body.praticienAssigneId || null,
        objectifsTraitement: body.objectifsTraitement || null,
        actif:           body.actif !== undefined ? body.actif : undefined,
      },
    })
    return NextResponse.json(patient)
  } catch (error) {
    console.error('[PUT /api/patients/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('patients'); if (__perm instanceof NextResponse) return __perm;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    // Verify ownership
    const existing = await prisma.patient.findFirst({ where: { id, cabinetId } })
    if (!existing) return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 })

    await prisma.patient.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/patients/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
