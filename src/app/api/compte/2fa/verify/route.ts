import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { TOTP, Secret } from 'otpauth'
import { decryptSecret } from '@/lib/crypto'
import { validateBody } from '@/lib/validate'
import { verify2faSchema } from '@/lib/schemas/auth'
import { checkRateLimit, authLimiter } from '@/lib/rate-limit'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function POST(request: NextRequest) {
  // Rate-limit défensif : 5 tentatives / 10 min par IP (authLimiter Upstash).
  // L'enrôlement 2FA exige déjà une session valide ; on ajoute ce filet pour
  // éviter qu'un attaquant qui aurait volé une session bruteforce des codes
  // TOTP arbitraires (8M possibilités) dans la fenêtre 30s.
  const rl = await checkRateLimit(request, authLimiter); if (rl) return rl
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const v = await validateBody(request, verify2faSchema)
    if ('error' in v) return v.error
    const { token } = v.data

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.twoFactorSecret) {
      return NextResponse.json({ error: '2FA non initialisé. Recommencez la configuration.' }, { status: 400 })
    }

    const totp = new TOTP({
      issuer:    'KinéPro',
      label:     user.email,
      secret:    Secret.fromBase32(decryptSecret(user.twoFactorSecret)),
      algorithm: 'SHA1',
      digits:    6,
      period:    30,
    })

    const delta = totp.validate({ token, window: 1 })
    if (delta === null) {
      return NextResponse.json({ error: 'Code 2FA invalide ou expiré' }, { status: 400 })
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/compte/2fa/verify]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
