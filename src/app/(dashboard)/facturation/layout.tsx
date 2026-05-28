import { guardPermission } from '@/lib/page-guards'

export default async function FacturationLayout({ children }: { children: React.ReactNode }) {
  await guardPermission('factures')
  return <>{children}</>
}
