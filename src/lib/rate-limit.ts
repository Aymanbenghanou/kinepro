import 'server-only'
import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiting via Upstash Redis. Trois budgets selon la sensibilité de la
 * route. Utilisation dans un handler :
 *
 *   const rl = await checkRateLimit(req, publicLimiter); if (rl) return rl
 *
 * En dev local sans UPSTASH_* configuré, checkRateLimit log un warning une
 * fois et laisse passer (return null). En prod les env vars sont garanties.
 */

// ─── Redis client (singleton) ────────────────────────────────────────────────
// Redis.fromEnv() lit UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
// On instancie paresseusement (au premier appel) pour ne pas crasher au boot
// si les vars manquent en dev.

let _redis: Redis | null = null
function getRedis(): Redis | null {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  _redis = Redis.fromEnv()
  return _redis
}

// ─── Limiters ────────────────────────────────────────────────────────────────
// Trois budgets. Les Ratelimit sont instanciés paresseusement aussi pour ne
// pas faire crasher l'import en dev.

let _authLimiter: Ratelimit | null = null
let _publicLimiter: Ratelimit | null = null
let _strictLimiter: Ratelimit | null = null

function buildLimiter(tokens: number, windowSec: number, prefix: string): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, `${windowSec} s`),
    prefix,
    analytics: false,
  })
}

/** 5 req / 10 min — register, password, autres surfaces d'auth. */
export function authLimiter(): Ratelimit | null {
  if (_authLimiter) return _authLimiter
  _authLimiter = buildLimiter(5, 600, 'rl:auth')
  return _authLimiter
}

/** 20 req / 1 min — booking, feedback, checkin, patient-public, scan, etc. */
export function publicLimiter(): Ratelimit | null {
  if (_publicLimiter) return _publicLimiter
  _publicLimiter = buildLimiter(20, 60, 'rl:public')
  return _publicLimiter
}

/** 3 req / 1 h — actions très sensibles (reset password, etc.). Réservé. */
export function strictLimiter(): Ratelimit | null {
  if (_strictLimiter) return _strictLimiter
  _strictLimiter = buildLimiter(3, 3600, 'rl:strict')
  return _strictLimiter
}

// ─── Helper ──────────────────────────────────────────────────────────────────

let warnedMissingEnv = false

function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

/**
 * Vérifie le budget rate-limit pour la requête. Renvoie :
 * - null si l'appel est autorisé (handler peut continuer)
 * - NextResponse 429 { error: 'too_many_requests', retryAfter } si dépassé,
 *   avec header Retry-After (secondes).
 *
 * Si les env vars Upstash sont absentes (dev local), warn une fois et passe.
 */
export async function checkRateLimit(
  req: Request,
  limiterOrFactory: Ratelimit | (() => Ratelimit | null) | null,
): Promise<NextResponse | null> {
  const limiter = typeof limiterOrFactory === 'function'
    ? limiterOrFactory()
    : limiterOrFactory

  if (!limiter) {
    if (!warnedMissingEnv) {
      console.warn(
        '[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN missing — rate limiting disabled. ' +
        'Set both in Vercel for production protection.',
      )
      warnedMissingEnv = true
    }
    return null
  }

  const ip = getClientIp(req)
  const { success, reset } = await limiter.limit(ip)
  if (success) return null

  // reset = timestamp ms du prochain slot libre
  const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
  return NextResponse.json(
    { error: 'too_many_requests', retryAfter: retryAfterSec },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
  )
}
