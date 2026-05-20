/**
 * GET /api/patients/[id]/exercise-programs — list programs for a patient
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params

  const programs = await prisma.exerciceProgram.findMany({
    where: { patientId: id, cabinetId: session.user.cabinetId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(programs)
}
