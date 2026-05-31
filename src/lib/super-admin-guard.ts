import 'server-only'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { auth } from '@/auth'

/**
 * Super-admin only : renvoie 403 { error: 'forbidden' } si l'utilisateur n'est
 * pas SUPER_ADMIN, sinon null. À placer en tête des handlers super-admin :
 *
 *   const __sa = await assertSuperAdmin(); if (__sa) return __sa
 *
 * Aligné sur le style de assertOwner() de permissions-server.ts.
 */
export async function assertSuperAdmin(): Promise<NextResponse | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return null
}
