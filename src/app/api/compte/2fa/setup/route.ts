import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { TOTP, Secret } from 'otpauth'
import QRCode from 'qrcode'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Generate a new TOTP secret
    const secret = new Secret({ size: 20 })
    const secretBase32 = secret.base32

    // Build OTP Auth URL
    const totp = new TOTP({
      issuer: 'KinéPro',
      label:  session.user.email ?? session.user.id,
      secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    })
    const otpAuthUrl = totp.toString()

    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(otpAuthUrl)

    // Store secret temporarily (we'll confirm it in /verify)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: secretBase32 },
    })

    return NextResponse.json({ qrCode, secret: secretBase32 })
  } catch (error) {
    console.error('[POST /api/compte/2fa/setup]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
