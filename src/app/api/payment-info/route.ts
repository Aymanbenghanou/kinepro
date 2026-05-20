/**
 * GET /api/payment-info
 * Returns active bank accounts that cabinet owners can use to pay the
 * subscription. Notes field is stripped (super-admin internal only).
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const accounts = await prisma.bankAccount.findMany({
    where:  { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true, bankName: true, accountHolder: true,
      rib: true, iban: true, swift: true, city: true,
      isDefault: true,
    },
  })

  return NextResponse.json(accounts)
}
