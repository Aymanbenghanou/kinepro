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
      where: { id, cabinetId, deletedAt: null },
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

    // Verify ownership + non-anonymisé (un PUT sur un patient anonymisé renvoie 404).
    const existing = await prisma.patient.findFirst({ where: { id, cabinetId, deletedAt: null } })
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
 * PATTERN ANONYMISATION (pas hard delete) :
 *   - Garde-fou métier : BLOQUÉ s'il existe au moins une facture PAYÉE.
 *   - HARD DELETE : RendezVous, Document (+ Storage), ExerciceProgram,
 *     WhatsAppLog, Feedback (données opérationnelles non audit-critiques).
 *   - CONSERVÉS via lien vers Patient anonymisé : Seance (notes médicales,
 *     scores), Facture (audit comptable), Paiement (audit comptable).
 *   - PII EFFACÉES sur la row Patient elle-même : nom='Patient supprimé',
 *     prenom='', tous les autres champs identifiants → null, publicToken →
 *     null (rend les liens publics inaccessibles), deletedAt=now().
 *
 * Une fois anonymisé, le filtre `deletedAt: null` sur les GET et la liste
 * empêche d'y arriver depuis l'UI. Les routes publiques (patient-public,
 * scan) retournent 404 naturellement (publicToken vidé).
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

    // Filtre deletedAt: null → un patient déjà anonymisé renvoie 404.
    const existing = await prisma.patient.findFirst({
      where: { id, cabinetId, deletedAt: null },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 })

    // Garde-fou : factures payées ⇒ refus (inchangé du commit précédent).
    const facturesPayees = await prisma.facture.count({
      where: { patientId: id, cabinetId, statut: FactureStatut.paye },
    })
    if (facturesPayees > 0) {
      return NextResponse.json(
        { error: 'patient_has_paid_factures', count: facturesPayees },
        { status: 409 }
      )
    }

    // Récup des paths Storage AVANT delete des Document rows.
    const docs = await prisma.document.findMany({
      where: { patientId: id, cabinetId },
      select: { url: true },
    })

    // Transaction : hard delete des enfants non-audit + anonymisation Patient.
    // Seance / Facture / Paiement restent intacts → pointeront vers la row
    // Patient anonymisée (nom='Patient supprimé').
    await prisma.$transaction(async (tx) => {
      await tx.rendezVous.deleteMany({ where: { patientId: id, cabinetId } })
      await tx.document.deleteMany({ where: { patientId: id, cabinetId } })
      await tx.exerciceProgram.deleteMany({ where: { patientId: id, cabinetId } })
      await tx.whatsAppLog.deleteMany({ where: { patientId: id, cabinetId } })
      await tx.feedback.deleteMany({ where: { patientId: id } })

      await tx.patient.update({
        where: { id },
        data: {
          // NOT NULL → placeholder neutre (cf. AGENTS.md §1 option B retenue)
          nom:    'Patient supprimé',
          prenom: '',
          // PII nullables → null
          dateNaissance:    null,
          sexe:             null,
          telephone:        null,
          email:            null,
          adresse:          null,
          ville:            null,
          cin:              null,
          pathologie:       null,
          antecedents:      null,
          allergies:        null,
          medicaments:      null,
          medecinReferent:  null,
          medecinTelephone: null,
          mutuelle:         null,
          numeroPolice:     null,
          objectifsTraitement: null,
          publicToken:      null, // void les liens publics (/patient-public, /scan)
          // Flag anonymisation
          deletedAt:        new Date(),
        },
      })
    })

    // Storage cleanup best-effort (post-commit).
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

    return NextResponse.json({ anonymized: true, patientId: id, storage })
  } catch (error) {
    console.error('[DELETE /api/patients/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
