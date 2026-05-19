import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth()
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { token } = await params

  const patient = await prisma.patient.findFirst({
    where: {
      publicToken: token,
      cabinetId: session.user.cabinetId,
    },
    select: { id: true },
  })

  if (!patient) {
    return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })
  }

  return NextResponse.json({ patientId: patient.id })
}
