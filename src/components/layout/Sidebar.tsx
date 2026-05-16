'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Calendar, Users, Clock, CreditCard,
  UserCheck, BarChart3, Settings, LogOut, User,
  Crown, Shield, ChevronUp, Building2,
} from 'lucide-react'

// ─── Avatar color system ──────────────────────────────────────────────────────
const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#DC2626', '#16A34A']

function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0]
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', href: '/dashboard' },
  { icon: Calendar,        label: 'Agenda',           href: '/agenda' },
  { icon: Users,           label: 'Patients',          href: '/patients' },
  { icon: Clock,           label: 'Séances',           href: '/seances' },
  { icon: CreditCard,      label: 'Facturation',       href: '/facturation' },
  { icon: UserCheck,       label: 'Personnel',         href: '/personnel' },
  { icon: BarChart3,       label: 'Rapports',          href: '/rapports' },
]

const parametresSubItems = [
  { label: 'Configuration',    href: '/parametres' },
  { label: 'Cabinet',          href: '/parametres/cabinet' },
  { label: 'Types de séances', href: '/parametres/types-seances' },
]

// ─── WhatsApp icon ────────────────────────────────────────────────────────────
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ─── Profile dropdown component ───────────────────────────────────────────────
function ProfileDropdown() {
  const router = useRouter()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const user      = session?.user
  const fullName  = user ? `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() : 'Utilisateur'
  const email     = user?.email ?? ''
  const role      = user?.role ?? 'CABINET_OWNER'
  const has2FA    = user?.twoFactorEnabled ?? false
  const initials  = fullName
    ? `${(user?.prenom?.[0] ?? '').toUpperCase()}${(user?.nom?.[0] ?? '').toUpperCase()}`
    : 'KP'
  const avatarColor = getAvatarColor(fullName)
  const roleLabel = role === 'CABINET_OWNER' ? 'Propriétaire' : role === 'EMPLOYEE' ? 'Employé' : 'Super Admin'
  const roleBadgeColor = role === 'CABINET_OWNER'
    ? { bg: '#DBEAFE', color: '#1D4ED8' }
    : role === 'EMPLOYEE'
    ? { bg: '#DCFCE7', color: '#15803D' }
    : { bg: '#EDE9FE', color: '#7C3AED' }

  // Close on click outside
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', onDown)
      document.addEventListener('keydown', onKey)
    }
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function handleLogout() {
    setOpen(false)
    await signOut({ redirect: false })
    router.push('/login')
  }

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  const menuItem = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    opts?: { red?: boolean; badge?: React.ReactNode }
  ) => (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px', border: 'none', background: 'transparent',
        cursor: 'pointer', textAlign: 'left', borderRadius: 8,
        transition: 'background 0.12s',
        color: opts?.red ? '#DC2626' : '#374151',
        fontSize: 13, fontWeight: 500,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = opts?.red ? '#FEF2F2' : '#F8FAFC' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <span style={{ color: opts?.red ? '#DC2626' : '#64748B', flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {opts?.badge}
    </button>
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* ── Dropdown (opens upward) ── */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: 0, right: 0,
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.08), 0 -10px 32px -4px rgba(0,0,0,0.14)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        // CSS-only animation
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0)' : 'translateY(6px)',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        zIndex: 50,
        minWidth: 220,
      }}>
        {/* Header — user info */}
        <div style={{ padding: '14px 14px 12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: avatarColor, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 0 3px ${avatarColor}30`,
            }}>
              <span style={{ color: 'white', fontSize: 14, fontWeight: 800 }}>{initials}</span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fullName}
              </p>
              <p style={{ fontSize: 11, color: '#64748B', margin: '1px 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {email}
              </p>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                background: roleBadgeColor.bg, color: roleBadgeColor.color,
              }}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div style={{ padding: '6px 6px' }}>
          {menuItem(<User size={15} />, 'Mon profil', () => go('/compte'))}
          {menuItem(<Building2 size={15} />, 'Profil cabinet', () => go('/parametres/cabinet'))}
          {menuItem(<Settings size={15} />, 'Paramètres', () => go('/parametres'))}
        </div>

        <div style={{ height: 1, background: '#E2E8F0', margin: '0 14px' }} />

        {/* 2FA row */}
        <div style={{ padding: '6px 6px' }}>
          {menuItem(
            <Shield size={15} />,
            'Sécurité 2FA',
            () => go('/compte'),
            {
              badge: has2FA
                ? <span style={{ fontSize: 10, background: '#DCFCE7', color: '#15803D', padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>Activé</span>
                : <span style={{ fontSize: 10, background: '#FEF3C7', color: '#B45309', padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>⚠ Inactif</span>,
            }
          )}
        </div>

        <div style={{ height: 1, background: '#E2E8F0', margin: '0 14px' }} />

        {/* Logout */}
        <div style={{ padding: '6px 6px' }}>
          {menuItem(<LogOut size={15} />, 'Déconnexion', handleLogout, { red: true })}
        </div>
      </div>

      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        title={`${fullName} — cliquer pour le menu`}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', border: 'none',
          background: open ? 'rgba(255,255,255,0.12)' : 'transparent',
          borderRadius: 10, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: avatarColor, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 0 2px ${avatarColor}50`,
          transition: 'transform 0.15s, box-shadow 0.15s',
          transform: open ? 'scale(1.05)' : 'scale(1)',
        }}>
          <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>{initials}</span>
        </div>

        {/* Name + role */}
        <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
          <p style={{ color: 'white', fontSize: 12, fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {fullName || 'Utilisateur'}
          </p>
          <p style={{ color: '#93C5FD', fontSize: 11, margin: 0 }}>{roleLabel}</p>
        </div>

        {/* Chevron */}
        <ChevronUp
          size={14}
          style={{
            color: '#93C5FD', flexShrink: 0,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        />
      </button>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname()
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

  const isWhatsAppActive   = pathname.startsWith('/whatsapp')
  const isParametresActive = pathname.startsWith('/parametres')
  const isAbonnementActive = pathname.startsWith('/abonnement')

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-blue-800">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">K</span>
        </div>
        <span className="text-white font-bold text-lg">KinéPro</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
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

        {/* Paramètres with submenu */}
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
              {parametresSubItems.map(item => {
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

        {/* Abonnement */}
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
      </nav>

      {/* Footer — profile dropdown */}
      <div className="px-3 py-3 border-t border-blue-800">
        <ProfileDropdown />
      </div>
    </aside>
  )
}
