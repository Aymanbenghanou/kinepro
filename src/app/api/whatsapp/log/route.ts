import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertNotWalled } from '@/lib/plan-server'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { cabinetId } = session.user

  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const logs = await prisma.whatsAppLog.findMany({
      where: {
        cabinetId,
        ...(patientId ? { patientId } : {}),
      },
      include: {
        patient: { select: { id: true, nom: true, prenom: true, telephone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json(logs)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __perm = await requirePermission('agenda'); if (__perm instanceof NextResponse) return __perm;
  const session = await auth()
  if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { cabinetId } = session.user

  try {
    const body = await request.json()
    const log = await prisma.whatsAppLog.create({
      data: {
        type: body.type,
        cabinetId,
        patientId: body.patientId,
        patientNom: body.patientNom,
        telephone: body.telephone,
        message: body.message,
      },
    })
    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
