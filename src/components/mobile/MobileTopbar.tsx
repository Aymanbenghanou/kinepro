'use client'

import { useSession } from 'next-auth/react'
import { Bell } from 'lucide-react'

export default function MobileTopbar({ title, subtitle, back }: {
  title: string
  subtitle?: string
  back?: { href: string; label?: string }
}) {
  const { data } = useSession()
  const initials = `${(data?.user as any)?.prenom?.[0] ?? ''}${(data?.user as any)?.nom?.[0] ?? ''}`.toUpperCase() || 'U'

  return (
    <div style={{
      height: 56, background: 'white',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px', position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {back && (
          <a href={back.href} style={{ fontSize: 12, color: '#2563EB', textDecoration: 'none', display: 'block', marginBottom: 1 }}>
            ← {back.label ?? 'Retour'}
          </a>
        )}
        <h1 style={{
          fontSize: 15, fontWeight: 600, color: '#0F172A', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 10, color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0 }}>
        <a href="/m/whatsapp" style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#64748B', textDecoration: 'none',
        }}>
          <Bell size={15} />
        </a>
        <a href="/compte" style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#0D9488', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, textDecoration: 'none',
        }}>
          {initials}
        </a>
      </div>
    </div>
  )
}
