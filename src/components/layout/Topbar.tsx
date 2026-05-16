'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Search, Clock, Users, MessageSquare, CheckCheck, Menu } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import ProfileDropdown from '@/components/ui/ProfileDropdown'
import { useSidebar } from '@/lib/sidebar-context'
// useSession is kept — used inside NotificationBell for subscription status

interface TopbarProps {
  title: string
  subtitle?: string
}

// ─── Notification types ───────────────────────────────────────────────────────
interface Notif {
  id: string
  icon: React.ReactNode
  title: string
  body: string
  color: string
}

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell() {
  const { data: session } = useSession()
  const [open, setOpen]       = useState(false)
  const [notifs, setNotifs]   = useState<Notif[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const built: Notif[] = []

    // 1. Pending feedbacks
    try {
      const seances = await fetch('/api/seances?statut=realisee').then(r => r.json()).catch(() => [])
      if (Array.isArray(seances)) {
        const pending = seances.filter((s: any) => s.scorePatient == null)
        if (pending.length > 0) {
          built.push({
            id: 'feedback',
            icon: <MessageSquare size={15} />,
            title: `${pending.length} séance${pending.length > 1 ? 's' : ''} sans feedback`,
            body: 'Demandez l\'avis de vos patients via WhatsApp.',
            color: '#F59E0B',
          })
        }
      }
    } catch {}

    // 2. Trial / subscription warnings
    try {
      const status   = session?.user?.subscriptionStatus
      const daysLeft = session?.user?.trialDaysLeft

      if (status === 'SUSPENDED') {
        built.push({
          id: 'suspended',
          icon: <Clock size={15} />,
          title: 'Compte suspendu',
          body: 'Votre accès est suspendu. Contactez le support.',
          color: '#DC2626',
        })
      } else if (status === 'TRIAL' && daysLeft !== null && daysLeft !== undefined) {
        if (daysLeft <= 0) {
          built.push({
            id: 'trial-expired',
            icon: <Clock size={15} />,
            title: 'Période d\'essai expirée',
            body: 'Choisissez un plan pour continuer à utiliser KinéPro.',
            color: '#DC2626',
          })
        } else if (daysLeft <= 5) {
          built.push({
            id: 'trial-warning',
            icon: <Clock size={15} />,
            title: `${daysLeft} jour${daysLeft > 1 ? 's' : ''} d'essai restant${daysLeft > 1 ? 's' : ''}`,
            body: 'Activez votre abonnement avant l\'expiration.',
            color: '#D97706',
          })
        }
      }
    } catch {}

    // 3. New patients this week
    try {
      const patients = await fetch('/api/patients').then(r => r.json()).catch(() => [])
      if (Array.isArray(patients)) {
        const cutoff = Date.now() - 7 * 24 * 3600 * 1000
        const recent = patients.filter((p: any) => p.createdAt && new Date(p.createdAt).getTime() >= cutoff)
        if (recent.length > 0) {
          built.push({
            id: 'new-patients',
            icon: <Users size={15} />,
            title: `${recent.length} nouveau${recent.length > 1 ? 'x' : ''} patient${recent.length > 1 ? 's' : ''}`,
            body: `Enregistré${recent.length > 1 ? 's' : ''} ces 7 derniers jours.`,
            color: '#16A34A',
          })
        }
      }
    } catch {}

    setNotifs(built)
    setLoading(false)
  }, [session])

  // Fetch when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications, pathname])

  // Close on outside click / ESC
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

  const unread = notifs.filter(n => !readIds.has(n.id)).length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative', padding: '7px 8px', border: 'none',
          background: open ? '#EFF6FF' : 'transparent',
          borderRadius: 8, cursor: 'pointer',
          color: open ? '#2563EB' : '#64748B',
          display: 'flex', alignItems: 'center',
          transition: 'background 0.12s, color 0.12s',
        }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#F1F5F9'; el.style.color = '#0F172A' }}
        onMouseLeave={e => { if (!open) { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = '#64748B' } }}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            width: 8, height: 8,
            background: '#EF4444', borderRadius: '50%',
            border: '2px solid white',
          }} />
        )}
      </button>

      {/* Dropdown */}
      <div style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        width: 316,
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 10px 32px -4px rgba(0,0,0,0.14)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0)' : 'translateY(-6px)',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        zIndex: 200,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFC',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Notifications</span>
            {unread > 0 && (
              <span style={{
                background: '#2563EB', color: 'white',
                fontSize: 11, fontWeight: 700,
                padding: '1px 7px', borderRadius: 999,
              }}>
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={() => setReadIds(new Set(notifs.map(n => n.id)))}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: '#2563EB', background: 'none',
                border: 'none', cursor: 'pointer', fontWeight: 500,
                padding: '4px 8px', borderRadius: 6,
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EFF6FF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
            >
              <CheckCheck size={13} />
              Tout lire
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              Chargement...
            </div>
          ) : notifs.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔔</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#64748B', margin: 0 }}>Aucune notification</p>
              <p style={{ fontSize: 12, color: '#CBD5E1', margin: '4px 0 0' }}>Tout est à jour !</p>
            </div>
          ) : (
            notifs.map((n, i) => {
              const isRead = readIds.has(n.id)
              return (
                <div
                  key={n.id}
                  onClick={() => setReadIds(s => new Set([...s, n.id]))}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '13px 16px',
                    borderBottom: i < notifs.length - 1 ? '1px solid #F1F5F9' : 'none',
                    background: isRead ? 'white' : '#FAFBFF',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isRead ? 'white' : '#FAFBFF' }}
                >
                  {/* Color dot + icon */}
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: `${n.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: n.color, marginTop: 1,
                  }}>
                    {n.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: isRead ? 500 : 700, color: '#0F172A', margin: 0 }}>
                        {n.title}
                      </p>
                      {!isRead && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: n.color, flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                      {n.body}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
export default function Topbar({ title, subtitle }: TopbarProps) {
  const { toggle } = useSidebar()

  return (
    <div className="topbar">
      {/* Mobile hamburger */}
      <button
        className="topbar-hamburger"
        onClick={toggle}
        aria-label="Ouvrir le menu"
      >
        <Menu size={22} />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search — hidden on mobile */}
        <div className="relative hidden md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
        </div>

        {/* Notification bell */}
        <NotificationBell />

        {/* Avatar dropdown */}
        <ProfileDropdown direction="down" avatarSize={34} />
      </div>
    </div>
  )
}
