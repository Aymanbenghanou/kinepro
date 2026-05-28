import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { assertNotWalled } from '@/lib/plan-server'
import { assertOwner } from '@/lib/permissions-server'
import { PERMISSION_KEYS } from '@/lib/permissions'
import bcrypt from 'bcryptjs'

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

// Normalise les permissions reçues : ne garde que les 5 clés connues, force booleans.
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

// ────────────────────────────────────────────────────────────────────────────
// GET — liste UNIFIÉE des membres du cabinet (Praticiens + Secrétaires-Users).
// Avec ?actif=true → uniquement les Praticiens actifs (pour dropdowns agenda).
// ────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const { searchParams } = new URL(request.url)
    const actifOnly = searchParams.get('actif') === 'true'

    const praticiens = await prisma.praticien.findMany({
      where: { cabinetId, ...(actifOnly ? { actif: true } : {}) },
      include: {
        user: { select: { id: true, email: true, isActive: true, role: true, permissions: true, lastLoginAt: true } },
      },
      orderBy: { nom: 'asc' },
    })

    // En mode actifOnly (agenda) : on ne renvoie que les praticiens, pas les secrétaires.
    if (actifOnly) {
      return NextResponse.json(praticiens)
    }

    const secretaires = await prisma.user.findMany({
      where: { cabinetId, role: 'SECRETAIRE', praticienId: null },
      select: {
        id: true, email: true, isActive: true, role: true, permissions: true,
        nom: true, prenom: true, telephone: true, lastLoginAt: true,
      },
      orderBy: { nom: 'asc' },
    })

    const items = [
      ...praticiens.map(p => ({
        id: p.id,
        kind: 'praticien' as const,
        role: 'PRATICIEN' as const,
        nom: p.nom,
        prenom: p.prenom,
        telephone: p.telephone,
        email: p.user?.email ?? p.email ?? null,
        specialite: p.specialite,
        couleur: p.couleur,
        actif: p.actif,
        hasAcces: !!p.user,
        isActive: p.user?.isActive ?? false,
        permissions: (p.user?.permissions as Record<string, unknown>) ?? {},
        userId: p.user?.id ?? null,
        lastLoginAt: p.user?.lastLoginAt ?? null,
      })),
      ...secretaires.map(u => ({
        id: u.id,
        kind: 'secretaire' as const,
        role: 'SECRETAIRE' as const,
        nom: u.nom,
        prenom: u.prenom,
        telephone: u.telephone,
        email: u.email,
        specialite: null,
        couleur: null,
        actif: u.isActive,
        hasAcces: true,
        isActive: u.isActive,
        permissions: (u.permissions as Record<string, unknown>) ?? {},
        userId: u.id,
        lastLoginAt: u.lastLoginAt,
      })),
    ]

    return NextResponse.json(items)
  } catch (error) {
    console.error('[GET /api/praticiens]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST — créer un membre (Praticien ou Secrétaire), avec ou sans accès app.
// ────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const __wall = await assertNotWalled(); if (__wall) return __wall;
  const __own = await assertOwner(); if (__own) return __own;
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { cabinetId } = session.user
    const body = await request.json()
    const role = body.role as string | undefined

    if (role !== 'PRATICIEN' && role !== 'SECRETAIRE') {
      return NextResponse.json({ error: 'role doit être PRATICIEN ou SECRETAIRE' }, { status: 400 })
    }
    if (!body.nom?.trim() || !body.prenom?.trim()) {
      return NextResponse.json({ error: 'Nom et prénom sont obligatoires' }, { status: 400 })
    }
    if (role === 'PRATICIEN' && !body.specialite?.trim()) {
      return NextResponse.json({ error: 'Spécialité requise pour un praticien' }, { status: 400 })
    }

    const acces = !!body.acces
    if (role === 'SECRETAIRE' && !acces) {
      return NextResponse.json({ error: 'Un secrétaire requiert un accès application' }, { status: 400 })
    }
    let permissions = normalizePerms(body.permissions)
    // Garde-fou serveur : un praticien a toujours accès à son agenda.
    if (role === 'PRATICIEN') permissions = { ...permissions, agenda: true }

    // 1) Créer le Praticien si role===PRATICIEN
    let praticienId: string | null = null
    if (role === 'PRATICIEN') {
      const prat = await prisma.praticien.create({
        data: {
          cabinetId,
          nom:        body.nom.trim(),
          prenom:     body.prenom.trim(),
          specialite: body.specialite?.trim() || null,
          telephone:  body.telephone || null,
          couleur:    body.couleur || '#2563EB',
          actif:      true,
        },
      })
      praticienId = prat.id
    }

    // 2) Créer le User si acces===true (toujours le cas pour SECRETAIRE)
    if (acces) {
      const email = String(body.email ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')
      if (!email) {
        return NextResponse.json({ error: 'Email requis pour activer l\'accès' }, { status: 400 })
      }
      if (password.length < 6) {
        return NextResponse.json({ error: 'Mot de passe requis (min. 6 caractères)' }, { status: 400 })
      }
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé par un autre compte' }, { status: 409 })
      }
      const hashed = await bcrypt.hash(password, 12)
      await prisma.user.create({
        data: {
          email,
          password: hashed,
          role,
          nom:    body.nom.trim(),
          prenom: body.prenom.trim(),
          telephone: body.telephone || null,
          cabinetId,
          praticienId,
          permissions,
          isActive: true,
        },
      })
    }

    return NextResponse.json({ ok: true, role, praticienId }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/praticiens]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
