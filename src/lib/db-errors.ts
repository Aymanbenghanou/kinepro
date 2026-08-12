import 'server-only'
import { Prisma } from '@prisma/client'

/**
 * Détection des erreurs de CONNECTIVITÉ Postgres (Supabase paused, timeout
 * pool, DNS, TLS, réseau, cold-start >5s). À distinguer d'un vrai résultat
 * "pas trouvé" ou d'un bug applicatif : côté API on renvoie alors 503
 * (service_unavailable) au lieu de 500, et côté UI on affiche "réessayez
 * dans quelques instants" au lieu de "dossier introuvable" (qui laisserait
 * croire que le dossier a été supprimé).
 *
 * Motivation directe : le plan Supabase Free tier met les projets en pause
 * après ~7 jours d'inactivité. Le réveil peut dépasser le
 * connectionTimeoutMillis du pool (5s → 15s après ce commit) → le
 * findUnique throw → sans distinction on affiche à tort "dossier introuvable"
 * au patient qui scanne son QR code.
 */

// Codes Prisma "P1xxx" = erreurs de connexion/init côté engine.
// Cf. https://www.prisma.io/docs/orm/reference/error-reference#prismaclientknownrequesterror
const PRISMA_CONNECTIVITY_CODES = new Set([
  'P1001', // Can't reach database server
  'P1002', // Database server has closed the connection / timeout
  'P1008', // Operations timed out
  'P1011', // Error opening a TLS connection
  'P1017', // Server has closed the connection
  'P2024', // Timed out fetching a new connection from the pool
])

// Codes système Node/pg pour ECONNREFUSED, timeout DNS, etc.
const NODE_CONNECTIVITY_CODES = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND',
  'EHOSTUNREACH', 'ENETUNREACH', 'EAI_AGAIN',
])

export function isDbConnectivityError(err: unknown): boolean {
  if (!err) return false

  // Prisma : erreurs d'initialisation (DB unreachable au boot).
  if (err instanceof Prisma.PrismaClientInitializationError) return true

  // Prisma : erreurs "known" avec code P1xxx / P2024 → connectivité.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return PRISMA_CONNECTIVITY_CODES.has(err.code)
  }

  // pg / driver adapter : les erreurs remontent parfois sous forme d'objet
  // avec { code: 'ECONNREFUSED', ... } sans instance Prisma spécifique.
  const anyErr = err as { code?: unknown; message?: unknown }
  if (typeof anyErr.code === 'string' && NODE_CONNECTIVITY_CODES.has(anyErr.code)) return true

  // Dernier filet : message textuel — heuristique volontairement large mais
  // conservative (on ne classe en 503 que ce qui ressemble vraiment à un
  // problème réseau ou pool, pas un bug applicatif).
  if (typeof anyErr.message === 'string') {
    const m = anyErr.message.toLowerCase()
    if (m.includes('connect etimedout') ||
        m.includes('can\'t reach database server') ||
        m.includes('connection pool') ||
        m.includes('tenant or user not found') ||   // signal Supabase paused
        m.includes('supavisor')) {
      return true
    }
  }

  return false
}
