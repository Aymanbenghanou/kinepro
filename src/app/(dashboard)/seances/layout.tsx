import { guardPermission } from '@/lib/page-guards'

export default async function SeancesLayout({ children }: { children: React.ReactNode }) {
  await guardPermission('dossierMedical')
  return <>{children}</>
}
