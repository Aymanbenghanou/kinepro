import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params

  const patient = await prisma.patient.findFirst({
    where: { id, cabinetId: session.user.cabinetId },
    select: { id: true, publicToken: true, prenom: true, nom: true },
  })

  if (!patient) {
    return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })
  }

  // Generate token on first access
  if (!patient.publicToken) {
    const token = crypto.randomBytes(16).toString('hex')
    await prisma.patient.update({
      where: { id },
      data: { publicToken: token },
    })
    return NextResponse.json({ token, prenom: patient.prenom, nom: patient.nom })
  }

  return NextResponse.json({
    token: patient.publicToken,
    prenom: patient.prenom,
    nom: patient.nom,
  })
}
