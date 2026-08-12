'use client'

import { createContext, useContext } from 'react'

/**
 * Forme publique de l'objet Cabinet exposé aux composants client.
 * Sous-ensemble des champs Prisma utiles côté UI — pas de planStatus / billing
 * (gérés ailleurs par le layout serveur).
 */
export type CabinetClient = {
  id: string
  nom: string
  adresse: string | null
  ville: string | null
  telephone: string | null
  email: string | null
  whatsappNumber: string | null
  googleReviewLink: string | null
  logoUrl: string | null
} | null

const CabinetContext = createContext<CabinetClient>(null)

/**
 * Provider monté par `(dashboard)/layout.tsx`. La donnée vient d'un
 * `prisma.cabinet.findUnique` côté serveur — pas de re-fetch côté client.
 * Si le layout n'a pas pu charger le cabinet (rare : session sans cabinetId),
 * la valeur reste `null` et les hooks gèrent le fallback.
 */
export function CabinetProvider({
  cabinet,
  children,
}: {
  cabinet: CabinetClient
  children: React.ReactNode
}) {
  return <CabinetContext.Provider value={cabinet}>{children}</CabinetContext.Provider>
}

/** Accès brut au contexte (peut renvoyer null). Préférer les hooks ci-dessous. */
export function useCabinetContext(): CabinetClient {
  return useContext(CabinetContext)
}
