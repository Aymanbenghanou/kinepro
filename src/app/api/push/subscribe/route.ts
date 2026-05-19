import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id: userId, cabinetId } = session.user

  try {
    const sub = await request.json()
    const { endpoint, keys } = sub

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 })
    }

    // Upsert subscription (endpoint is unique)
    await prisma.pushSubscription.upsert({
      where:  { endpoint },
      update: { userId, cabinetId, p256dh: keys.p256dh, auth: keys.auth },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId, cabinetId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[push/subscribe]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
