import imageCompression from 'browser-image-compression'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Helpers d'upload côté NAVIGATEUR (documents/images patients vers Supabase Storage).
 * Ne contient aucun secret : utilise uniquement la clé anon publique + un ticket
 * d'upload signé délivré par le serveur. NE PAS y mettre la service_role.
 */

// Client Supabase navigateur (anon) — initialisé à la demande pour ne pas casser
// le rendu/SSR si les variables NEXT_PUBLIC ne sont pas encore configurées.
let _sb: SupabaseClient | null = null
export function supabaseBrowser(): SupabaseClient {
  if (!_sb) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) throw new Error('Supabase non configuré (variables NEXT_PUBLIC manquantes).')
    _sb = createClient(url, anon, { auth: { persistSession: false } })
  }
  return _sb
}

// Compression intelligente PAR TYPE de document :
// - radio / IRM : haute qualité, détail préservé (diagnostic)
// - autres images : compression forte (gain stockage/bande passante max)
// - PDF / non-images : aucune compression (intact)
const COMPRESS_PROFILES: Record<string, { maxSizeMB: number; maxWidthOrHeight: number; initialQuality: number }> = {
  radio:   { maxSizeMB: 1.5, maxWidthOrHeight: 2500, initialQuality: 0.92 },
  default: { maxSizeMB: 0.6, maxWidthOrHeight: 1800, initialQuality: 0.7 },
}

export async function maybeCompress(file: File, docType: string): Promise<File> {
  if (!file.type.startsWith('image/')) return file // PDF & co. → intacts
  const profile = COMPRESS_PROFILES[docType] ?? COMPRESS_PROFILES.default
  try {
    return await imageCompression(file, {
      maxSizeMB: profile.maxSizeMB,
      maxWidthOrHeight: profile.maxWidthOrHeight,
      initialQuality: profile.initialQuality,
      fileType: 'image/webp',
      useWebWorker: true,
    })
  } catch {
    return file // en cas d'échec de compression, on envoie l'original
  }
}

/**
 * Upload complet d'un fichier vers Supabase Storage via ticket signé.
 * 1) compresse selon le type → 2) demande un ticket au serveur →
 * 3) upload direct vers Supabase → renvoie { path, size } à enregistrer en base.
 */
export async function uploadPatientFile(
  patientId: string,
  file: File,
  docType: string,
): Promise<{ path: string; size: number }> {
  const { STORAGE_BUCKET } = await import('@/lib/storage')

  const fileToUpload = await maybeCompress(file, docType)
  const ext = fileToUpload.type === 'image/webp'
    ? 'webp'
    : (file.name.split('.').pop() || 'bin')

  const ticketRes = await fetch(`/api/patients/${patientId}/documents/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: `doc.${ext}`,
      contentType: fileToUpload.type || 'application/octet-stream',
    }),
  })
  if (!ticketRes.ok) throw new Error("Impossible d'obtenir l'autorisation d'upload")
  const { path, token } = await ticketRes.json()

  const { error } = await supabaseBrowser()
    .storage.from(STORAGE_BUCKET)
    .uploadToSignedUrl(path, token, fileToUpload, { contentType: fileToUpload.type })
  if (error) throw new Error(error.message || "Erreur lors de l'upload")

  return { path, size: fileToUpload.size }
}
