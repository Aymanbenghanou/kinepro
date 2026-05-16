import 'next-auth'

declare module 'next-auth' {
  interface User {
    role: string
    cabinetId?: string
    praticienId?: string
    nom: string
    prenom: string
    twoFactorEnabled: boolean
    subscriptionStatus: string
    trialDaysLeft: number | null
  }
  interface Session {
    user: User & {
      id: string
      email: string
      name: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    cabinetId?: string
    praticienId?: string
    nom: string
    prenom: string
    twoFactorEnabled: boolean
    subscriptionStatus: string
    trialDaysLeft: number | null
  }
}
