import 'server-only'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getPlanState, hasProAccess, type PlanState } from '@/lib/plan'

export interface CabinetPlanResult {
  cabinet: { id: string; plan: string | null; planStatus: string | null; trialEndsAt: Date | null; createdAt: Date } | null
  state: PlanState
  pro: boolean
}

/**
 * Source de vérité unique pour tous les guards (mur d'essai + verrou Pro).
 * Lit la session NextAuth, charge le cabinet via le singleton prisma, et renvoie
 * { cabinet, state, pro }. Sans cabinet (ex. super-admin) → accès complet, non muré.
 */
export async function requireCabinetPlan(): Promise<CabinetPlanResult> {
  const session = await auth()
  const cabinetId = session?.user?.cabinetId
  if (!cabinetId) return { cabinet: null, state: 'active', pro: true }

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { id: true, plan: true, planStatus: true, trialEndsAt: true, createdAt: true },
  })
  if (!cabinet) return { cabinet: null, state: 'active', pro: true }

  return { cabinet, state: getPlanState(cabinet), pro: hasProAccess(cabinet) }
}

/**
 * Mur d'essai côté API. Renvoie une réponse 402 si l'essai est expiré, sinon null
 * (les cabinets exemptés / en essai / actifs passent). À appeler en tête des
 * handlers de mutation : `const w = await assertNotWalled(); if (w) return w`.
 */
export async function assertNotWalled(): Promise<NextResponse | null> {
  const { state } = await requireCabinetPlan()
  if (state === 'trial_expired') {
    return NextResponse.json({ error: 'trial_expired' }, { status: 402 })
  }
  return null
}

/**
 * Verrou Pro côté API. Renvoie 403 si le cabinet n'a pas l'accès Pro, sinon null.
 * (Les cabinets exemptés et en essai passent ; starter actif / essai expiré non.)
 */
export async function assertPro(): Promise<NextResponse | null> {
  const { pro } = await requireCabinetPlan()
  if (!pro) return NextResponse.json({ error: 'pro_required' }, { status: 403 })
  return null
}
