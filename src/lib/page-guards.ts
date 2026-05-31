import 'server-only'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'
import { auth } from '@/auth'
import { hasPermission, type PermissionKey } from '@/lib/permissions'

/** Garde de page server : redirige vers /dashboard si la permission n'est pas accordée. */
export async function guardPermission(key: PermissionKey) {
  const session = await auth()
  const role = session?.user?.role
  const permissions = (session?.user as any)?.permissions ?? {}
  if (!hasPermission({ role, permissions }, key)) redirect('/dashboard')
}

/** Garde de page server : owner-only (CABINET_OWNER ou SUPER_ADMIN). */
export async function guardOwner() {
  const session = await auth()
  const role = session?.user?.role
  if (role !== UserRole.CABINET_OWNER && role !== UserRole.SUPER_ADMIN) redirect('/dashboard')
}
