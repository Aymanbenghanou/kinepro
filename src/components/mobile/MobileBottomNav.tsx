'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Calendar, Users, CreditCard, MoreHorizontal, X,
  Clock, BarChart3, MessageCircle, UserCheck, Settings, User, LogOut, ChevronRight,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const TABS = [
  { icon: LayoutDashboard, label: 'Accueil',     href: '/m/dashboard',   match: ['/m/dashboard'] },
  { icon: Calendar,        label: 'Agenda',       href: '/m/agenda',      match: ['/m/agenda'] },
  { icon: Users,           label: 'Patients',     href: '/m/patients',    match: ['/m/patients'] },
  { icon: CreditCard,      label: 'Facturation',  href: '/m/facturation', match: ['/m/facturation'] },
]

const PLUS_ITEMS = [
  { icon: Clock,         label: 'Séances',     href: '/m/seances'    },
  { icon: MessageCircle, label: 'WhatsApp',    href: '/m/whatsapp'   },
  { icon: BarChart3,     label: 'Rapports',    href: '/rapports'     },
  { icon: UserCheck,     label: 'Personnel',   href: '/personnel'    },
  { icon: Settings,      label: 'Paramètres',  href: '/parametres'   },
  { icon: User,          label: 'Mon compte',  href: '/compte'       },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => { setSheetOpen(false) }, [pathname])
  useEffect(() => {
    if (!sheetOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sheetOpen])
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [sheetOpen])

  const isPlusActive = PLUS_ITEMS.some(i => pathname.startsWith(i.href))

  return (
    <>
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'stretch',
        boxShadow: '0 -4px 20px rgba(15,23,42,0.06)',
        zIndex: 100,
      }}>
        {TABS.map(({ icon: Icon, label, href, match }) => {
          const active = match.some(m => pathname === m || (m !== '/m/dashboard' && pathname.startsWith(m + '/')))
          return (
            <Link key={href} href={href}
              style={{
                position: 'relative', flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4,
                textDecoration: 'none',
                color: active ? '#2563EB' : '#94A3B8',
                padding: '8px 4px', minHeight: 48,
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, lineHeight: 1 }}>{label}</span>
              {active && <span style={{ position: 'absolute', top: 4, width: 5, height: 5, borderRadius: '50%', background: '#2563EB' }} />}
            </Link>
          )
        })}
        <button
          onClick={() => setSheetOpen(o => !o)}
          aria-label={sheetOpen ? 'Fermer' : 'Plus'}
          style={{
            position: 'relative', flex: 1,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: isPlusActive || sheetOpen ? '#2563EB' : '#94A3B8',
            padding: '8px 4px', minHeight: 48,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {sheetOpen ? <X size={22} strokeWidth={2.5} /> : <MoreHorizontal size={22} strokeWidth={isPlusActive ? 2.5 : 2} />}
          <span style={{ fontSize: 11, fontWeight: isPlusActive || sheetOpen ? 700 : 500, lineHeight: 1 }}>
            {sheetOpen ? 'Fermer' : 'Plus'}
          </span>
          {isPlusActive && !sheetOpen && <span style={{ position: 'absolute', top: 4, width: 5, height: 5, borderRadius: '50%', background: '#2563EB' }} />}
        </button>
      </nav>

      {/* Overlay */}
      <div
        onClick={() => setSheetOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 220,
          background: 'rgba(15,23,42,0.5)',
          opacity: sheetOpen ? 1 : 0,
          pointerEvents: sheetOpen ? 'auto' : 'none',
          transition: 'opacity 0.22s ease',
        }}
      />

      {/* Sheet */}
      <div
        role="dialog" aria-modal={sheetOpen} aria-hidden={!sheetOpen}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 230,
          background: 'white',
          borderRadius: '20px 20px 0 0',
          padding: `10px 8px calc(20px + env(safe-area-inset-bottom, 0px))`,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
          transform: `translateY(${sheetOpen ? '0' : '100%'})`,
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '75dvh', overflowY: 'auto',
        }}
      >
        <div style={{ width: 40, height: 4, background: '#CBD5E1', borderRadius: 999, margin: '6px auto 14px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 6px 8px' }}>
          {PLUS_ITEMS.map(({ icon: Icon, label, href }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setSheetOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 12,
                  textDecoration: 'none', minHeight: 56,
                  background: isActive ? '#EFF6FF' : 'transparent',
                  color:      isActive ? '#2563EB' : '#0F172A',
                  fontSize: 15, fontWeight: 600,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  background: isActive ? '#2563EB' : '#EFF6FF',
                  color:      isActive ? 'white'    : '#2563EB',
                }}>
                  <Icon size={18} />
                </span>
                <span style={{ flex: 1 }}>{label}</span>
                <ChevronRight size={18} color="#CBD5E1" />
              </Link>
            )
          })}
          <div style={{ height: 1, background: '#F1F5F9', margin: '8px 16px' }} />
          <button
            onClick={() => { setSheetOpen(false); signOut({ callbackUrl: '/login' }) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 12,
              border: 'none', background: 'transparent', cursor: 'pointer',
              minHeight: 56, fontSize: 15, fontWeight: 600,
              color: '#DC2626', textAlign: 'left',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#FEE2E2', color: '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <LogOut size={18} />
            </span>
            <span style={{ flex: 1 }}>Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  )
}
