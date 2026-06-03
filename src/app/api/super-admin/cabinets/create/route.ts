import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { CabinetPlan, CabinetPlanStatus, UserRole } from '@prisma/client'
import { DEFAULT_SEANCE_TYPES } from '@/lib/default-seance-types'
import { assertSuperAdmin } from '@/lib/super-admin-guard'
import { validateBody } from '@/lib/validate'
import { createCabinetByAdminSchema } from '@/lib/schemas/admin-cabinet'
import { DEFAULT_TRIAL_DAYS } from '@/lib/plan'
import { deterministicPraticienColor } from '@/lib/colors'

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

/**
 * POST /api/super-admin/cabinets/create
 * Création high-touch d'un cabinet par le super-admin (gardée par assertSuperAdmin).
 * Crée cabinet + user owner + seance-types par défaut en transaction :
 *   - défaut d'essai = 15 jours (vs 7 sur l'ancien flux self-service)
 *   - plan starter/pro : planEndsAt fixé par le super-admin, planStatus='active'
 */
export async function POST(request: NextRequest) {
  const sa = await assertSuperAdmin(); if (sa) return sa

  const v = await validateBody(request, createCabinetByAdminSchema)
  if ('error' in v) return v.error
  const { cabinet: cab, owner, plan, trialDays, planEndsAt: planEndsAtStr } = v.data

  try {
    const exists = await prisma.user.findUnique({ where: { email: owner.email } })
    if (exists) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(owner.password, 12)

    // Calculs plan / dates
    let cabinetPlanStatus: CabinetPlanStatus
    let trialEndsAt: Date | null = null
    let planEndsAt: Date | null = null
    if (plan === CabinetPlan.trial) {
      cabinetPlanStatus = CabinetPlanStatus.trialing
      trialEndsAt = new Date(Date.now() + (trialDays ?? DEFAULT_TRIAL_DAYS) * 24 * 60 * 60 * 1000)
    } else {
      cabinetPlanStatus = CabinetPlanStatus.active
      planEndsAt = new Date(planEndsAtStr!)
      if (isNaN(planEndsAt.getTime())) {
        return NextResponse.json({ error: 'planEndsAt invalide' }, { status: 400 })
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const newCabinet = await tx.cabinet.create({
        data: {
          nom:          cab.nom.trim(),
          ville:        cab.ville?.trim() || null,
          telephone:    cab.telephone?.trim() || null,
          email:        cab.email?.trim() || null,
          plan,
          planStatus:   cabinetPlanStatus,
          trialEndsAt,
          planEndsAt,
          billingCycle: null,
        },
      })

      const newUser = await tx.user.create({
        data: {
          email:     owner.email.trim(),
          password:  hashedPassword,
          role:      UserRole.CABINET_OWNER,
          nom:       owner.nom.trim(),
          prenom:    owner.prenom.trim(),
          cabinetId: newCabinet.id,
        },
      })

      // Tout CABINET_OWNER est aussi praticien dans son cabinet : on crée
      // automatiquement le record Praticien lié, sinon il n'apparaît dans
      // aucun dropdown (création patient, RDV, etc.).
      const newPraticien = await tx.praticien.create({
        data: {
          cabinetId: newCabinet.id,
          nom:       owner.nom.trim(),
          prenom:    owner.prenom.trim(),
          couleur:   deterministicPraticienColor(newUser.id),
          actif:     true,
        },
      })

      const linkedUser = await tx.user.update({
        where: { id: newUser.id },
        data:  { praticienId: newPraticien.id },
      })

      await tx.cabinet.update({
        where: { id: newCabinet.id },
        data:  { ownerId: linkedUser.id },
      })

      await tx.seanceType.createMany({
        data: DEFAULT_SEANCE_TYPES.map(t => ({
          ...t,
          cabinetId: newCabinet.id,
          isDefault: true,
          actif:     true,
        })),
      })

      return { cabinetId: newCabinet.id, userId: newUser.id, praticienId: newPraticien.id }
    })

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/super-admin/cabinets/create]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
