import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled, assertPro } from '@/lib/plan-server'
import { removeObject } from '@/lib/supabase'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

// Les anciens documents Cloudinary stockent une URL http ; les nouveaux un chemin Supabase.
function isLegacyUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('programmesEtDocs'); if (__perm instanceof NextResponse) return __perm;
  const __pro  = await assertPro();      if (__pro)  return __pro;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { docId } = await params

    const doc = await prisma.document.findFirst({ where: { id: docId, cabinetId } })
    if (!doc) return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })

    // Supprime d'abord le fichier du Storage (sauf legacy Cloudinary).
    // Un échec de suppression Storage ne doit pas bloquer la suppression en base.
    if (doc.url && !isLegacyUrl(doc.url)) {
      try {
        await removeObject(doc.url)
      } catch (e) {
        console.error('[DELETE document] suppression Storage échouée', e)
      }
    }

    await prisma.document.delete({ where: { id: docId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/patients/[id]/documents/[docId]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
