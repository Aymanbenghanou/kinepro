// Permissions granulaires pour les rôles PRATICIEN / SECRETAIRE.
// SUPER_ADMIN et CABINET_OWNER ignorent ce mécanisme (accès total).
import { UserRole } from '@prisma/client'

export type PermissionKey =
  | 'agenda'
  | 'patients'
  | 'dossierMedical'
  | 'programmesEtDocs'
  | 'factures'

export const PERMISSION_KEYS: PermissionKey[] = [
  'agenda', 'patients', 'dossierMedical', 'programmesEtDocs', 'factures',
]

export const PRESETS = {
  PRATICIEN:  { agenda: true, patients: true, dossierMedical: true,  programmesEtDocs: true,  factures: false },
  SECRETAIRE: { agenda: true, patients: true, dossierMedical: false, programmesEtDocs: false, factures: true  },
} as const

export function hasPermission(
  user: { role?: string | null; permissions?: Record<string, unknown> | null },
  key: PermissionKey,
): boolean {
  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.CABINET_OWNER) return true
  if (user.role === UserRole.PRATICIEN || user.role === UserRole.SECRETAIRE) {
    return user.permissions?.[key] === true
  }
  return false
}
