import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { assertNotWalled } from '@/lib/plan-server'
import { assertOwner } from '@/lib/permissions-server'
import { PERMISSION_KEYS } from '@/lib/permissions'
import { validateBody } from '@/lib/validate'
import { updatePraticienSchema } from '@/lib/schemas/staff'

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

// PATCH — édite un membre. id peut être un Praticien.id OU un User.id (secrétaire).
export async function PATCH(
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

    const v = await validateBody(request, updatePraticienSchema)
    if ('error' in v) return v.error
    const body = v.data

    // INTERDIT : changer le rôle d'un membre existant.
    if (body.role) {
      const targetRole = body.role
      const praticienCheck = await prisma.praticien.findFirst({ where: { id, cabinetId } })
      const currentRole = praticienCheck ? 'PRATICIEN' : 'SECRETAIRE'
      if (targetRole !== currentRole) {
        return NextResponse.json({ error: 'role_change_not_allowed' }, { status: 400 })
      }
    }

    // 1) Cible Praticien ?
    const praticien = await prisma.praticien.findFirst({
      where: { id, cabinetId },
      include: { user: true },
    })

    if (praticien) {
      const pratData: Record<string, unknown> = {}
      if (body.nom        !== undefined) pratData.nom        = String(body.nom).trim()
      if (body.prenom     !== undefined) pratData.prenom     = String(body.prenom).trim()
      if (body.specialite !== undefined) pratData.specialite = body.specialite ? String(body.specialite).trim() : null
      if (body.telephone  !== undefined) pratData.telephone  = body.telephone || null
      if (body.couleur    !== undefined) pratData.couleur    = body.couleur
      if (body.actif      !== undefined) pratData.actif      = Boolean(body.actif)

      await prisma.praticien.update({ where: { id }, data: pratData })

      // Si User lié, on synchronise identité + permissions (garde-fou agenda=true).
      if (praticien.user) {
        const userData: Record<string, unknown> = {}
        if (body.nom       !== undefined) userData.nom       = String(body.nom).trim()
        if (body.prenom    !== undefined) userData.prenom    = String(body.prenom).trim()
        if (body.telephone !== undefined) userData.telephone = body.telephone || null
        if (body.permissions !== undefined) {
          const perms = normalizePerms(body.permissions)
          perms.agenda = true // garde-fou serveur : praticien → agenda toujours actif
          userData.permissions = perms
        }
        if (Object.keys(userData).length) {
          await prisma.user.update({ where: { id: praticien.user.id }, data: userData })
        }
      }

      const refreshed = await prisma.praticien.findUnique({
        where: { id },
        include: { user: { select: { id: true, email: true, isActive: true, role: true, permissions: true, lastLoginAt: true } } },
      })
      return NextResponse.json(refreshed)
    }

    // 2) Cible User SECRETAIRE ?
    const user = await prisma.user.findFirst({
      where: { id, cabinetId, role: 'SECRETAIRE' },
    })
    if (user) {
      const data: Record<string, unknown> = {}
      if (body.nom       !== undefined) data.nom       = String(body.nom).trim()
      if (body.prenom    !== undefined) data.prenom    = String(body.prenom).trim()
      if (body.telephone !== undefined) data.telephone = body.telephone || null
      if (body.permissions !== undefined) data.permissions = normalizePerms(body.permissions)
      const updated = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, nom: true, prenom: true, telephone: true, email: true, role: true, isActive: true, permissions: true, lastLoginAt: true },
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 })
  } catch (error) {
    console.error('[PATCH /api/praticiens/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

// PUT — alias rétrocompatible
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __own = await assertOwner(); if (__own) return __own;
  return PATCH(request, { params })
}

// DELETE — supprime un membre. id = Praticien.id OU User.id (secrétaire).
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
      // Soft-delete Praticien (actif=false) + hard-delete User lié si présent.
      if (praticien.user) {
        await prisma.pushSubscription.deleteMany({ where: { userId: praticien.user.id } })
        await prisma.user.delete({ where: { id: praticien.user.id } })
      }
      await prisma.praticien.update({ where: { id }, data: { actif: false } })
      return NextResponse.json({ success: true, kind: 'praticien' })
    }

    const user = await prisma.user.findFirst({ where: { id, cabinetId, role: 'SECRETAIRE' } })
    if (user) {
      await prisma.pushSubscription.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
      return NextResponse.json({ success: true, kind: 'secretaire' })
    }

    return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 })
  } catch (error) {
    console.error('[DELETE /api/praticiens/[id]]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
