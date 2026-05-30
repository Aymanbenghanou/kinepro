/**
 * GET  /api/super-admin/bank-accounts   → list all bank accounts
 * POST /api/super-admin/bank-accounts   → create new bank account
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertSuperAdmin } from '@/lib/super-admin-guard'

function normalizeRib(raw: unknown): string {
  return String(raw ?? '').replace(/\s+/g, '').trim()
}

export async function GET() {
  const __sa = await assertSuperAdmin(); if (__sa) return __sa
  const accounts = await prisma.bankAccount.findMany({
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const __sa = await assertSuperAdmin(); if (__sa) return __sa
  try {
    const body = await req.json()
    const rib = normalizeRib(body.rib)

    if (!body.bankName || !body.accountHolder || !rib) {
      return NextResponse.json({ error: 'Champs obligatoires manquants (banque, titulaire, RIB)' }, { status: 400 })
    }
    if (!/^\d{24}$/.test(rib)) {
      return NextResponse.json({ error: 'RIB invalide — il doit contenir exactement 24 chiffres' }, { status: 400 })
    }

    // If this is set as default, unset others
    if (body.isDefault) {
      await prisma.bankAccount.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const created = await prisma.bankAccount.create({
      data: {
        bankName:      String(body.bankName).trim(),
        accountHolder: String(body.accountHolder).trim(),
        rib,
        iban:          body.iban ? String(body.iban).trim() : null,
        swift:         body.swift ? String(body.swift).trim() : null,
        city:          body.city ? String(body.city).trim() : null,
        notes:         body.notes ? String(body.notes).trim() : null,
        isActive:      body.isActive !== false,
        isDefault:     !!body.isDefault,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('[POST bank-accounts]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}
