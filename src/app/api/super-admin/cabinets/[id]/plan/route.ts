import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const { action } = await request.json()

    const cabinet = await prisma.cabinet.findUnique({ where: { id }, include: { subscription: true } })
    if (!cabinet) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 404 })

    let plan: string
    let trialEndsAt: Date | undefined
    let currentPeriodEnd: Date | undefined

    switch (action) {
      case 'activate':
        plan = 'ACTIVE'
        currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
        break
      case 'suspend':
        plan = 'SUSPENDED'
        break
      case 'trial':
        plan = 'TRIAL'
        trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        break
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    const data: Record<string, unknown> = { plan }
    if (trialEndsAt) data.trialEndsAt = trialEndsAt
    if (currentPeriodEnd) data.currentPeriodEnd = currentPeriodEnd

    if (cabinet.subscription) {
      await prisma.subscription.update({
        where: { cabinetId: id },
        data,
      })
    } else {
      await prisma.subscription.create({
        data: {
          cabinetId: id,
          plan,
          trialEndsAt: trialEndsAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          currentPeriodEnd,
        },
      })
    }

    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error('[PATCH /api/super-admin/cabinets/[id]/plan]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
