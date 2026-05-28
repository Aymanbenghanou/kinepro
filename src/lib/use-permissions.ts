'use client'

import { useSession } from 'next-auth/react'
import { hasPermission, type PermissionKey } from '@/lib/permissions'

/**
 * Hook client : renvoie une fonction `can(key)` qui réutilise hasPermission
 * sur la session courante. CABINET_OWNER et SUPER_ADMIN renvoient toujours true.
 */
export function useCan(): (key: PermissionKey) => boolean {
  const { data: session } = useSession()
  const role = session?.user?.role
  const permissions = (session?.user as any)?.permissions ?? {}
  return (key) => hasPermission({ role, permissions }, key)
}

/** Hook client : renvoie le rôle courant (string | undefined). */
export function useRole(): string | undefined {
  const { data: session } = useSession()
  return session?.user?.role
}
