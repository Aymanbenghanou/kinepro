import 'server-only'
import { NextResponse } from 'next/server'
import type { ZodSchema } from 'zod'

/**
 * Valide le body d'une requête contre un schema zod. Style aligné sur les
 * autres helpers (assertOwner, assertNotWalled) :
 *
 *   const v = await validateBody(req, schema)
 *   if ('error' in v) return v.error
 *   const body = v.data  // typé selon le schema
 *
 * - Si req.json() échoue (body absent / mal formé) → 400 invalid_json.
 * - Si schema.safeParse échoue → 400 invalid_body avec liste des issues.
 * - Sinon → { data }.
 */
export async function validateBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return {
      error: NextResponse.json(
        { error: 'invalid_json' },
        { status: 400 },
      ),
    }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return {
      error: NextResponse.json(
        {
          error: 'invalid_body',
          issues: result.error.issues.map(i => ({
            path: i.path,
            message: i.message,
          })),
        },
        { status: 400 },
      ),
    }
  }

  return { data: result.data }
}
