import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { TOTP, Secret } from 'otpauth'
import { decryptSecret } from '@/lib/crypto'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { token } = await request.json()
    if (!token || token.length !== 6) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
    }

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
