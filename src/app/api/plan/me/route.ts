import { NextResponse } from 'next/server'
import { requireCabinetPlan } from '@/lib/plan-server'

// GET /api/plan/me → { state, pro } pour l'UI (verrou Pro côté affichage).
// La vraie sécurité reste les guards API (assertNotWalled / assertPro).
export async function GET() {
  const { state, pro } = await requireCabinetPlan()
  return NextResponse.json({ state, pro })
}
