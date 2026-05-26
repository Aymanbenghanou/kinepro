import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { DEFAULT_SEANCE_TYPES } from '@/lib/default-seance-types'

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : 'Erreur inconnue'
}

export async function POST(request: NextRequest) {
  try {
    const { cabinet: cab, admin } = await request.json()

    if (!cab?.nom?.trim() || !admin?.email?.trim() || !admin?.password) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Check email uniqueness
    const exists = await prisma.user.findUnique({ where: { email: admin.email } })
    if (exists) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(admin.password, 12)
    const trialEndsAt    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create cabinet + subscription + user + default session types in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const newCabinet = await tx.cabinet.create({
        data: {
          nom:          cab.nom.trim(),
          ville:        cab.ville?.trim() || null,
          telephone:    cab.telephone?.trim() || null,
          email:        cab.email?.trim() || null,
          // Billing : démarrage en essai 7 jours
          plan:         'trial',
          planStatus:   'trialing',
          trialEndsAt,
          billingCycle: null,
        },
      })

      await tx.subscription.create({
        data: {
          cabinetId:  newCabinet.id,
          plan:       'TRIAL',
          trialEndsAt,
        },
      })

      const newUser = await tx.user.create({
        data: {
          email:     admin.email.trim(),
          password:  hashedPassword,
          role:      'CABINET_OWNER',
          nom:       admin.nom?.trim() || '',
          prenom:    admin.prenom?.trim() || '',
          cabinetId: newCabinet.id,
        },
      })

      // Set ownerId on the cabinet
      await tx.cabinet.update({
        where: { id: newCabinet.id },
        data:  { ownerId: newUser.id },
      })

      // Seed 10 default session types for the new cabinet
      await tx.seanceType.createMany({
        data: DEFAULT_SEANCE_TYPES.map(t => ({
          ...t,
          cabinetId: newCabinet.id,
          isDefault: true,
          actif:     true,
        })),
      })

      return { cabinetId: newCabinet.id, userId: newUser.id }
    })

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/auth/register]', error)
    return NextResponse.json({ error: errMsg(error) }, { status: 500 })
  }
}
