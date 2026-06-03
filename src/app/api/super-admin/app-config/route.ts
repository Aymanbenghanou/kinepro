import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertSuperAdmin } from '@/lib/super-admin-guard'
import { validateBody } from '@/lib/validate'
import { updateAppConfigSchema } from '@/lib/schemas/app-config'
import { getAppConfig, invalidateAppConfigCache } from '@/lib/app-config'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

/**
 * Normalise le numéro WhatsApp vers E.164 (+212XXXXXXXXX) :
 *   - "0649911970"       → "+212649911970"
 *   - "+212649911970"    → "+212649911970"
 *   - "212 649 91 19 70" → "+212649911970"
 * Retourne null si format inexploitable (ne matche pas E.164 final).
 */
function normalizeWhatsapp(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Garde le + initial s'il existe, retire tous les autres non-chiffres.
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/[^\d]/g, '')
  let candidate: string
  if (hasPlus) {
    candidate = '+' + digits
  } else if (digits.startsWith('0') && digits.length === 10) {
    // Format MA local : 0XXXXXXXXX → +212XXXXXXXXX
    candidate = '+212' + digits.slice(1)
  } else if (digits.startsWith('212')) {
    candidate = '+' + digits
  } else {
    candidate = '+' + digits
  }
  // E.164 : + suivi de 7 à 15 chiffres, ne commence pas par 0 après le +.
  if (!/^\+[1-9]\d{6,14}$/.test(candidate)) return null
  return candidate
}

export async function GET() {
  const sa = await assertSuperAdmin(); if (sa) return sa
  try {
    const config = await getAppConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('[GET /api/super-admin/app-config]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const sa = await assertSuperAdmin(); if (sa) return sa

  const v = await validateBody(request, updateAppConfigSchema)
  if ('error' in v) return v.error

  const normalized = normalizeWhatsapp(v.data.supportWhatsapp)
  if (!normalized) {
    return NextResponse.json(
      { error: 'invalid_phone', message: 'Numéro invalide. Format attendu : 0649911970 ou +212649911970.' },
      { status: 400 }
    )
  }

  try {
    const updated = await prisma.appConfig.update({
      where: { id: 'singleton' },
      data:  { supportWhatsapp: normalized },
    })
    invalidateAppConfigCache()
    return NextResponse.json({ supportWhatsapp: updated.supportWhatsapp })
  } catch (error) {
    console.error('[PATCH /api/super-admin/app-config]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
