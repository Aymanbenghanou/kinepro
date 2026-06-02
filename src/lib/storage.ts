/**
 * Constantes de stockage partagées (client + serveur).
 * Ne DOIT contenir aucun secret — ce module peut être importé côté navigateur.
 */

// Bucket Supabase Storage (PRIVÉ) où sont rangés les documents patients.
// À créer dans le dashboard Supabase : Storage → New bucket → "patient-documents" → Private.
export const STORAGE_BUCKET = 'patient-documents'
