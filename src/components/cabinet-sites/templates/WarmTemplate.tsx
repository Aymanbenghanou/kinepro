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

export default function WarmTemplate({ data }: { data: SiteData }) {
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
          backgroundColor: '#ffffff',
          boxShadow: scrolled ? '0 4px 24px rgba(13,148,136,0.12)' : 'none',
          borderRadius: scrolled ? '0 0 16px 16px' : '0',
          transition: 'box-shadow 0.3s ease, border-radius 0.3s ease',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => scrollTo('accueil')}>
            {data.cabinet.logoUrl ? (
              <img src={data.cabinet.logoUrl} alt={data.cabinet.nom} style={{ height: 40, borderRadius: 10 }} />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#0D9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                K
              </div>
            )}
            <span style={{ fontWeight: 700, fontSize: 18, color: '#1C1917' }}>{data.cabinet.nom}</span>
          </div>

          {/* Desktop links */}
          <ul
            style={{
              display: 'flex',
              listStyle: 'none',
              gap: 32,
              margin: 0,
              padding: 0,
            }}
            className="warm-desktop-nav"
          >
            {navLinks.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => scrollTo(l.id)}
                  className="warm-nav-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 500,
                    color: '#1C1917',
                    padding: '4px 0',
                    transition: 'color 0.2s',
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
              className="warm-cta-btn warm-desktop-nav"
              style={{
                backgroundColor: '#0D9488',
                color: '#fff',
                padding: '10px 22px',
                borderRadius: 16,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                transition: 'background-color 0.2s',
              }}
            >
              Prendre RDV
            </a>
            <button
              className="warm-hamburger"
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
              <span style={{ display: 'block', width: 24, height: 2, backgroundColor: '#0D9488', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 24, height: 2, backgroundColor: '#0D9488', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 24, height: 2, backgroundColor: '#0D9488', borderRadius: 2 }} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            style={{
              backgroundColor: '#fff',
              borderTop: '1px solid #FED7AA',
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
                  color: '#1C1917',
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
                backgroundColor: '#0D9488',
                color: '#fff',
                padding: '12px 22px',
                borderRadius: 16,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
                textAlign: 'center',
                marginTop: 4,
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
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: data.site.heroImageUrl
            ? 'none'
            : 'linear-gradient(135deg, #0D9488 0%, #FFF7ED 70%)',
          paddingTop: 68,
        }}
      >
        {/* Hero background image */}
        {data.site.heroImageUrl && (
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
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(13,148,136,0.55)',
              }}
            />
          </>
        )}

        {/* Frosted card */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 680,
            width: '90%',
            backgroundColor: 'rgba(255,255,255,0.80)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 24,
            padding: '56px 48px',
            textAlign: 'center',
            boxShadow: '0 8px 40px rgba(13,148,136,0.14)',
          }}
          className="warm-hero-card"
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#1C1917',
              lineHeight: 1.2,
              margin: '0 0 16px',
            }}
            className="warm-hero-h1"
          >
            {data.site.heroTitle ?? data.cabinet.nom}
          </h1>
          <p
            style={{
              fontSize: 20,
              color: '#0D9488',
              fontWeight: 500,
              margin: '0 0 32px',
            }}
            className="warm-hero-subtitle"
          >
            {data.site.heroSubtitle ?? `Cabinet de kinésithérapie à ${data.cabinet.ville}`}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            <a
              href={bookingUrl}
              style={{
                backgroundColor: '#0D9488',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: 16,
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
                transition: 'background-color 0.2s',
              }}
              className="warm-btn-primary"
            >
              Prendre rendez-vous
            </a>
            <button
              onClick={() => scrollTo('services')}
              style={{
                backgroundColor: 'transparent',
                color: '#0D9488',
                border: '2px solid #0D9488',
                padding: '14px 32px',
                borderRadius: 16,
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                transition: 'background-color 0.2s, color 0.2s',
              }}
              className="warm-btn-ghost"
            >
              Nos services
            </button>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Professionnels certifiés', 'Prise en charge mutuelle', `Ouvert ${data.cabinet.workingDays}`].map((badge) => (
              <span
                key={badge}
                style={{
                  backgroundColor: 'rgba(13,148,136,0.10)',
                  color: '#0D9488',
                  padding: '6px 16px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Wavy bottom divider */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 3 }}>
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#FFF7ED" />
          </svg>
        </div>
      </section>

      {/* ── ABOUT (if text present) ── */}
      {data.site.aboutText && (
        <section style={{ backgroundColor: '#FFF7ED', padding: '64px 24px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 17, color: '#78716C', lineHeight: 1.8 }}>{data.site.aboutText}</p>
          </div>
        </section>
      )}

      {/* ── SERVICES ── */}
      <section id="services" style={{ backgroundColor: '#FFF7ED', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(13,148,136,0.10)',
                color: '#0D9488',
                padding: '6px 18px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              Nos prestations
            </span>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#1C1917', margin: '0 0 12px' }}>
              Services & Soins
            </h2>
            <p style={{ color: '#78716C', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
              Des soins personnalisés pour vous accompagner vers une récupération optimale.
            </p>
          </div>

          <div className="warm-grid-3">
            {data.seanceTypes.length > 0 ? (
              data.seanceTypes.map((s) => (
                <div key={s.id} className="warm-service-card" style={{
                  backgroundColor: '#fff',
                  border: '1px solid #FED7AA',
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  <div style={{ height: 4, backgroundColor: '#0D9488' }} />
                  <div style={{ padding: '28px 24px' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', margin: '0 0 8px' }}>{s.nom}</h3>
                    {s.description && (
                      <p style={{ color: '#78716C', fontSize: 14, lineHeight: 1.7, margin: '0 0 16px' }}>{s.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: '#0D9488', fontWeight: 600 }}>
                        ⏱ {s.dureeDefaut} min
                      </span>
                      <span style={{ fontSize: 13, color: '#0D9488', fontWeight: 600 }}>
                        💶 {s.tarifDefaut} €
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              [
                { title: 'Rééducation', desc: 'Programmes adaptés à votre récupération.' },
                { title: 'Massages thérapeutiques', desc: 'Techniques douces pour soulager les tensions.' },
                { title: 'Bilan postural', desc: 'Analyse complète de votre posture.' },
              ].map((s) => (
                <div key={s.title} className="warm-service-card" style={{
                  backgroundColor: '#fff',
                  border: '1px solid #FED7AA',
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  <div style={{ height: 4, backgroundColor: '#0D9488' }} />
                  <div style={{ padding: '28px 24px' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1C1917', margin: '0 0 8px' }}>{s.title}</h3>
                    <p style={{ color: '#78716C', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Wavy divider */}
      <div style={{ backgroundColor: '#fff', lineHeight: 0, marginTop: -2 }}>
        <svg viewBox="0 0 1440 50" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
          <path d="M0,50 C360,0 1080,50 1440,10 L1440,0 L0,0 Z" fill="#FFF7ED" />
        </svg>
      </div>

      {/* ── ÉQUIPE ── */}
      <section id="equipe" style={{ backgroundColor: '#fff', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(13,148,136,0.10)',
                color: '#0D9488',
                padding: '6px 18px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              Notre équipe
            </span>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#1C1917', margin: 0 }}>
              Vos praticiens
            </h2>
          </div>

          <div className="warm-grid-4">
            {data.praticiens.length > 0 ? (
              data.praticiens.map((p) => (
                <div
                  key={p.id}
                  className="warm-team-card"
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #FED7AA',
                    borderRadius: 16,
                    padding: '32px 24px',
                    textAlign: 'center',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: '#0D9488',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 28,
                      fontWeight: 700,
                      margin: '0 auto 16px',
                    }}
                  >
                    {p.prenom[0]}{p.nom[0]}
                  </div>
                  <p style={{ fontSize: 12, color: '#0D9488', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Dr.
                  </p>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1C1917', margin: '0 0 6px' }}>
                    {p.prenom} {p.nom}
                  </h3>
                  {p.specialite && (
                    <p style={{ color: '#78716C', fontSize: 14 }}>{p.specialite}</p>
                  )}
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#78716C' }}>
                Informations sur l&apos;équipe bientôt disponibles.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Wavy divider */}
      <div style={{ backgroundColor: '#FFF7ED', lineHeight: 0, marginTop: -2 }}>
        <svg viewBox="0 0 1440 50" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
          <path d="M0,10 C360,50 1080,0 1440,40 L1440,0 L0,0 Z" fill="#fff" />
        </svg>
      </div>

      {/* ── TÉMOIGNAGES ── */}
      <section id="temoignages" style={{ backgroundColor: '#FFF7ED', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(13,148,136,0.10)',
                color: '#0D9488',
                padding: '6px 18px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              Avis patients
            </span>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#1C1917', margin: 0 }}>
              Ce que disent nos patients
            </h2>
          </div>

          <div className="warm-grid-3">
            {data.testimonials.length > 0 ? (
              data.testimonials.map((t) => (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #FED7AA',
                    borderRadius: 16,
                    padding: '28px 24px',
                    boxShadow: '0 2px 12px rgba(13,148,136,0.06)',
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ color: i < t.rating ? '#0D9488' : '#d1d5db', fontSize: 18 }}>★</span>
                    ))}
                  </div>
                  <p style={{ color: '#44403C', fontSize: 15, fontStyle: 'italic', lineHeight: 1.8, margin: '0 0 16px' }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <p style={{ color: '#0D9488', fontWeight: 700, fontSize: 14, margin: 0 }}>— {t.patientName}</p>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#78716C' }}>
                Les avis seront affichés ici.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ backgroundColor: '#0D9488', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
              Nous contacter
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 16 }}>
              Prenez rendez-vous ou venez nous rendre visite à {data.cabinet.ville}.
            </p>
          </div>

          <div className="warm-grid-2">
            {/* Info cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.cabinet.adresse && (
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                }}>
                  <span style={{ fontSize: 22 }}>📍</span>
                  <div>
                    <p style={{ fontWeight: 700, color: '#1C1917', margin: '0 0 4px', fontSize: 15 }}>Adresse</p>
                    <p style={{ color: '#78716C', margin: 0, fontSize: 14 }}>{data.cabinet.adresse}</p>
                  </div>
                </div>
              )}
              {data.cabinet.telephone && (
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}>
                  <span style={{ fontSize: 22 }}>☎️</span>
                  <div>
                    <p style={{ fontWeight: 700, color: '#1C1917', margin: '0 0 4px', fontSize: 15 }}>Téléphone</p>
                    <a href={`tel:${data.cabinet.telephone}`} style={{ color: '#0D9488', textDecoration: 'none', fontSize: 14 }}>
                      {data.cabinet.telephone}
                    </a>
                  </div>
                </div>
              )}
              {data.cabinet.email && (
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}>
                  <span style={{ fontSize: 22 }}>✉️</span>
                  <div>
                    <p style={{ fontWeight: 700, color: '#1C1917', margin: '0 0 4px', fontSize: 15 }}>Email</p>
                    <a href={`mailto:${data.cabinet.email}`} style={{ color: '#0D9488', textDecoration: 'none', fontSize: 14 }}>
                      {data.cabinet.email}
                    </a>
                  </div>
                </div>
              )}
              <div style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}>
                <span style={{ fontSize: 22 }}>🕐</span>
                <div>
                  <p style={{ fontWeight: 700, color: '#1C1917', margin: '0 0 4px', fontSize: 15 }}>Horaires</p>
                  <p style={{ color: '#78716C', margin: 0, fontSize: 14 }}>
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
                    borderRadius: 16,
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
                  backgroundColor: '#fff',
                  color: '#0D9488',
                  borderRadius: 16,
                  padding: '16px 24px',
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  textAlign: 'center',
                  border: '2px solid rgba(255,255,255,0.4)',
                  transition: 'background-color 0.2s',
                }}
              >
                Prendre rendez-vous en ligne
              </a>
            </div>

            {/* Map embed */}
            {data.site.googleMapsEmbed ? (
              <div
                style={{ borderRadius: 16, overflow: 'hidden', minHeight: 300 }}
                dangerouslySetInnerHTML={{ __html: data.site.googleMapsEmbed }}
              />
            ) : (
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 16,
                  minHeight: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.70)',
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
      <footer style={{ backgroundColor: '#fff', padding: '32px 24px', borderTop: '1px solid #FED7AA' }}>
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
                backgroundColor: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              K
            </div>
            <span style={{ fontWeight: 700, color: '#1C1917', fontSize: 15 }}>{data.cabinet.nom}</span>
          </div>
          <p style={{ color: '#78716C', fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} {data.cabinet.nom} · Propulsé par{' '}
            <span style={{ color: '#0D9488', fontWeight: 600 }}>KinéPro</span>
          </p>
        </div>
      </footer>

      {/* ── STYLES ── */}
      <style>{`
        * { box-sizing: border-box; }

        .warm-nav-link:hover { color: #0D9488 !important; }
        .warm-btn-primary:hover { background-color: #0f766e !important; }
        .warm-btn-ghost:hover { background-color: rgba(13,148,136,0.08) !important; }
        .warm-cta-btn:hover { background-color: #0f766e !important; }

        .warm-service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(13,148,136,0.12) !important;
        }
        .warm-team-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(13,148,136,0.12) !important;
        }

        .warm-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .warm-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .warm-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .warm-grid-4 { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .warm-desktop-nav { display: none !important; }
          .warm-hamburger { display: flex !important; }

          .warm-grid-3 { grid-template-columns: 1fr; }
          .warm-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .warm-grid-2 { grid-template-columns: 1fr; }

          .warm-hero-card { padding: 36px 24px !important; }
          .warm-hero-h1 { font-size: 32px !important; }
          .warm-hero-subtitle { font-size: 16px !important; }
        }

        @media (max-width: 480px) {
          .warm-grid-4 { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
