import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { STORAGE_BUCKET } from '@/lib/storage'

/**
 * Accès serveur à Supabase Storage (documents patients).
 *
 * - Utilise la clé `service_role` : NE DOIT JAMAIS être importé dans un composant
 *   client ('use client'). Le marqueur `server-only` fait échouer le build si c'est le cas.
 * - Bucket PRIVÉ : on ne sert jamais d'URL publique. L'upload passe par un ticket
 *   signé (createUploadTicket) et la lecture par une URL signée temporaire (createDownloadUrl).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let _admin: SupabaseClient | null = null

function admin(): SupabaseClient {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'Supabase Storage non configuré : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.',
    )
  }
  if (!_admin) {
    _admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _admin
}

/**
 * Construit un chemin de stockage cloisonné par cabinet puis par patient.
 * Le préfixe `cabinetId/patientId/` garantit l'isolement multi-cabinet.
 */
export function buildStoragePath(cabinetId: string, patientId: string, filename: string): string {
  const ext = (filename.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${cabinetId}/${patientId}/${randomUUID()}.${ext}`
}

/**
 * Délivre un ticket d'upload signé pour un chemin donné.
 * Le navigateur uploadera directement vers Supabase avec ce ticket
 * (le fichier ne transite pas par le serveur Next → pas de limite de body Vercel).
 */
export async function createUploadTicket(path: string): Promise<{ path: string; token: string }> {
  const { data, error } = await admin().storage.from(STORAGE_BUCKET).createSignedUploadUrl(path)
  if (error) throw error
  return { path: data.path, token: data.token }
}

/** URL de lecture signée, valable `expiresIn` secondes (1h par défaut). */
export async function createDownloadUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await admin().storage.from(STORAGE_BUCKET).createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

/** Supprime un fichier du bucket. */
export async function removeObject(path: string): Promise<void> {
  const { error } = await admin().storage.from(STORAGE_BUCKET).remove([path])
  if (error) throw error
}

/**
 * Suppression bulk best-effort de plusieurs paths. Renvoie le détail des
 * fichiers droppés + des erreurs (jamais throw — le caller continue).
 * Utilisé pour le cleanup Storage lors de la suppression d'un patient.
 */
export async function removeObjects(paths: string[]): Promise<{ deleted: string[]; errors: string[] }> {
  if (paths.length === 0) return { deleted: [], errors: [] }
  const { data, error } = await admin().storage.from(STORAGE_BUCKET).remove(paths)
  if (error) return { deleted: [], errors: [error.message] }
  return { deleted: (data ?? []).map(f => f.name), errors: [] }
}
