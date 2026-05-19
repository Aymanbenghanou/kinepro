'use client'

import { useState, useEffect } from 'react'

interface SiteData {
  cabinet: {
    nom: string; ville: string; adresse: string | null; telephone: string | null
    email: string | null; whatsappNumber: string | null; slug: string | null
    workStartTime: string; workEndTime: string; workingDays: string
    logoUrl: string | null
  }
  site: {
    templateId: string; primaryColor: string; secondaryColor: string
    heroTitle: string | null; heroSubtitle: string | null; heroImageUrl: string | null
    aboutText: string | null; googleMapsEmbed: string | null
  }
  seanceTypes: Array<{ id: string; nom: string; dureeDefaut: number; tarifDefaut: number; couleur: string; description: string | null }>
  praticiens: Array<{ id: string; nom: string; prenom: string; specialite: string | null; couleur: string }>
  testimonials: Array<{ id: string; patientName: string; text: string; rating: number }>
}

export default function SportTemplate({ data }: { data: SiteData }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const bookingUrl = `https://kinepro-omega.vercel.app/booking/${data.cabinet.slug}`

  const navLinks = [
    { label: 'Accueil', id: 'accueil' },
    { label: 'Services', id: 'services' },
    { label: 'Équipe', id: 'equipe' },
    { label: 'Témoignages', id: 'temoignages' },
    { label: 'Contact', id: 'contact' },
  ]

  const stats = [
    { value: '15 ans', label: "d'expérience" },
    { value: '500+', label: 'athlètes traités' },
    { value: '98%', label: 'de récupération' },
  ]

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: '#0F172A',
          borderBottom: scrolled ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
          transition: 'border-color 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => scrollTo('accueil')}
          >
            {data.cabinet.logoUrl ? (
              <img src={data.cabinet.logoUrl} alt={data.cabinet.nom} style={{ height: 40, borderRadius: 10 }} />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 18,
                  boxShadow: '0 0 16px rgba(59,130,246,0.45)',
                }}
              >
                K
              </div>
            )}
            <span style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{data.cabinet.nom}</span>
          </div>

          {/* Desktop links */}
          <ul
            style={{ display: 'flex', listStyle: 'none', gap: 32, margin: 0, padding: 0 }}
            className="sport-desktop-nav"
          >
            {navLinks.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => scrollTo(l.id)}
                  className="sport-nav-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 500,
                    color: '#fff',
                    padding: '4px 0',
                    borderBottom: '2px solid transparent',
                    transition: 'color 0.2s, border-color 0.2s',
                  }}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          {/* CTA + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a
              href={bookingUrl}
              className="sport-cta-btn sport-desktop-nav"
              style={{
                backgroundColor: '#3B82F6',
                color: '#fff',
                padding: '10px 22px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                boxShadow: '0 0 18px rgba(59,130,246,0.45)',
                transition: 'box-shadow 0.2s, background-color 0.2s',
              }}
            >
              Prendre RDV
            </a>
            <button
              className="sport-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                flexDirection: 'column',
                gap: 5,
                padding: 4,
              }}
              aria-label="Menu"
            >
              <span style={{ display: 'block', width: 24, height: 2, backgroundColor: '#3B82F6', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 24, height: 2, backgroundColor: '#3B82F6', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 24, height: 2, backgroundColor: '#3B82F6', borderRadius: 2 }} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            style={{
              backgroundColor: '#0F172A',
              borderTop: '1px solid rgba(59,130,246,0.2)',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {navLinks.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#fff',
                  textAlign: 'left',
                  padding: '6px 0',
                }}
              >
                {l.label}
              </button>
            ))}
            <a
              href={bookingUrl}
              style={{
                backgroundColor: '#3B82F6',
                color: '#fff',
                padding: '12px 22px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
                textAlign: 'center',
                marginTop: 4,
                boxShadow: '0 0 18px rgba(59,130,246,0.45)',
              }}
            >
              Prendre RDV
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section
        id="accueil"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#0F172A',
          paddingTop: 68,
        }}
      >
        {/* Hero background image or decorative elements */}
        {data.site.heroImageUrl ? (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${data.site.heroImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.88)' }} />
          </>
        ) : (
          <>
            {/* Diagonal blue shape top-right */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: 'polygon(60% 0, 100% 0, 100% 100%, 40% 100%)',
                background: 'rgba(59,130,246,0.12)',
              }}
            />
            {/* Blue grid dot pattern */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle, rgba(59,130,246,0.18) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                opacity: 0.6,
              }}
            />
          </>
        )}

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 1200,
            width: '100%',
            margin: '0 auto',
            padding: '80px 24px',
          }}
        >
          <div style={{ maxWidth: 680 }}>
            {/* Glowing badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.4)',
                color: '#60A5FA',
                padding: '8px 18px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 28,
                boxShadow: '0 0 16px rgba(59,130,246,0.2)',
                letterSpacing: 0.5,
              }}
            >
              ⚡ Kinésithérapie &amp; Performance
            </div>

            <h1
              style={{
                fontSize: 60,
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.1,
                textTransform: 'uppercase',
                margin: '0 0 20px',
                letterSpacing: -1,
              }}
              className="sport-hero-h1"
            >
              {data.site.heroTitle ?? data.cabinet.nom}
            </h1>

            <p
              style={{
                fontSize: 19,
                color: '#94A3B8',
                lineHeight: 1.7,
                margin: '0 0 40px',
                maxWidth: 520,
              }}
              className="sport-hero-subtitle"
            >
              {data.site.heroSubtitle ?? `Votre cabinet de kinésithérapie sportive à ${data.cabinet.ville}. Récupérez plus vite, performez mieux.`}
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 56 }}>
              <a
                href={bookingUrl}
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#fff',
                  padding: '15px 36px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 16,
                  textDecoration: 'none',
                  boxShadow: '0 0 28px rgba(59,130,246,0.50)',
                  transition: 'box-shadow 0.2s, background-color 0.2s',
                }}
                className="sport-btn-primary"
              >
                Prendre rendez-vous
              </a>
              <button
                onClick={() => scrollTo('services')}
                style={{
                  backgroundColor: 'transparent',
                  color: '#3B82F6',
                  border: '2px solid #3B82F6',
                  padding: '15px 36px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                className="sport-btn-ghost"
              >
                Nos services
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {stats.map((s) => (
                <div
                  key={s.value}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 12,
                    padding: '16px 24px',
                    minWidth: 120,
                  }}
                >
                  <p style={{ color: '#3B82F6', fontWeight: 800, fontSize: 26, margin: '0 0 4px', lineHeight: 1 }}>
                    {s.value}
                  </p>
                  <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      {data.site.aboutText && (
        <section style={{ backgroundColor: '#0F172A', padding: '64px 24px', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.8 }}>{data.site.aboutText}</p>
          </div>
        </section>
      )}

      {/* ── SERVICES ── */}
      <section id="services" style={{ backgroundColor: '#0F172A', padding: '80px 24px', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#60A5FA',
                padding: '6px 18px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 16,
                letterSpacing: 0.5,
              }}
            >
              Nos prestations
            </span>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: -0.5 }}>
              Services &amp; Soins
            </h2>
            <p style={{ color: '#94A3B8', fontSize: 16, maxWidth: 520 }}>
              Des programmes spécialisés pour sportifs et actifs, conçus pour une récupération maximale.
            </p>
          </div>

          <div className="sport-grid-3">
            {data.seanceTypes.length > 0 ? (
              data.seanceTypes.map((s) => (
                <div
                  key={s.id}
                  className="sport-service-card"
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderTop: '3px solid #3B82F6',
                    borderRadius: 12,
                    padding: '28px 24px',
                    boxShadow: '0 0 20px rgba(59,130,246,0.05)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                >
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>
                    <span style={{ color: '#3B82F6', marginRight: 8 }}>◆</span>
                    {s.nom}
                  </h3>
                  {s.description && (
                    <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7, margin: '0 0 18px' }}>{s.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#60A5FA', fontWeight: 600 }}>⏱ {s.dureeDefaut} min</span>
                    <span style={{ fontSize: 13, color: '#60A5FA', fontWeight: 600 }}>💶 {s.tarifDefaut} €</span>
                  </div>
                </div>
              ))
            ) : (
              [
                { title: 'Rééducation sportive', desc: 'Protocoles de récupération intensifs pour reprendre l\'entraînement rapidement.' },
                { title: 'Prévention des blessures', desc: 'Bilans fonctionnels et programmes de renforcement ciblés.' },
                { title: 'Massages sportifs', desc: 'Techniques de décontraction musculaire pré et post compétition.' },
              ].map((s) => (
                <div
                  key={s.title}
                  className="sport-service-card"
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderTop: '3px solid #3B82F6',
                    borderRadius: 12,
                    padding: '28px 24px',
                    boxShadow: '0 0 20px rgba(59,130,246,0.05)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                >
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>
                    <span style={{ color: '#3B82F6', marginRight: 8 }}>◆</span>
                    {s.title}
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── ÉQUIPE ── */}
      <section id="equipe" style={{ backgroundColor: '#0F172A', padding: '80px 24px', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#60A5FA',
                padding: '6px 18px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 16,
                letterSpacing: 0.5,
              }}
            >
              Notre équipe
            </span>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: -0.5 }}>
              Vos praticiens
            </h2>
          </div>

          <div className="sport-grid-4">
            {data.praticiens.length > 0 ? (
              data.praticiens.map((p) => (
                <div
                  key={p.id}
                  className="sport-team-card"
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 12,
                    padding: '32px 20px',
                    textAlign: 'center',
                    boxShadow: '0 0 20px rgba(59,130,246,0.05)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      border: '2px solid #3B82F6',
                      backgroundColor: 'rgba(59,130,246,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#60A5FA',
                      fontSize: 26,
                      fontWeight: 700,
                      margin: '0 auto 16px',
                      boxShadow: '0 0 16px rgba(59,130,246,0.25)',
                    }}
                  >
                    {p.prenom[0]}{p.nom[0]}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                    {p.prenom} {p.nom}
                  </h3>
                  {p.specialite && (
                    <p style={{ color: '#94A3B8', fontSize: 13 }}>{p.specialite}</p>
                  )}
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94A3B8' }}>
                Informations sur l&apos;équipe bientôt disponibles.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section id="temoignages" style={{ backgroundColor: '#111827', padding: '80px 24px', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#60A5FA',
                padding: '6px 18px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 16,
                letterSpacing: 0.5,
              }}
            >
              Avis patients
            </span>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: -0.5 }}>
              Ce que disent nos patients
            </h2>
          </div>

          <div className="sport-grid-3">
            {data.testimonials.length > 0 ? (
              data.testimonials.map((t) => (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderLeft: '4px solid #3B82F6',
                    borderRadius: 12,
                    padding: '28px 24px',
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ color: i < t.rating ? '#3B82F6' : '#374151', fontSize: 18 }}>★</span>
                    ))}
                  </div>
                  <p style={{ color: '#CBD5E1', fontSize: 15, fontStyle: 'italic', lineHeight: 1.8, margin: '0 0 16px' }}>
                    <span style={{ color: '#3B82F6', fontSize: 20, fontStyle: 'normal', lineHeight: 1 }}>&ldquo;</span>
                    {t.text}
                    <span style={{ color: '#3B82F6', fontSize: 20, fontStyle: 'normal', lineHeight: 1 }}>&rdquo;</span>
                  </p>
                  <p style={{ color: '#60A5FA', fontWeight: 700, fontSize: 14, margin: 0 }}>— {t.patientName}</p>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94A3B8' }}>
                Les avis seront affichés ici.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ backgroundColor: '#0F172A', padding: '80px 24px', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#60A5FA',
                padding: '6px 18px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 16,
                letterSpacing: 0.5,
              }}
            >
              Coordonnées
            </span>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: -0.5 }}>
              Nous trouver
            </h2>
          </div>

          <div className="sport-grid-2">
            {/* Info cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.cabinet.adresse && (
                <div style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: 12,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                }}>
                  <span style={{ fontSize: 22 }}>📍</span>
                  <div>
                    <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px', fontSize: 15 }}>Adresse</p>
                    <p style={{ color: '#94A3B8', margin: 0, fontSize: 14 }}>{data.cabinet.adresse}</p>
                  </div>
                </div>
              )}
              {data.cabinet.telephone && (
                <div style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: 12,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}>
                  <span style={{ fontSize: 22 }}>☎️</span>
                  <div>
                    <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px', fontSize: 15 }}>Téléphone</p>
                    <a href={`tel:${data.cabinet.telephone}`} style={{ color: '#60A5FA', textDecoration: 'none', fontSize: 14 }}>
                      {data.cabinet.telephone}
                    </a>
                  </div>
                </div>
              )}
              {data.cabinet.email && (
                <div style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: 12,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}>
                  <span style={{ fontSize: 22 }}>✉️</span>
                  <div>
                    <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px', fontSize: 15 }}>Email</p>
                    <a href={`mailto:${data.cabinet.email}`} style={{ color: '#60A5FA', textDecoration: 'none', fontSize: 14 }}>
                      {data.cabinet.email}
                    </a>
                  </div>
                </div>
              )}
              <div style={{
                backgroundColor: '#1E293B',
                border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: 12,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}>
                <span style={{ fontSize: 22 }}>🕐</span>
                <div>
                  <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px', fontSize: 15 }}>Horaires</p>
                  <p style={{ color: '#94A3B8', margin: 0, fontSize: 14 }}>
                    {data.cabinet.workingDays} · {data.cabinet.workStartTime} – {data.cabinet.workEndTime}
                  </p>
                </div>
              </div>
              {data.cabinet.whatsappNumber && (
                <a
                  href={`https://wa.me/${data.cabinet.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    backgroundColor: '#25D366',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '16px 24px',
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: 'none',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>💬</span>
                  Contacter sur WhatsApp
                </a>
              )}
              <a
                href={bookingUrl}
                style={{
                  display: 'block',
                  backgroundColor: '#3B82F6',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '16px 24px',
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxShadow: '0 0 24px rgba(59,130,246,0.4)',
                  transition: 'box-shadow 0.2s, background-color 0.2s',
                }}
                className="sport-btn-primary"
              >
                Prendre rendez-vous en ligne
              </a>
            </div>

            {/* Map embed */}
            {data.site.googleMapsEmbed ? (
              <div
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  minHeight: 300,
                  border: '2px solid rgba(59,130,246,0.3)',
                }}
                dangerouslySetInnerHTML={{ __html: data.site.googleMapsEmbed }}
              />
            ) : (
              <div
                style={{
                  backgroundColor: '#1E293B',
                  border: '2px solid rgba(59,130,246,0.3)',
                  borderRadius: 12,
                  minHeight: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                  fontSize: 15,
                }}
              >
                Carte bientôt disponible
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          backgroundColor: '#020617',
          padding: '28px 24px',
          borderTop: '1px solid #3B82F6',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: '0 0 12px rgba(59,130,246,0.4)',
              }}
            >
              K
            </div>
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{data.cabinet.nom}</span>
          </div>
          <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} {data.cabinet.nom} · Propulsé par{' '}
            <span style={{ color: '#3B82F6', fontWeight: 600 }}>KinéPro</span>
          </p>
        </div>
      </footer>

      {/* ── STYLES ── */}
      <style>{`
        * { box-sizing: border-box; }

        .sport-nav-link:hover {
          color: #60A5FA !important;
          border-bottom-color: #3B82F6 !important;
        }
        .sport-cta-btn:hover {
          background-color: #2563EB !important;
          box-shadow: 0 0 28px rgba(59,130,246,0.65) !important;
        }
        .sport-btn-primary:hover {
          background-color: #2563EB !important;
          box-shadow: 0 0 36px rgba(59,130,246,0.65) !important;
        }
        .sport-btn-ghost:hover {
          background-color: rgba(59,130,246,0.10) !important;
        }

        .sport-service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 28px rgba(59,130,246,0.18) !important;
        }
        .sport-team-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 28px rgba(59,130,246,0.25) !important;
        }

        .sport-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .sport-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .sport-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .sport-grid-4 { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .sport-desktop-nav { display: none !important; }
          .sport-hamburger { display: flex !important; }

          .sport-grid-3 { grid-template-columns: 1fr; }
          .sport-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .sport-grid-2 { grid-template-columns: 1fr; }

          .sport-hero-h1 { font-size: 36px !important; letter-spacing: -0.5px !important; }
          .sport-hero-subtitle { font-size: 16px !important; }
        }

        @media (max-width: 480px) {
          .sport-grid-4 { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
