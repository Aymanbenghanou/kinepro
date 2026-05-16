'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Users, CreditCard, MoreHorizontal } from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'

const mainTabs = [
  { icon: LayoutDashboard, label: 'Accueil',     href: '/dashboard'    },
  { icon: Calendar,        label: 'Agenda',       href: '/agenda'       },
  { icon: Users,           label: 'Patients',     href: '/patients'     },
  { icon: CreditCard,      label: 'Facturation',  href: '/facturation'  },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { open } = useSidebar()

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation principale">
      {mainTabs.map(({ icon: Icon, label, href }) => {
        const isActive =
          pathname === href ||
          (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              flex: 1,
              height: '100%',
              textDecoration: 'none',
              color: isActive ? '#2563EB' : '#94A3B8',
              borderRadius: 10,
              transition: 'color 0.15s',
              padding: '6px 4px',
            }}
          >
            <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              lineHeight: 1,
              letterSpacing: 0.1,
            }}>
              {label}
            </span>
            {isActive && (
              <span style={{
                position: 'absolute',
                bottom: 0,
                width: 32,
                height: 2,
                background: '#2563EB',
                borderRadius: '2px 2px 0 0',
              }} />
            )}
          </Link>
        )
      })}

      {/* More → opens full sidebar drawer */}
      <button
        onClick={open}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          flex: 1,
          height: '100%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: '#94A3B8',
          borderRadius: 10,
          padding: '6px 4px',
          transition: 'color 0.15s',
        }}
      >
        <MoreHorizontal size={21} strokeWidth={2} />
        <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1 }}>Plus</span>
      </button>
    </nav>
  )
}
