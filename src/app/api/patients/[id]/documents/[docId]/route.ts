import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { docId } = await params

    const doc = await prisma.document.findFirst({ where: { id: docId, cabinetId } })
    if (!doc) return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })

    await prisma.document.delete({ where: { id: docId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/patients/[id]/documents/[docId]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
