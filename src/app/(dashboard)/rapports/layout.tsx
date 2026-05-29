import { guardOwner } from '@/lib/page-guards'

export default async function RapportsLayout({ children }: { children: React.ReactNode }) {
  await guardOwner()
  return <>{children}</>
}
