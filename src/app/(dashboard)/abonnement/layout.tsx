import { guardOwner } from '@/lib/page-guards'

export default async function AbonnementLayout({ children }: { children: React.ReactNode }) {
  await guardOwner()
  return <>{children}</>
}
