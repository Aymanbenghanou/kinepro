import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

export async function getSession() {
  return await auth()
}

/** Returns cabinetId or throws a 401 NextResponse. Use inside route handlers. */
export async function requireCabinet(): Promise<{ cabinetId: string; role: string; userId: string }> {
  const session = await auth()
  if (!session?.user) throw unauthorized()
  // SUPER_ADMIN has no cabinetId but can act on any cabinet
  if (session.user.role === UserRole.SUPER_ADMIN) {
    return { cabinetId: '__SUPER_ADMIN__', role: UserRole.SUPER_ADMIN, userId: session.user.id }
  }
  if (!session.user.cabinetId) throw unauthorized()
  return { cabinetId: session.user.cabinetId, role: session.user.role, userId: session.user.id }
}

export function unauthorized() {
  return new Error('__UNAUTHORIZED__')
}

export function unauthResponse() {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
}
