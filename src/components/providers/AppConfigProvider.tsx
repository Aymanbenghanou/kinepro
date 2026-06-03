'use client'

import { createContext, useContext } from 'react'

interface AppConfigValue {
  supportWhatsapp: string
}

const Ctx = createContext<AppConfigValue>({ supportWhatsapp: '' })

/**
 * Provider monté au layout racine. Le server component parent récupère la
 * valeur via getAppConfig() (cached) et la passe ici → tous les composants
 * client en dessous accèdent au numéro support sans drilling de prop.
 */
export function AppConfigProvider({
  value,
  children,
}: {
  value: AppConfigValue
  children: React.ReactNode
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Hook client : `const { supportWhatsapp } = useAppConfig()`. */
export function useAppConfig(): AppConfigValue {
  return useContext(Ctx)
}
