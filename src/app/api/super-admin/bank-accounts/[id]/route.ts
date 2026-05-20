/**
 * PATCH  /api/super-admin/bank-accounts/[id]   → update bank account
 * DELETE /api/super-admin/bank-accounts/[id]   → delete bank account
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

type Context = { params: Promise<{ id: string }> }

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') return null
  return session
}

function normalizeRib(raw: unknown): string {
  return String(raw ?? '').replace(/\s+/g, '').trim()
}

export async function PATCH(req: NextRequest, { params }: Context) {
  if (!await requireSuperAdmin()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}

    if (body.bankName      !== undefined) data.bankName      = String(body.bankName).trim()
    if (body.accountHolder !== undefined) data.accountHolder = String(body.accountHolder).trim()
    if (body.iban          !== undefined) data.iban          = body.iban  ? String(body.iban).trim()  : null
    if (body.swift         !== undefined) data.swift         = body.swift ? String(body.swift).trim() : null
    if (body.city          !== undefined) data.city          = body.city  ? String(body.city).trim()  : null
    if (body.notes         !== undefined) data.notes         = body.notes ? String(body.notes).trim() : null
    if (body.isActive      !== undefined) data.isActive      = !!body.isActive

    if (body.rib !== undefined) {
      const rib = normalizeRib(body.rib)
      if (!/^\d{24}$/.test(rib)) {
        return NextResponse.json({ error: 'RIB invalide — il doit contenir exactement 24 chiffres' }, { status: 400 })
      }
      data.rib = rib
    }

    if (body.isDefault === true) {
      await prisma.bankAccount.updateMany({
        where: { isDefault: true, NOT: { id } },
        data:  { isDefault: false },
      })
      data.isDefault = true
    } else if (body.isDefault === false) {
      data.isDefault = false
    }

    const updated = await prisma.bankAccount.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PATCH bank-account]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  if (!await requireSuperAdmin()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const { id } = await params
    await prisma.bankAccount.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE bank-account]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}
