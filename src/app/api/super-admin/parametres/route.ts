import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertSuperAdmin } from '@/lib/super-admin-guard'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

async function getOrCreateConfig() {
  const existing = await prisma.systemConfig.findUnique({ where: { id: 'global' } })
  if (existing) return existing
  return prisma.systemConfig.create({ data: { id: 'global' } })
}

export async function GET() {
  const __sa = await assertSuperAdmin(); if (__sa) return __sa
  try {
    const config = await getOrCreateConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('[GET /api/super-admin/parametres]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const __sa = await assertSuperAdmin(); if (__sa) return __sa
  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.whatsappNumber !== undefined) data.whatsappNumber = body.whatsappNumber
    if (body.rib            !== undefined) data.rib            = body.rib
    if (body.banque         !== undefined) data.banque         = body.banque
    if (body.titulaire      !== undefined) data.titulaire      = body.titulaire
    if (body.prixMensuel    !== undefined) data.prixMensuel    = parseFloat(body.prixMensuel)
    if (body.prixAnnuel     !== undefined) data.prixAnnuel     = parseFloat(body.prixAnnuel)

    const config = await prisma.systemConfig.upsert({
      where:  { id: 'global' },
      update: data,
      create: { id: 'global', ...data },
    })
    return NextResponse.json(config)
  } catch (error) {
    console.error('[PATCH /api/super-admin/parametres]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
