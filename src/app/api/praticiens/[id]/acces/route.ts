/**
 * POST  /api/praticiens/[id]/acces  — create or re-activate app access for a praticien
 * DELETE /api/praticiens/[id]/acces — deactivate app access (sets user.isActive = false)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id: praticienId } = await params

    // Verify praticien belongs to this cabinet
    const praticien = await prisma.praticien.findFirst({
      where: { id: praticienId, cabinetId },
      include: { user: true },
    })
    if (!praticien) return NextResponse.json({ error: 'Praticien non trouvé' }, { status: 404 })

    const body = await request.json()
    const { email, password } = body

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email requis pour activer l\'accès' }, { status: 400 })
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Mot de passe requis (min. 6 caractères)' }, { status: 400 })
    }

    // If this praticien already has a user account
    if (praticien.user) {
      // Re-activate it (update email/password if changed)
      const hashed = await bcrypt.hash(password, 12)
      const user = await prisma.user.update({
        where: { id: praticien.user.id },
        data: {
          email:    email.trim().toLowerCase(),
          password: hashed,
          isActive: true,
        },
        select: { id: true, email: true, isActive: true, role: true },
      })
      return NextResponse.json({ user })
    }

    // Check email not already taken
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé par un autre compte' }, { status: 409 })
    }

    // Create new user with EMPLOYEE role linked to this praticien
    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email:      email.trim().toLowerCase(),
        password:   hashed,
        role:       'EMPLOYEE',
        nom:        praticien.nom,
        prenom:     praticien.prenom,
        cabinetId,
        praticienId,
        isActive:   true,
      },
      select: { id: true, email: true, isActive: true, role: true },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/praticiens/[id]/acces]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { id: praticienId } = await params

    const praticien = await prisma.praticien.findFirst({
      where: { id: praticienId, cabinetId },
      include: { user: true },
    })
    if (!praticien) return NextResponse.json({ error: 'Praticien non trouvé' }, { status: 404 })
    if (!praticien.user) return NextResponse.json({ error: 'Aucun compte associé' }, { status: 404 })

    await prisma.user.update({
      where: { id: praticien.user.id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/praticiens/[id]/acces]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
