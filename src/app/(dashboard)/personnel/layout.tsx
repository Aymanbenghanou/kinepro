import { guardOwner } from '@/lib/page-guards'

export default async function PersonnelLayout({ children }: { children: React.ReactNode }) {
  await guardOwner()
  return <>{children}</>
}
