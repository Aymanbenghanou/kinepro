/**
 * GET    /api/exercise-programs/[id] — fetch one program
 * PATCH  /api/exercise-programs/[id] — mark as sent (envoyeWhatsApp, dateEnvoi)
 *                                       or update contenu
 * DELETE /api/exercise-programs/[id]
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

type Context = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Context) {
  const session = await auth()
  if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  const p = await prisma.exerciceProgram.findFirst({
    where: { id, cabinetId: session.user.cabinetId },
    include: { patient: { select: { id: true, nom: true, prenom: true, telephone: true } } },
  })
  if (!p) return NextResponse.json({ error: 'Programme introuvable' }, { status: 404 })
  return NextResponse.json(p)
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const session = await auth()
  if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const data: any = {}
  if (body.contenu !== undefined) data.contenu = body.contenu
  if (body.titre   !== undefined) data.titre   = String(body.titre)
  if (body.markSent === true) {
    data.envoyeWhatsApp = true
    data.dateEnvoi      = new Date()
  }

  const updated = await prisma.exerciceProgram.update({
    where: { id },
    data,
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  const session = await auth()
  if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await params
  await prisma.exerciceProgram.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
