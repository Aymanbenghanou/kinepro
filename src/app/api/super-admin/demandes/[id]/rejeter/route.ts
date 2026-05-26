import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/super-admin/demandes/[id]/rejeter
// Rejette une demande (statut "rejetee"). Ne touche PAS au plan du cabinet. Super Admin only.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  try {
    const { id } = await params
    const demande = await prisma.demandeAbonnement.findUnique({ where: { id } })
    if (!demande) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
    if (demande.statut !== 'en_attente') {
      return NextResponse.json({ error: 'Demande déjà traitée' }, { status: 400 })
    }

    await prisma.demandeAbonnement.update({ where: { id }, data: { statut: 'rejetee' } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/super-admin/demandes/[id]/rejeter]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
