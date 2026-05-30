import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'
import { randomBytes } from 'crypto'
import { validateBody } from '@/lib/validate'
import { createPatientSchema } from '@/lib/schemas/medical'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statut = searchParams.get('statut') || ''

    const patients = await prisma.patient.findMany({
      where: {
        cabinetId,
        AND: [
          search ? {
            OR: [
              { nom: { contains: search, mode: 'insensitive' } },
              { prenom: { contains: search, mode: 'insensitive' } },
            ],
          } : {},
          statut === 'actif'   ? { actif: true }  :
          statut === 'inactif' ? { actif: false } : {},
        ],
      },
      include: {
        seances:    { select: { id: true } },
        rendezVous: { orderBy: { date: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error('[GET /api/patients]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('patients'); if (__perm instanceof NextResponse) return __perm;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user

    const v = await validateBody(request, createPatientSchema)
    if ('error' in v) return v.error
    const body = v.data

    const patient = await prisma.patient.create({
      data: {
        cabinetId,
        publicToken:         randomBytes(16).toString('hex'),
        nom:                 body.nom.trim(),
        prenom:              body.prenom.trim(),
        dateNaissance:       body.dateNaissance       ? new Date(body.dateNaissance) : null,
        sexe:                body.sexe                || null,
        telephone:           body.telephone           || null,
        email:               body.email               || null,
        adresse:             body.adresse             || null,
        ville:               body.ville               || null,
        cin:                 body.cin                 || null,
        pathologie:          body.pathologie          || null,
        antecedents:         body.antecedents         || null,
        allergies:           body.allergies           || null,
        medicaments:         body.medicaments         || null,
        medecinReferent:     body.medecinReferent     || null,
        medecinTelephone:    body.medecinTelephone    || null,
        mutuelle:            body.mutuelle            || null,
        numeroPolice:        body.numeroPolice        || null,
        tarifSeance:         body.tarifSeance         ? parseFloat(String(body.tarifSeance))      : null,
        modePaiement:        body.modePaiement        || null,
        nbSeancesPrescrites: body.nbSeancesPrescrites ? parseInt(String(body.nbSeancesPrescrites)) : null,
        frequence:           body.frequence           || null,
        praticienAssigneId:  body.praticienAssigneId  || null,
        typesSeances:        body.typesSeances        || null,
        objectifsTraitement: body.objectifsTraitement || null,
        dateDebutSouhaite:   body.dateDebutSouhaite   ? new Date(body.dateDebutSouhaite) : null,
      },
    })
    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error('[POST /api/patients]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
