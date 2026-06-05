import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { FactureStatut } from '@prisma/client'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { updatePatientSchema } from '@/lib/schemas/medical'
import { removeObjects } from '@/lib/supabase'

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

    // PATCH-style update : on ne touche QUE les champs effectivement présents
    // dans le body validé. Champ absent → DB intacte. Champ null explicite →
    // effacement. (Avant : tous les champs absents étaient écrasés à null par
    // `body.X || null`, ce qui détruisait silencieusement le dossier.)
    const WRITEABLE = [
      'nom', 'prenom', 'sexe', 'telephone', 'email', 'adresse', 'ville', 'cin',
      'pathologie', 'antecedents', 'allergies', 'medicaments',
      'medecinReferent', 'medecinTelephone', 'mutuelle', 'numeroPolice',
      'modePaiement', 'frequence', 'praticienAssigneId', 'objectifsTraitement',
      'actif',
    ] as const

    const updates: Record<string, unknown> = {}

    // Champs scalaires : on copie tel quel (string, boolean, null).
    for (const key of WRITEABLE) {
      if (key in body) updates[key] = (body as Record<string, unknown>)[key]
    }

    // Date : conversion conservée — string → Date, falsy → null.
    if ('dateNaissance' in body) {
      updates.dateNaissance = body.dateNaissance ? new Date(body.dateNaissance) : null
    }

    // Conversions numériques conservées — truthy → parseFloat/parseInt, sinon null.
    if ('tarifSeance' in body) {
      updates.tarifSeance = body.tarifSeance
        ? parseFloat(String(body.tarifSeance))
        : null
    }
    if ('nbSeancesPrescrites' in body) {
      updates.nbSeancesPrescrites = body.nbSeancesPrescrites
        ? parseInt(String(body.nbSeancesPrescrites))
        : null
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: updates,
    })
    return NextResponse.json(patient)
  } catch (error) {
    console.error('[PUT /api/patients/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

/**
 * DELETE /api/patients/[id]
 *
 * Garde-fou métier : BLOQUÉ s'il existe au moins une facture payée. La perte
 * d'historique comptable n'est jamais accidentelle — il faut d'abord annuler
 * les factures payées (ou contacter le support).
 *
 * Cascade manuelle (le schéma n'a onDelete:Cascade que sur ExerciceProgram) :
 *   Paiement → Facture → Document → Seance → RendezVous → Feedback →
 *   WhatsAppLog → Patient (ExerciceProgram cascadé auto).
 * Après commit DB, suppression best-effort des fichiers Supabase Storage.
 */
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

    const existing = await prisma.patient.findFirst({ where: { id, cabinetId }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 })

    // Garde-fou : factures payées ⇒ refus
    const facturesPayees = await prisma.facture.count({
      where: { patientId: id, cabinetId, statut: FactureStatut.paye },
    })
    if (facturesPayees > 0) {
      return NextResponse.json(
        { error: 'patient_has_paid_factures', count: facturesPayees },
        { status: 409 }
      )
    }

    // Récup des paths Storage AVANT delete (sera perdu sinon)
    const docs = await prisma.document.findMany({
      where: { patientId: id, cabinetId },
      select: { url: true },
    })

    // Cascade topologique (Paiement → Facture est cascade auto FK, mais on
    // est explicite pour cohérence avec les autres tables NO ACTION).
    await prisma.$transaction(async (tx) => {
      await tx.paiement.deleteMany({ where: { facture: { patientId: id, cabinetId } } })
      await tx.facture.deleteMany({ where: { patientId: id, cabinetId } })
      await tx.document.deleteMany({ where: { patientId: id, cabinetId } })
      await tx.seance.deleteMany({ where: { patientId: id, cabinetId } })
      await tx.rendezVous.deleteMany({ where: { patientId: id, cabinetId } })
      await tx.feedback.deleteMany({ where: { patientId: id } })
      await tx.whatsAppLog.deleteMany({ where: { patientId: id, cabinetId } })
      // ExerciceProgram : Cascade auto via FK onDelete: Cascade
      await tx.patient.delete({ where: { id } })
    })

    // Storage cleanup best-effort (post-commit) — la DB reste cohérente même
    // si Supabase échoue. Fichiers orphelins récupérables manuellement.
    let storage: { deleted: number; errors: string[] } = { deleted: 0, errors: [] }
    const paths = docs.map(d => d.url).filter(Boolean)
    if (paths.length > 0) {
      try {
        const res = await removeObjects(paths)
        storage = { deleted: res.deleted.length, errors: res.errors }
      } catch (e) {
        storage.errors.push(e instanceof Error ? e.message : String(e))
      }
      if (storage.errors.length) {
        console.error('[DELETE patient — storage errors]', { patientId: id, storage })
      }
    }

    return NextResponse.json({ deleted: true, patientId: id, storage })
  } catch (error) {
    console.error('[DELETE /api/patients/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
