import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // DATABASE_URL must be the PgBouncer TRANSACTION pooler (port 6543).
  // Setting max: 1 is critical for Vercel serverless — each function instance
  // holds at most one Postgres connection, which PgBouncer then multiplexes.
  // Without this cap the warm-lambda pool grows unbounded and hits Supabase's
  // 15-connection free-tier limit.
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 30_000,    // release idle connection after 30 s
    // 15 s pour couvrir un cold-start Supabase Free tier après pause
    // (le projet peut être en pause après ~7j d'inactivité et le réveil
    // dépasse largement 5 s).
    connectionTimeoutMillis: 15_000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Singleton: reuse existing client across hot-reloads in dev,
// create fresh in production (each serverless invocation gets its own).
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
