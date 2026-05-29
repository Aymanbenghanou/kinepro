import { guardOwner } from '@/lib/page-guards'

// Garde owner-only pour TOUTE la section Paramètres (page racine + sous-pages).
export default async function ParametresLayout({ children }: { children: React.ReactNode }) {
  await guardOwner()
  return <>{children}</>
}
