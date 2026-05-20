import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'

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
              include: { subscription: true },
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
          const { TOTP } = await import('otpauth')
          const totp = new TOTP({ secret: user.twoFactorSecret, digits: 6, period: 30 })
          const delta = totp.validate({ token: credentials.totp as string, window: 1 })
          if (delta === null) return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        // Determine subscription status
        const sub = user.cabinet?.subscription
        let trialDaysLeft: number | null = null
        let subscriptionStatus = 'ACTIVE'

        if (sub) {
          if (sub.plan === 'TRIAL') {
            const msLeft = new Date(sub.trialEndsAt).getTime() - Date.now()
            trialDaysLeft = Math.ceil(msLeft / 86_400_000)
            subscriptionStatus = trialDaysLeft > 0 ? 'TRIAL' : 'EXPIRED'
          } else if (sub.plan === 'SUSPENDED') {
            subscriptionStatus = 'SUSPENDED'
          }
        }

        return {
          id:                 user.id,
          email:              user.email,
          name:               `${user.prenom} ${user.nom}`,
          role:               user.role,
          cabinetId:          user.cabinetId ?? undefined,
          praticienId:        user.praticienId ?? undefined,
          nom:                user.nom,
          prenom:             user.prenom,
          twoFactorEnabled:   user.twoFactorEnabled,
          subscriptionStatus,
          trialDaysLeft,
          preferredLang:      (user as any).preferredLang ?? 'fr',
        } as any
      },
    }),
  ],
})
