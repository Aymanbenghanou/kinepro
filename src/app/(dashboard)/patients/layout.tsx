import { guardPermission } from '@/lib/page-guards'

export default async function PatientsLayout({ children }: { children: React.ReactNode }) {
  await guardPermission('patients')
  return <>{children}</>
}
