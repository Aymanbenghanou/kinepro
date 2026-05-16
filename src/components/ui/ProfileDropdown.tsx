'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Settings, Shield, LogOut, Building2, ChevronUp, ChevronDown } from 'lucide-react'

// ─── Avatar color system ──────────────────────────────────────────────────────
const AVATAR_COLORS = ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#16A34A']

export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0]
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export function getInitials(prenom?: string | null, nom?: string | null): string {
  return `${(prenom?.[0] ?? '').toUpperCase()}${(nom?.[0] ?? '').toUpperCase()}` || 'KP'
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ProfileDropdownProps {
  /** 'up' → dropdown rises above trigger (sidebar footer); 'down' → drops below (topbar) */
  direction?: 'up' | 'down'
  /** Size of the avatar circle in px */
  avatarSize?: number
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProfileDropdown({
  direction = 'down',
  avatarSize = 34,
}: ProfileDropdownProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const user     = session?.user
  const prenom   = user?.prenom ?? ''
  const nom      = user?.nom    ?? ''
  const fullName = `${prenom} ${nom}`.trim() || 'Utilisateur'
  const email    = user?.email  ?? ''
  const role     = user?.role   ?? 'CABINET_OWNER'
  const has2FA   = user?.twoFactorEnabled ?? false

  const initials    = getInitials(prenom, nom)
  const avatarColor = getAvatarColor(fullName)

  const roleLabel = role === 'CABINET_OWNER'
    ? 'Propriétaire'
    : role === 'EMPLOYEE'
    ? 'Employé'
    : 'Super Admin'

  const roleBadge =
    role === 'CABINET_OWNER' ? { bg: '#DBEAFE', color: '#1D4ED8' } :
    role === 'EMPLOYEE'      ? { bg: '#DCFCE7', color: '#15803D' } :
                               { bg: '#EDE9FE', color: '#7C3AED' }

  // ── Close on outside click / ESC ────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
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

  // ── Menu item helper ─────────────────────────────────────────────────────────
  function MenuItem({
    icon,
    label,
    onClick,
    red,
    badge,
  }: {
    icon: React.ReactNode
    label: string
    onClick: () => void
    red?: boolean
    badge?: React.ReactNode
  }) {
    const [hovered, setHovered] = useState(false)
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 14px',
          border: 'none',
          background: hovered ? (red ? '#FEF2F2' : '#F8FAFC') : 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          borderRadius: 8,
          transition: 'background 0.12s',
          color: red ? '#DC2626' : '#374151',
          fontSize: 13, fontWeight: 500,
        }}
      >
        <span style={{ color: red ? '#DC2626' : (hovered ? '#2563EB' : '#64748B'), flexShrink: 0, display: 'flex', transition: 'color 0.12s' }}>
          {icon}
        </span>
        <span style={{ flex: 1 }}>{label}</span>
        {badge}
      </button>
    )
  }

  // ── Dropdown position ────────────────────────────────────────────────────────
  const dropdownPos: React.CSSProperties = direction === 'up'
    ? { bottom: 'calc(100% + 8px)', left: 0, right: 0 }
    : { top: 'calc(100% + 8px)', right: 0, minWidth: 240 }

  const dropdownShadow = direction === 'up'
    ? '0 -4px 6px -1px rgba(0,0,0,0.08), 0 -10px 32px -4px rgba(0,0,0,0.14)'
    : '0 4px 6px -1px rgba(0,0,0,0.08), 0 10px 32px -4px rgba(0,0,0,0.14)'

  const slideFrom = direction === 'up' ? 'translateY(6px)' : 'translateY(-6px)'

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* ── Dropdown panel ────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        ...dropdownPos,
        background: 'white',
        borderRadius: 12,
        boxShadow: dropdownShadow,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0)' : slideFrom,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        zIndex: 300,
      }}>
        {/* Header — user card */}
        <div style={{
          padding: '14px 14px 12px',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: avatarColor, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 0 3px ${avatarColor}28`,
            }}>
              <span style={{ color: 'white', fontSize: 14, fontWeight: 800 }}>{initials}</span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{
                fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {fullName}
              </p>
              <p style={{
                fontSize: 11, color: '#64748B', margin: '1px 0 5px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {email}
              </p>
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '2px 7px', borderRadius: 999,
                background: roleBadge.bg, color: roleBadge.color,
              }}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div style={{ padding: '6px 6px' }}>
          <MenuItem icon={<User size={15} />}      label="Mon profil"     onClick={() => go('/compte')} />
          <MenuItem icon={<Building2 size={15} />} label="Profil cabinet" onClick={() => go('/parametres/cabinet')} />
          <MenuItem icon={<Settings size={15} />}  label="Paramètres"     onClick={() => go('/parametres')} />
        </div>

        <div style={{ height: 1, background: '#E2E8F0', margin: '0 14px' }} />

        <div style={{ padding: '6px 6px' }}>
          <MenuItem
            icon={<Shield size={15} />}
            label="Sécurité 2FA"
            onClick={() => go('/compte')}
            badge={
              has2FA
                ? <span style={{ fontSize: 10, background: '#DCFCE7', color: '#15803D', padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>Activé</span>
                : <span style={{ fontSize: 10, background: '#FEF3C7', color: '#B45309', padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>⚠ Inactif</span>
            }
          />
        </div>

        <div style={{ height: 1, background: '#E2E8F0', margin: '0 14px' }} />

        <div style={{ padding: '6px 6px' }}>
          <MenuItem icon={<LogOut size={15} />} label="Déconnexion" onClick={handleLogout} red />
        </div>
      </div>

      {/* ── Trigger: avatar circle + (in sidebar) name + chevron ─────────── */}
      {direction === 'up' ? (
        /* Sidebar trigger — full-width row */
        <button
          onClick={() => setOpen(v => !v)}
          title={`${fullName} — menu profil`}
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
          <div style={{
            width: avatarSize, height: avatarSize, borderRadius: '50%',
            background: avatarColor, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 0 2px ${avatarColor}50`,
            transition: 'transform 0.15s',
            transform: open ? 'scale(1.06)' : 'scale(1)',
          }}>
            <span style={{ color: 'white', fontSize: Math.round(avatarSize * 0.35), fontWeight: 800 }}>{initials}</span>
          </div>
          <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
            <p style={{ color: 'white', fontSize: 12, fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {fullName}
            </p>
            <p style={{ color: '#93C5FD', fontSize: 11, margin: 0 }}>{roleLabel}</p>
          </div>
          <ChevronUp size={14} style={{ color: '#93C5FD', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(180deg)' }} />
        </button>
      ) : (
        /* Topbar trigger — avatar circle only */
        <button
          onClick={() => setOpen(v => !v)}
          title={`${fullName} — menu profil`}
          style={{
            width: avatarSize, height: avatarSize, borderRadius: '50%',
            background: avatarColor, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer', padding: 0,
            boxShadow: open
              ? `0 0 0 3px ${avatarColor}50`
              : `0 0 0 2px ${avatarColor}35`,
            transform: open ? 'scale(1.06)' : 'scale(1)',
            transition: 'box-shadow 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = open ? 'scale(1.06)' : 'scale(1)' }}
        >
          <span style={{ color: 'white', fontSize: Math.round(avatarSize * 0.35), fontWeight: 800 }}>{initials}</span>
          {/* Small chevron indicator */}
          <span style={{
            position: 'absolute',
            bottom: -2, right: -2,
            width: 14, height: 14,
            background: 'white', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}>
            {open
              ? <ChevronUp size={9} style={{ color: '#64748B' }} />
              : <ChevronDown size={9} style={{ color: '#64748B' }} />}
          </span>
        </button>
      )}
    </div>
  )
}
