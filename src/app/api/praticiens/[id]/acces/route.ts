/**
 * POST   /api/praticiens/[id]/acces — créer ou réinitialiser l'accès app.
 * DELETE /api/praticiens/[id]/acces — désactiver l'accès (isActive=false).
 * id peut être un Praticien.id ou un User.id (cas SECRETAIRE).
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { assertNotWalled } from '@/lib/plan-server'
import { assertOwner } from '@/lib/permissions-server'
import { PRESETS, PERMISSION_KEYS } from '@/lib/permissions'
import bcrypt from 'bcryptjs'
import { validateBody } from '@/lib/validate'
import { accesPraticienSchema } from '@/lib/schemas/staff'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

function normalizePerms(input: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>
    for (const k of PERMISSION_KEYS) out[k] = obj[k] === true
  } else {
    for (const k of PERMISSION_KEYS) out[k] = false
  }
  return out
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __own = await assertOwner(); if (__own) return __own;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    const v = await validateBody(request, accesPraticienSchema)
    if ('error' in v) return v.error
    const body = v.data
    const email = body.email.trim().toLowerCase()
    const password = body.password

    // 1) id = Praticien ?
    const praticien = await prisma.praticien.findFirst({
      where: { id, cabinetId },
      include: { user: true },
    })

    if (praticien) {
      const hashed = await bcrypt.hash(password, 12)
      if (praticien.user) {
        // Réactivation : maj email + password + isActive ; permissions inchangées sauf si fournies.
        const data: Record<string, unknown> = { email, password: hashed, isActive: true }
        if (body.permissions !== undefined) {
          const perms = normalizePerms(body.permissions)
          perms.agenda = true
          data.permissions = perms
        }
        const user = await prisma.user.update({
          where: { id: praticien.user.id }, data,
          select: { id: true, email: true, isActive: true, role: true, permissions: true },
        })
        return NextResponse.json({ user })
      }
      // Pas de user encore → création avec rôle PRATICIEN et presets par défaut.
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé par un autre compte' }, { status: 409 })
      }
      const permissions = { ...PRESETS.PRATICIEN, ...normalizePerms(body.permissions), agenda: true }
      const user = await prisma.user.create({
        data: {
          email, password: hashed,
          role: 'PRATICIEN',
          nom: praticien.nom, prenom: praticien.prenom,
          telephone: praticien.telephone,
          cabinetId,
          praticienId: praticien.id,
          permissions,
          isActive: true,
        },
        select: { id: true, email: true, isActive: true, role: true, permissions: true },
      })
      return NextResponse.json({ user }, { status: 201 })
    }

    // 2) id = User SECRETAIRE ? → reset password + réactivation.
    const user = await prisma.user.findFirst({ where: { id, cabinetId, role: 'SECRETAIRE' } })
    if (user) {
      const hashed = await bcrypt.hash(password, 12)
      const data: Record<string, unknown> = { email, password: hashed, isActive: true }
      if (body.permissions !== undefined) data.permissions = normalizePerms(body.permissions)
      const updated = await prisma.user.update({
        where: { id: user.id }, data,
        select: { id: true, email: true, isActive: true, role: true, permissions: true },
      })
      return NextResponse.json({ user: updated })
    }

    return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 })
  } catch (error) {
    console.error('[POST /api/praticiens/[id]/acces]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __own = await assertOwner(); if (__own) return __own;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id } = await params

    const praticien = await prisma.praticien.findFirst({
      where: { id, cabinetId },
      include: { user: true },
    })
    if (praticien) {
      if (!praticien.user) return NextResponse.json({ error: 'Aucun compte associé' }, { status: 404 })
      await prisma.user.update({ where: { id: praticien.user.id }, data: { isActive: false } })
      return NextResponse.json({ success: true })
    }

    const user = await prisma.user.findFirst({ where: { id, cabinetId, role: 'SECRETAIRE' } })
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { isActive: false } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 })
  } catch (error) {
    console.error('[DELETE /api/praticiens/[id]/acces]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
