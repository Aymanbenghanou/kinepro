'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Calendar, Users, CreditCard, MoreHorizontal,
  Clock, BarChart3, MessageCircle, Settings, Crown, ChevronRight,
} from 'lucide-react'

const mainTabs = [
  { icon: LayoutDashboard, label: 'Accueil',     href: '/dashboard'    },
  { icon: Calendar,        label: 'Agenda',       href: '/agenda'       },
  { icon: Users,           label: 'Patients',     href: '/patients'     },
  { icon: CreditCard,      label: 'Facturation',  href: '/facturation'  },
]

const moreItems = [
  { icon: Clock,         label: 'Séances',     href: '/seances'     },
  { icon: BarChart3,     label: 'Rapports',    href: '/rapports'    },
  { icon: MessageCircle, label: 'WhatsApp',    href: '/whatsapp'    },
  { icon: Settings,      label: 'Paramètres',  href: '/parametres'  },
  { icon: Crown,         label: 'Abonnement',  href: '/abonnement'  },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  // Close the sheet on route change
  useEffect(() => { setSheetOpen(false) }, [pathname])

  // Close on Escape
  useEffect(() => {
    if (!sheetOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sheetOpen])

  // Lock body scroll while sheet open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [sheetOpen])

  const isMoreActive = moreItems.some(i => pathname.startsWith(i.href))

  return (
    <>
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
                position: 'relative',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, flex: 1, height: '100%',
                textDecoration: 'none',
                color: isActive ? '#2563EB' : '#94A3B8',
                padding: '8px 4px',
                minHeight: 48,
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{
                fontSize: 11, fontWeight: isActive ? 700 : 500,
                lineHeight: 1, letterSpacing: 0.1,
              }}>
                {label}
              </span>
              {/* Active dot indicator under the icon */}
              {isActive && (
                <span style={{
                  position: 'absolute', top: 4,
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#2563EB',
                }} />
              )}
            </Link>
          )
        })}

        {/* Plus → slide-up bottom sheet */}
        <button
          onClick={() => setSheetOpen(true)}
          aria-label="Plus d'options"
          aria-expanded={sheetOpen}
          style={{
            position: 'relative',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 4, flex: 1, height: '100%',
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: isMoreActive || sheetOpen ? '#2563EB' : '#94A3B8',
            padding: '8px 4px',
            minHeight: 48,
          }}
        >
          <MoreHorizontal size={22} strokeWidth={isMoreActive || sheetOpen ? 2.5 : 2} />
          <span style={{ fontSize: 11, fontWeight: isMoreActive || sheetOpen ? 700 : 500, lineHeight: 1 }}>Plus</span>
          {isMoreActive && (
            <span style={{
              position: 'absolute', top: 4,
              width: 5, height: 5, borderRadius: '50%',
              background: '#2563EB',
            }} />
          )}
        </button>
      </nav>

      {/* ── Overlay ── */}
      <div
        className={`bsheet-overlay${sheetOpen ? ' open' : ''}`}
        onClick={() => setSheetOpen(false)}
        aria-hidden={!sheetOpen}
      />

      {/* ── Bottom sheet ── */}
      <div
        className={`bsheet${sheetOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Plus d'options"
        aria-hidden={!sheetOpen}
      >
        <div className="bsheet-handle" aria-hidden="true" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 6px 8px' }}>
          {moreItems.map(({ icon: Icon, label, href }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSheetOpen(false)}
                className="bsheet-item"
                style={isActive ? { background: '#EFF6FF', color: '#2563EB' } : undefined}
              >
                <span
                  className="bsheet-item-icon"
                  style={isActive ? { background: '#2563EB', color: 'white' } : undefined}
                >
                  <Icon size={18} />
                </span>
                <span style={{ flex: 1 }}>{label}</span>
                <ChevronRight size={18} className="bsheet-item-arrow" />
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
