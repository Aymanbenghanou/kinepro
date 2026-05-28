import { guardOwner } from '@/lib/page-guards'

export default async function ParametresCabinetLayout({ children }: { children: React.ReactNode }) {
  await guardOwner()
  return <>{children}</>
}
