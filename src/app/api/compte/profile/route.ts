import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, nom: true, prenom: true, email: true, telephone: true, lastLoginAt: true, createdAt: true, role: true },
    })
    if (!user) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    console.error('[GET /api/compte/profile]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const data: Record<string, string | null> = {}
    if (body.nom       !== undefined) data.nom       = body.nom.trim()
    if (body.prenom    !== undefined) data.prenom    = body.prenom.trim()
    if (body.telephone !== undefined) data.telephone = body.telephone?.trim() || null
    if (body.email  !== undefined) {
      // Check email uniqueness if changed
      if (body.email !== session.user.email) {
        const existing = await prisma.user.findUnique({ where: { email: body.email } })
        if (existing) return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
      }
      data.email = body.email.trim()
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, nom: true, prenom: true, email: true, telephone: true, lastLoginAt: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('[PATCH /api/compte/profile]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
