import { guardPermission } from '@/lib/page-guards'

export default async function AgendaLayout({ children }: { children: React.ReactNode }) {
  await guardPermission('agenda')
  return <>{children}</>
}
