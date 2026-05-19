import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: session.user.cabinetId },
    select: { id: true, nom: true, publicToken: true },
  })

  if (!cabinet) {
    return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 404 })
  }

  if (!cabinet.publicToken) {
    const token = crypto.randomBytes(16).toString('hex')
    await prisma.cabinet.update({
      where: { id: cabinet.id },
      data: { publicToken: token },
    })
    return NextResponse.json({ token, nom: cabinet.nom })
  }

  return NextResponse.json({ token: cabinet.publicToken, nom: cabinet.nom })
}
