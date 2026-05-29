'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Calendar, Users, Clock, CreditCard,
  UserCheck, BarChart3, Settings, Crown, X, QrCode, Globe,
} from 'lucide-react'
import ProfileDropdown from '@/components/ui/ProfileDropdown'
import { useSidebar } from '@/lib/sidebar-context'
import { useCan, useRole } from '@/lib/use-permissions'
import type { PermissionKey } from '@/lib/permissions'

// ─── Nav items ────────────────────────────────────────────────────────────────
// `perm`  : visible seulement si la permission est accordée (OWNER/SUPER_ADMIN OK).
// `owner` : visible seulement pour CABINET_OWNER / SUPER_ADMIN.
type NavItem = { icon: any; label: string; href: string; perm?: PermissionKey; owner?: boolean }
const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Tableau de bord', href: '/dashboard' },
  { icon: Calendar,        label: 'Agenda',           href: '/agenda',      perm: 'agenda' },
  { icon: Users,           label: 'Patients',          href: '/patients',    perm: 'patients' },
  { icon: Clock,           label: 'Séances',           href: '/seances',     perm: 'dossierMedical' },
  { icon: CreditCard,      label: 'Facturation',       href: '/facturation', perm: 'factures' },
  { icon: UserCheck,       label: 'Personnel',         href: '/personnel',   owner: true },
  { icon: BarChart3,       label: 'Rapports',          href: '/rapports',    owner: true },
  { icon: QrCode,          label: 'QR Réception',      href: '/qr/cabinet' },
]

const parametresSubItems = [
  { label: 'Configuration',        href: '/parametres' },
  { label: 'Cabinet',              href: '/parametres/cabinet' },
  { label: 'Types de séances',     href: '/parametres/types-seances' },
  { label: '🌐 Réservation en ligne', href: '/parametres/reservation' },
]

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()
  const can = useCan()
  const role = useRole()
  const isOwnerOrAdmin = role === 'CABINET_OWNER' || role === 'SUPER_ADMIN'
  // Filtre les items selon le rôle / les permissions.
  const visibleNavItems = navItems.filter(it => {
    if (it.owner && !isOwnerOrAdmin) return false
    if (it.perm && !can(it.perm)) return false
    return true
  })
  const visibleParametresSubItems = parametresSubItems.filter(it => {
    // L'item "Cabinet" est owner-only.
    if (it.href === '/parametres/cabinet' && !isOwnerOrAdmin) return false
    return true
  })
  const [pendingFeedbacks, setPendingFeedbacks] = useState(0)

  const fetchPending = useCallback(async () => {
    try {
      const data = await fetch('/api/seances?statut=realisee').then(r => r.json())
      if (Array.isArray(data)) {
        setPendingFeedbacks(data.filter((s: any) => s.scorePatient == null).length)
      }
    } catch {}
  }, [])

  useEffect(() => { fetchPending() }, [fetchPending, pathname])

  // Close sidebar on route change (mobile)
  useEffect(() => { close() }, [pathname, close])

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const isWhatsAppActive   = pathname.startsWith('/whatsapp')
  const isParametresActive = pathname.startsWith('/parametres')
  const isAbonnementActive = pathname.startsWith('/abonnement')

  const [cabinetSlug, setCabinetSlug] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/cabinet').then(r => r.json()).then(d => { if (d.slug && d.bookingEnabled) setCabinetSlug(d.slug) }).catch(() => {})
  }, [])

  return (
    <>
      {/* Backdrop — only visible on mobile when open */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${isOpen ? ' sidebar-mobile-open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Logo + mobile close button */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-blue-800">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-white font-bold text-lg flex-1">KinéPro</span>
          {/* Close button — only meaningful on mobile */}
          <button
            onClick={close}
            className="md:hidden"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none', cursor: 'pointer',
              borderRadius: 8, padding: 6,
              color: 'rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center',
            }}
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <div key={item.href} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`}
                  style={{ flex:1 }}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
                {/* Booking link shortcut next to Agenda */}
                {item.href === '/agenda' && cabinetSlug && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'}/booking/${cabinetSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Page de réservation en ligne"
                    style={{ padding:'6px', borderRadius:8, color:'rgba(147,210,255,0.7)', display:'flex', alignItems:'center', flexShrink:0 }}
                    className="hover:bg-blue-800 hover:text-white transition-colors"
                  >
                    <Globe size={14} />
                  </a>
                )}
              </div>
            )
          })}

          {/* WhatsApp */}
          <Link
            href="/whatsapp"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isWhatsAppActive
                ? 'bg-blue-600 text-white'
                : 'text-blue-200 hover:bg-blue-800 hover:text-white'
            }`}
          >
            <WhatsAppIcon size={18} />
            <span style={{ flex: 1 }}>WhatsApp</span>
            {pendingFeedbacks > 0 && (
              <span style={{
                background: '#25D366', color: 'white',
                fontSize: 11, fontWeight: 700,
                padding: '1px 7px', borderRadius: 999,
                minWidth: 20, textAlign: 'center',
              }}>
                {pendingFeedbacks}
              </span>
            )}
          </Link>

          {/* Paramètres with submenu — OWNER only */}
          {isOwnerOrAdmin && (
            <div>
              <Link
                href="/parametres"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isParametresActive
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <Settings size={18} />
                <span style={{ flex: 1 }}>Paramètres</span>
              </Link>
              {isParametresActive && (
                <div style={{ marginLeft: 14, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {visibleParametresSubItems.map(item => {
                    const isSubActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isSubActive
                            ? 'bg-blue-500 text-white'
                            : 'text-blue-300 hover:bg-blue-800 hover:text-white'
                        }`}
                      >
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Abonnement — OWNER only */}
          {isOwnerOrAdmin && (
            <Link
              href="/abonnement"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isAbonnementActive
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Crown size={18} />
              Abonnement
            </Link>
          )}
        </nav>

        {/* Footer — profile dropdown */}
        <div className="px-3 py-3 border-t border-blue-800">
          <ProfileDropdown direction="up" avatarSize={34} />
        </div>
      </aside>
    </>
  )
}
