'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const links = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Tarifs',          href: '#pricing'  },
  { label: 'FAQ',             href: '#faq'      },
  { label: 'Contact',         href: '#footer'   },
]

function SpineLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="11" y="2"  width="6" height="5" rx="1.5" fill="#2563EB" />
      <rect x="11" y="9"  width="6" height="5" rx="1.5" fill="#2563EB" opacity=".85" />
      <rect x="11" y="16" width="6" height="5" rx="1.5" fill="#2563EB" opacity=".7" />
      <rect x="11" y="23" width="6" height="3" rx="1.5" fill="#2563EB" opacity=".5" />
      <rect x="13" y="2"  width="2" height="24" rx="1" fill="#1E3A5F" opacity=".25" />
    </svg>
  )
}

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function smoothTo(href: string) {
    setMenuOpen(false)
    if (href.startsWith('#')) {
      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
      }, 10)
    }
  }

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(255,255,255,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 1px 24px rgba(30,58,95,0.10)' : 'none',
        transition: 'background 0.3s, box-shadow 0.3s',
        borderBottom: scrolled ? '1px solid #E2E8F0' : 'none',
      }}>
        <div style={{
          maxWidth: 1180, margin: '0 auto', padding: '0 20px',
          height: 64, display: 'flex', alignItems: 'center', gap: 24,
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <SpineLogo />
            <span style={{ fontSize: 20, fontWeight: 800, color: scrolled ? '#1E3A5F' : 'white', letterSpacing: '-0.3px' }}>
              Kiné<span style={{ color: '#2563EB' }}>Pro</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="nav-desktop-links" style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
            {links.map(l => (
              <button key={l.href} onClick={() => smoothTo(l.href)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 14px', borderRadius: 8,
                  fontSize: 14, fontWeight: 500,
                  color: scrolled ? '#374151' : 'rgba(255,255,255,0.88)',
                  transition: 'color 0.2s, background 0.2s',
                  minHeight: 36,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = scrolled ? '#F1F5F9' : 'rgba(255,255,255,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="nav-desktop-ctas" style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
            <Link href="/login" style={{
              padding: '9px 18px', borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: 'none',
              border: scrolled ? '1.5px solid #2563EB' : '1.5px solid rgba(255,255,255,0.6)',
              color: scrolled ? '#2563EB' : 'white',
              transition: 'all 0.2s', background: 'transparent',
            }}>
              Se connecter
            </Link>
            <Link href="/register" style={{
              padding: '9px 20px', borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: 'none',
              background: scrolled ? '#2563EB' : 'white',
              color: scrolled ? 'white' : '#1E3A5F',
              boxShadow: '0 2px 12px rgba(37,99,235,0.25)',
              transition: 'all 0.2s',
            }}>
              Essai gratuit 7 jours
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="nav-hamburger"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 8, borderRadius: 8,
              color: scrolled ? '#1E3A5F' : 'white',
              marginLeft: 'auto', display: 'none',
              minWidth: 40, minHeight: 40,
              alignItems: 'center', justifyContent: 'center',
            }}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {menuOpen ? (
                <>
                  <line x1="4" y1="4"   x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18" y1="4"  x2="4"  y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </>
              ) : (
                <>
                  <line x1="3" y1="6"  x2="19" y2="6"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Full-screen mobile menu overlay */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: '#0F172A',
          display: 'flex', flexDirection: 'column',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
        className="nav-mobile-overlay"
      >
        {/* Overlay header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 64, borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          <Link href="/" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <SpineLogo />
            <span style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
              Kiné<span style={{ color: '#2563EB' }}>Pro</span>
            </span>
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
              borderRadius: 10, padding: 10, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 44, minHeight: 44,
            }}
            aria-label="Fermer le menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="4" y1="4"   x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="4"  x2="4"  y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Overlay nav links */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 32 }}>
            {links.map((l, i) => (
              <button
                key={l.href}
                onClick={() => smoothTo(l.href)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', padding: '16px 12px', borderRadius: 12,
                  fontSize: 22, fontWeight: 700, color: 'white',
                  transition: 'background 0.15s, transform 0.15s',
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? 'translateX(0)' : 'translateX(-20px)',
                  transitionDelay: `${0.05 + i * 0.04}s`,
                  display: 'flex', alignItems: 'center', gap: 12,
                  minHeight: 56,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                <span style={{ color: '#2563EB', fontSize: 14, fontWeight: 600, width: 24, textAlign: 'center' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {l.label}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', textAlign: 'center',
                padding: '16px', borderRadius: 12,
                border: '1.5px solid rgba(255,255,255,0.25)',
                color: 'white', fontWeight: 600, fontSize: 16, textDecoration: 'none',
                minHeight: 54,
                lineHeight: '22px',
              }}
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', textAlign: 'center',
                padding: '16px', borderRadius: 12,
                background: '#2563EB', color: 'white',
                fontWeight: 700, fontSize: 16, textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
                minHeight: 54,
                lineHeight: '22px',
              }}
            >
              🚀 Commencer gratuitement — 7 jours offerts
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ Support FR/عربي
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop-links { display: none !important; }
          .nav-desktop-ctas  { display: none !important; }
          .nav-hamburger     { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nav-mobile-overlay { display: none !important; }
        }
      `}</style>
    </>
  )
}
