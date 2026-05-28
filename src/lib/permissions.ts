// Permissions granulaires pour les rôles PRATICIEN / SECRETAIRE.
// SUPER_ADMIN et CABINET_OWNER ignorent ce mécanisme (accès total).

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
  if (user.role === 'SUPER_ADMIN' || user.role === 'CABINET_OWNER') return true
  if (user.role === 'PRATICIEN' || user.role === 'SECRETAIRE') {
    return user.permissions?.[key] === true
  }
  return false
}
