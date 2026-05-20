/**
 * PATCH /api/compte/language  { lang: "fr" | "ar" }
 * Updates the signed-in user's preferred dashboard language.
 * The session JWT picks up the change on the next request (reload).
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { lang } = await req.json()
    if (lang !== 'fr' && lang !== 'ar') {
      return NextResponse.json({ error: 'Langue invalide' }, { status: 400 })
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data:  { preferredLang: lang },
    })
    return NextResponse.json({ ok: true, lang })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
