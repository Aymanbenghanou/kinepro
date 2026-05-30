import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { publicLimiter, checkRateLimit } from '@/lib/rate-limit'
import { validateBody } from '@/lib/validate'
import { changePasswordSchema } from '@/lib/schemas/auth'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, publicLimiter); if (rl) return rl
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const v = await validateBody(request, changePasswordSchema)
    if ('error' in v) return v.error
    const { currentPassword, newPassword } = v.data

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/compte/password]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
