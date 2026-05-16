import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statut = searchParams.get('statut') || ''

    const patients = await prisma.patient.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { nom: { contains: search } },
              { prenom: { contains: search } },
            ]
          } : {},
          statut === 'actif' ? { actif: true } : statut === 'inactif' ? { actif: false } : {},
        ]
      },
      include: {
        seances: { select: { id: true } },
        rendezVous: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const patient = await prisma.patient.create({
      data: {
        nom: body.nom,
        prenom: body.prenom,
        dateNaissance: body.dateNaissance ? new Date(body.dateNaissance) : null,
        sexe: body.sexe || null,
        telephone: body.telephone || null,
        email: body.email || null,
        adresse: body.adresse || null,
        ville: body.ville || null,
        cin: body.cin || null,
        pathologie: body.pathologie || null,
        antecedents: body.antecedents || null,
        allergies: body.allergies || null,
        medicaments: body.medicaments || null,
        medecinReferent: body.medecinReferent || null,
        medecinTelephone: body.medecinTelephone || null,
        mutuelle: body.mutuelle || null,
        numeroPolice: body.numeroPolice || null,
        tarifSeance: body.tarifSeance ? parseFloat(body.tarifSeance) : null,
        modePaiement: body.modePaiement || null,
        nbSeancesPrescrites: body.nbSeancesPrescrites ? parseInt(body.nbSeancesPrescrites) : null,
        frequence: body.frequence || null,
        praticienAssigneId: body.praticienAssigneId || null,
        typesSeances: body.typesSeances || null,
        objectifsTraitement: body.objectifsTraitement || null,
        dateDebutSouhaite: body.dateDebutSouhaite ? new Date(body.dateDebutSouhaite) : null,
      },
    })
    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
