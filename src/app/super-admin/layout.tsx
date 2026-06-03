import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/auth'

async function SuperAdminLogout() {
  return (
    <form action={async () => {
      'use server'
      await signOut({ redirectTo: '/login' })
    }}>
      <button type="submit" style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', borderRadius: 10, border: 'none',
        background: 'transparent', color: '#A5B4FC', cursor: 'pointer',
        fontSize: 13, fontWeight: 500, textAlign: 'left',
      }}>
        <span>🚪</span> Déconnexion
      </button>
    </form>
  )
}

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const navItems = [
    { href: '/super-admin',            label: 'Vue d\'ensemble', icon: '📊' },
    { href: '/super-admin/cabinets',   label: 'Cabinets',        icon: '🏥' },
    { href: '/super-admin/parametres', label: 'Paramètres',      icon: '⚙️' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0F0A2E' }}>
      {/* Dark purple sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: '#1E1B4B',
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, background: '#4F46E5',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>K</span>
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>KinéPro</p>
            <p style={{ color: '#818CF8', fontSize: 11, margin: 0 }}>Super Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              color: '#C7D2FE', fontSize: 13, fontWeight: 500,
              textDecoration: 'none', marginBottom: 4,
              transition: 'background 0.15s',
            }}
            className="super-admin-nav-link">
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding: '10px 14px', marginBottom: 4 }}>
            <p style={{ color: 'white', fontSize: 12, fontWeight: 600, margin: 0 }}>
              {session.user.prenom} {session.user.nom}
            </p>
            <p style={{ color: '#818CF8', fontSize: 11, margin: 0 }}>Super Administrateur</p>
          </div>
          <SuperAdminLogout />
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: '#F8FAFC' }}>
        {children}
      </main>

      <style>{`
        .super-admin-nav-link:hover { background: rgba(99,102,241,0.2) !important; color: white !important; }
      `}</style>
    </div>
  )
}
