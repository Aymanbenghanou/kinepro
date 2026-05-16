import type { NextAuthConfig } from 'next-auth'

/**
 * Lightweight auth config used ONLY in middleware (Edge runtime).
 * No bcrypt, no Prisma — just JWT callbacks to populate the session.
 * The full authorize logic lives in src/auth.ts (Node.js runtime only).
 */
export const authConfig: NextAuthConfig = {
  providers: [], // providers are added in auth.ts

  session: { strategy: 'jwt' },

  callbacks: {
    authorized({ auth }) {
      // Called by the middleware: just check if a session token exists
      return !!auth
    },
    async jwt({ token, user }) {
      if (user) {
        token.role               = (user as any).role
        token.cabinetId          = (user as any).cabinetId
        token.praticienId        = (user as any).praticienId
        token.nom                = (user as any).nom
        token.prenom             = (user as any).prenom
        token.twoFactorEnabled   = (user as any).twoFactorEnabled
        token.subscriptionStatus = (user as any).subscriptionStatus
        token.trialDaysLeft      = (user as any).trialDaysLeft
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id                = token.sub as string
        session.user.role              = token.role as string
        session.user.cabinetId         = token.cabinetId as string | undefined
        session.user.praticienId       = token.praticienId as string | undefined
        session.user.nom               = token.nom as string
        session.user.prenom            = token.prenom as string
        session.user.subscriptionStatus = token.subscriptionStatus as string
        session.user.trialDaysLeft     = token.trialDaysLeft as number | null
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },
}
