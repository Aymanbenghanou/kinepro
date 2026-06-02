import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled, assertPro } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { createDocumentSchema } from '@/lib/schemas/medical'
import { createDownloadUrl } from '@/lib/supabase'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

// Les anciens documents Cloudinary stockent une URL http complète ; les nouveaux
// stockent un chemin Supabase qu'il faut transformer en URL signée à la lecture.
function isLegacyUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
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

    // Transforme chaque chemin de stockage en URL signée temporaire (lecture sécurisée).
    // Les anciens documents Cloudinary (url http) sont renvoyés tels quels.
    const withUrls = await Promise.all(
      documents.map(async (d) => {
        if (!d.url || isLegacyUrl(d.url)) return d
        try {
          return { ...d, url: await createDownloadUrl(d.url) }
        } catch {
          return { ...d, url: '' } // fichier introuvable / Storage non configuré
        }
      }),
    )
    return NextResponse.json(withUrls)
  } catch (error) {
    console.error('[GET /api/patients/[id]/documents]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  // Verrou Pro : l'upload de documents est une fonctionnalité Pro.
  const __perm = await requirePermission('programmesEtDocs'); if (__perm instanceof NextResponse) return __perm;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const proGate = await assertPro(); if (proGate) return proGate
    const { cabinetId, name: userName, prenom: userPrenom } = session.user as any
    const { id: patientId } = await params

    // Verify patient belongs to cabinet
    const patient = await prisma.patient.findFirst({ where: { id: patientId, cabinetId } })
    if (!patient) return NextResponse.json({ error: 'Patient non trouvé' }, { status: 404 })

    const v = await validateBody(request, createDocumentSchema)
    if ('error' in v) return v.error
    const body = v.data

    const document = await prisma.document.create({
      data: {
        nom:        body.nom.trim(),
        type:       body.type || 'autre',
        url:        body.url,
        size:       body.size != null ? parseInt(String(body.size), 10) : null,
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
