import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertPro } from '@/lib/plan-server'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id: patientId } = await params

    // Verify patient belongs to cabinet
    const patient = await prisma.patient.findFirst({ where: { id: patientId, cabinetId } })
    if (!patient) return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 })

    const documents = await prisma.document.findMany({
      where: { patientId, cabinetId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(documents)
  } catch (error) {
    console.error('[GET /api/patients/[id]/documents]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    // Verrou Pro : l'upload de documents est une fonctionnalité Pro.
    const __perm = await requirePermission('programmesEtDocs'); if (__perm instanceof NextResponse) return __perm;

    const proGate = await assertPro(); if (proGate) return proGate
    const { cabinetId, name: userName, prenom: userPrenom } = session.user as any
    const { id: patientId } = await params

    // Verify patient belongs to cabinet
    const patient = await prisma.patient.findFirst({ where: { id: patientId, cabinetId } })
    if (!patient) return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 })

    const body = await request.json()
    if (!body.url || !body.nom) {
      return NextResponse.json({ error: 'URL et nom requis' }, { status: 400 })
    }

    const document = await prisma.document.create({
      data: {
        nom:        body.nom.trim(),
        type:       body.type || 'autre',
        url:        body.url,
        size:       body.size ? parseInt(body.size) : null,
        patientId,
        cabinetId,
        uploadedBy: `${userPrenom || ''} ${userName || ''}`.trim() || undefined,
      },
    })
    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('[POST /api/patients/[id]/documents]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
