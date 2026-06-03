import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'
import { getPlanState, getTrialDaysLeft } from '@/lib/plan'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',        type: 'email'    },
        password: { label: 'Mot de passe', type: 'password' },
        totp:     { label: 'Code 2FA',     type: 'text'     },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            cabinet: {
              select: { plan: true, planStatus: true, trialEndsAt: true, createdAt: true },
            },
          },
        })

        if (!user || !user.isActive) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        )
        if (!valid) return null

        // 2FA check
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!credentials.totp) return null
          const { TOTP, Secret } = await import('otpauth')
          const { decryptSecret } = await import('@/lib/crypto')
          const totp = new TOTP({
            secret: Secret.fromBase32(decryptSecret(user.twoFactorSecret)),
            digits: 6, period: 30,
          })
          const delta = totp.validate({ token: credentials.totp as string, window: 1 })
          if (delta === null) return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        // Determine subscription status — source de vérité = Cabinet (AGENTS.md §7)
        const cab = user.cabinet
        let trialDaysLeft: number | null = null
        let subscriptionStatus = 'ACTIVE'

        if (cab) {
          if (cab.planStatus === 'suspended') {
            subscriptionStatus = 'SUSPENDED'
          } else {
            const state = getPlanState(cab)
            if (state === 'trialing') {
              subscriptionStatus = 'TRIAL'
              trialDaysLeft = getTrialDaysLeft(cab.trialEndsAt)
            } else if (state === 'trial_expired') {
              subscriptionStatus = 'EXPIRED'
            }
          }
        }

        return {
          id:                 user.id,
          email:              user.email,
          name:               `${user.prenom} ${user.nom}`,
          role:               user.role,
          permissions:        (user as any).permissions ?? {},
          cabinetId:          user.cabinetId ?? undefined,
          praticienId:        user.praticienId ?? undefined,
          nom:                user.nom,
          prenom:             user.prenom,
          twoFactorEnabled:   user.twoFactorEnabled,
          subscriptionStatus,
          trialDaysLeft,
        } as any
      },
    }),
  ],
})
