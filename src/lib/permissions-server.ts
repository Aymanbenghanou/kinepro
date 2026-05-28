import 'server-only'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasPermission, type PermissionKey } from '@/lib/permissions'

/**
 * Exige une permission précise. Renvoie 403 { error: 'forbidden' } si le user
 * n'a pas la permission ; sinon { userId, cabinetId, role, permissions }.
 * (CABINET_OWNER / SUPER_ADMIN passent toujours.)
 */
export async function requirePermission(key: PermissionKey) {
  const session = await auth()
  const user = session?.user
  if (!user || (!user.cabinetId && user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const role = user.role as string | undefined
  const permissions = (user as any).permissions as Record<string, unknown> | undefined
  if (!hasPermission({ role, permissions }, key)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return {
    userId: user.id as string,
    cabinetId: user.cabinetId as string | undefined,
    role: role ?? '',
    permissions: permissions ?? {},
  }
}

/**
 * Owner-only : CABINET_OWNER ou SUPER_ADMIN. Renvoie 403 sinon, null sinon.
 * À insérer après assertNotWalled() dans les routes propriétaire-only.
 */
export async function assertOwner(): Promise<NextResponse | null> {
  const session = await auth()
  const role = session?.user?.role
  if (role !== 'CABINET_OWNER' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  return null
}
