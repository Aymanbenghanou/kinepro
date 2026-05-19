import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendPushToCabinet } from '@/lib/push'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const payload = await request.json()
    const result  = await sendPushToCabinet(session.user.cabinetId, payload)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[push/send]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
