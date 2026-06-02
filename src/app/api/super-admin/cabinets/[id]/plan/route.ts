import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CabinetPlan, CabinetPlanStatus, Prisma } from '@prisma/client'
import { assertSuperAdmin } from '@/lib/super-admin-guard'
import { validateBody } from '@/lib/validate'
import { updateCabinetPlanSchema } from '@/lib/schemas/admin-cabinet'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

/**
 * PATCH /api/super-admin/cabinets/[id]/plan
 * Actions :
 *   - setPlan         : { plan: trial|starter|pro }     → change le plan, ajuste planStatus
 *   - setExpiry       : { planEndsAt: ISO|YYYY-MM-DD }  → modifie la date d'expiration
 *   - extendOneYear   : raccourci → planEndsAt = today + 365 j, planStatus='active'
 *   - suspend         : { reason }                       → planStatus='suspended', suspensionReason, suspendedAt=now
 *   - reactivate      : clear suspensionReason+suspendedAt, planStatus='active'
 *
 * Source de vérité = Cabinet.{plan,planStatus,planEndsAt,...} (cf. AGENTS.md §7).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sa = await assertSuperAdmin(); if (sa) return sa

  const v = await validateBody(request, updateCabinetPlanSchema)
  if ('error' in v) return v.error
  const body = v.data

  try {
    const { id } = await params
    const cabinet = await prisma.cabinet.findUnique({ where: { id } })
    if (!cabinet) return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 404 })

    const data: Prisma.CabinetUpdateInput = {}

    switch (body.action) {
      case 'setPlan': {
        data.plan = body.plan
        if (body.plan === CabinetPlan.trial) {
          data.planStatus = CabinetPlanStatus.trialing
        } else {
          // starter/pro → on bascule en actif ; la date d'expiration reste celle déjà fixée
          data.planStatus = CabinetPlanStatus.active
        }
        break
      }
      case 'setExpiry': {
        const d = new Date(body.planEndsAt)
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
        }
        data.planEndsAt = d
        break
      }
      case 'extendOneYear': {
        data.planEndsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        data.planStatus = CabinetPlanStatus.active
        break
      }
      case 'suspend': {
        data.planStatus       = CabinetPlanStatus.suspended
        data.suspensionReason = body.reason.trim()
        data.suspendedAt      = new Date()
        break
      }
      case 'reactivate': {
        data.planStatus       = CabinetPlanStatus.active
        data.suspensionReason = null
        data.suspendedAt      = null
        break
      }
    }

    const updated = await prisma.cabinet.update({ where: { id }, data })
    return NextResponse.json({ success: true, cabinet: updated })
  } catch (error) {
    console.error('[PATCH /api/super-admin/cabinets/[id]/plan]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
