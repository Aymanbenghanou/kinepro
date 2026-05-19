'use client';

import { useState, useEffect } from 'react';

export interface SiteData {
  cabinet: {
    nom: string;
    ville: string;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
    whatsappNumber: string | null;
    slug: string | null;
    workStartTime: string;
    workEndTime: string;
    workingDays: string;
    logoUrl: string | null;
  };
  site: {
    templateId: string;
    primaryColor: string;
    secondaryColor: string;
    heroTitle: string | null;
    heroSubtitle: string | null;
    heroImageUrl: string | null;
    aboutText: string | null;
    googleMapsEmbed: string | null;
  };
  seanceTypes: Array<{
    id: string;
    nom: string;
    dureeDefaut: number;
    tarifDefaut: number;
    couleur: string;
    description: string | null;
  }>;
  praticiens: Array<{
    id: string;
    nom: string;
    prenom: string;
    specialite: string | null;
    couleur: string;
  }>;
  testimonials: Array<{
    id: string;
    patientName: string;
    text: string;
    rating: number;
  }>;
}

export default function PremiumTemplate({ data }: { data: SiteData }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const bookingUrl = data.cabinet.slug
    ? `https://kinepro-omega.vercel.app/booking/${data.cabinet.slug}`
    : '/';

  const GOLD = '#F59E0B';
  const GOLD_LIGHT = '#FBBF24';
  const DARK_BG = '#0F172A';
  const CARD_BG = '#1E293B';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const navLinks = [
    { label: 'Accueil', id: 'accueil' },
    { label: 'Services', id: 'services' },
    { label: 'Équipe', id: 'equipe' },
    { label: 'Témoignages', id: 'temoignages' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <>
      <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: DARK_BG, color: '#fff', minHeight: '100vh' }}>

        {/* ── NAVBAR ─────────────────────────────────────────────── */}
        <nav style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 1000,
          background: scrolled ? 'rgba(15,23,42,0.97)' : 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: scrolled ? `1px solid rgba(245,158,11,0.2)` : '1px solid transparent',
          transition: 'all 0.3s',
          padding: '0 24px',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>

            {/* Logo */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              onClick={() => scrollTo('accueil')}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                color: DARK_BG,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 18,
              }}>K</div>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '0.02em' }}>
                {data.cabinet.nom}
              </span>
            </div>

            {/* Desktop links */}
            <div className="prem-desktop-links" style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)',
                    letterSpacing: '0.03em', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                >
                  {link.label}
                </button>
              ))}
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                  color: DARK_BG,
                  padding: '10px 22px', borderRadius: 8,
                  fontWeight: 700, fontSize: 14,
                  textDecoration: 'none',
                  letterSpacing: '0.02em',
                  boxShadow: `0 4px 20px rgba(245,158,11,0.3)`,
                }}
              >
                Prendre RDV →
              </a>
            </div>

            {/* Hamburger */}
            <button
              className="prem-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'none',
                background: 'none', border: 'none', cursor: 'pointer',
                flexDirection: 'column', gap: 5, padding: 4,
              }}
              aria-label="Menu"
            >
              <span style={{ display: 'block', width: 24, height: 2, background: GOLD, borderRadius: 2 }} />
              <span style={{ display: 'block', width: 24, height: 2, background: GOLD, borderRadius: 2 }} />
              <span style={{ display: 'block', width: 24, height: 2, background: GOLD, borderRadius: 2 }} />
            </button>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div style={{
              background: CARD_BG,
              borderTop: `1px solid rgba(245,158,11,0.2)`,
              padding: '12px 0',
            }}>
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '13px 24px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 15, fontWeight: 500, color: '#fff',
                  }}
                >
                  {link.label}
                </button>
              ))}
              <div style={{ padding: '10px 24px' }}>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                    color: DARK_BG,
                    padding: '11px 22px', borderRadius: 8,
                    fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  Prendre RDV →
                </a>
              </div>
            </div>
          )}
        </nav>

        {/* ── HERO ────────────────────────────────────────────────── */}
        <section
          id="accueil"
          style={{
            minHeight: '100vh',
            background: data.site.heroImageUrl ? `url(${data.site.heroImageUrl}) center/cover no-repeat` : DARK_BG,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Dark overlay for image */}
          {data.site.heroImageUrl && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.85)' }} />
          )}

          {/* Decorative gold blobs (shown when no image) */}
          {!data.site.heroImageUrl && (
            <>
              <div style={{
                position: 'absolute', top: -80, right: -80,
                width: 480, height: 480,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', top: 60, right: 60,
                width: 220, height: 220,
                borderRadius: '50%',
                border: `2px solid rgba(245,158,11,0.25)`,
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', top: 120, right: 120,
                width: 120, height: 120,
                borderRadius: '50%',
                border: `2px solid rgba(245,158,11,0.4)`,
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', bottom: 40, left: -60,
                width: 300, height: 300,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />
            </>
          )}

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, padding: '140px 24px 100px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
            <div style={{ maxWidth: 620 }}>
              {/* Gold badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `rgba(245,158,11,0.15)`,
                border: `1px solid rgba(245,158,11,0.4)`,
                borderRadius: 20, padding: '7px 18px',
                color: GOLD, fontSize: 13, fontWeight: 600,
                marginBottom: 28, letterSpacing: '0.04em',
              }}>
                ★ Cabinet Premium
              </div>

              {/* H1 */}
              <h1 style={{
                fontSize: 'clamp(40px, 6vw, 64px)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.1,
                margin: '0 0 22px',
                letterSpacing: '-0.02em',
              }}>
                {data.site.heroTitle || data.cabinet.nom}
              </h1>

              {/* Subtitle */}
              {data.site.heroSubtitle && (
                <p style={{
                  fontSize: 'clamp(16px, 2.2vw, 20px)',
                  color: 'rgba(255,255,255,0.65)',
                  margin: '0 0 44px',
                  lineHeight: 1.65,
                }}>
                  {data.site.heroSubtitle}
                </p>
              )}

              {/* CTA buttons */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 56 }}>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                    color: DARK_BG,
                    padding: '15px 36px', borderRadius: 10,
                    fontWeight: 700, fontSize: 16,
                    textDecoration: 'none',
                    boxShadow: `0 8px 32px rgba(245,158,11,0.4)`,
                    letterSpacing: '0.02em',
                  }}
                >
                  Prendre RDV →
                </a>
                <button
                  onClick={() => scrollTo('services')}
                  style={{
                    background: 'transparent',
                    color: GOLD,
                    padding: '15px 36px', borderRadius: 10,
                    fontWeight: 600, fontSize: 16,
                    border: `2px solid ${GOLD}`,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                  }}
                >
                  Découvrir
                </button>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { value: '15+', label: 'ans d\'expérience' },
                  { value: '2000+', label: 'patients' },
                  { value: '98%', label: 'satisfaction' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    padding: '14px 20px',
                    minWidth: 110,
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: GOLD, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SERVICES ───────────────────────────────────────────── */}
        <section id="services" style={{ background: DARK_BG, padding: '80px 24px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.01em' }}>
                Nos services
              </h2>
              <div style={{ width: 40, height: 3, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, borderRadius: 2, margin: '0 auto' }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}>
              {data.seanceTypes.map(s => (
                <div
                  key={s.id}
                  style={{
                    background: CARD_BG,
                    border: `1px solid rgba(245,158,11,0.15)`,
                    borderTop: `3px solid ${GOLD}`,
                    borderRadius: 12,
                    padding: '28px 24px',
                    transition: 'box-shadow 0.25s, transform 0.25s, border-color 0.25s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.boxShadow = `0 12px 40px rgba(245,158,11,0.18)`;
                    el.style.transform = 'translateY(-4px)';
                    el.style.borderColor = `rgba(245,158,11,0.45)`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.boxShadow = 'none';
                    el.style.transform = 'translateY(0)';
                    el.style.borderColor = `rgba(245,158,11,0.15)`;
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.couleur, flexShrink: 0 }} />
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>{s.nom}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>⏱ {s.dureeDefaut} min</span>
                    <span style={{ fontSize: 13, color: GOLD, fontWeight: 700 }}>{s.tarifDefaut} MAD</span>
                  </div>
                  {s.description && (
                    <p style={{
                      fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {s.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ÉQUIPE ─────────────────────────────────────────────── */}
        <section id="equipe" style={{ background: '#111827', padding: '80px 24px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.01em' }}>
                Notre équipe
              </h2>
              <div style={{ width: 40, height: 3, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, borderRadius: 2, margin: '0 auto' }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 24,
            }}>
              {data.praticiens.map(p => {
                const initials = `${p.prenom.charAt(0)}${p.nom.charAt(0)}`.toUpperCase();
                return (
                  <div key={p.id} style={{
                    background: CARD_BG,
                    border: `1px solid rgba(245,158,11,0.15)`,
                    borderRadius: 12,
                    padding: '36px 24px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: 76, height: 76, borderRadius: '50%',
                      background: 'transparent',
                      border: `2px solid ${GOLD}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 26, fontWeight: 800,
                      color: GOLD,
                      margin: '0 auto 18px',
                    }}>
                      {initials}
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                      Dr. {p.prenom} {p.nom}
                    </h3>
                    {p.specialite && (
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{p.specialite}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── TÉMOIGNAGES ────────────────────────────────────────── */}
        {data.testimonials.length > 0 && (
          <section id="temoignages" style={{ background: DARK_BG, padding: '80px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.01em' }}>
                  Ce que disent nos patients
                </h2>
                <div style={{ width: 40, height: 3, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, borderRadius: 2, margin: '0 auto' }} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
                {data.testimonials.map(t => {
                  const initial = t.patientName.charAt(0).toUpperCase();
                  return (
                    <div key={t.id} style={{
                      background: CARD_BG,
                      border: `1px solid rgba(245,158,11,0.15)`,
                      borderLeft: `4px solid ${GOLD}`,
                      borderRadius: 12,
                      padding: '28px 24px 28px 28px',
                      maxWidth: 360,
                      flex: '1 1 280px',
                    }}>
                      {/* Stars */}
                      <div style={{ marginBottom: 14 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} style={{ color: i < t.rating ? GOLD : 'rgba(255,255,255,0.15)', fontSize: 18 }}>★</span>
                        ))}
                      </div>
                      {/* Quote */}
                      <p style={{
                        fontSize: 14, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic',
                        margin: '0 0 18px', lineHeight: 1.7,
                      }}>
                        &ldquo;{t.text}&rdquo;
                      </p>
                      {/* Patient */}
                      <span style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>
                        — {initial}.
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── CONTACT ────────────────────────────────────────────── */}
        <section id="contact" style={{ background: '#111827', padding: '80px 24px', color: '#fff' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.01em' }}>
                Nous contacter
              </h2>
              <div style={{ width: 40, height: 3, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`, borderRadius: 2, margin: '0 auto' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }} className="prem-contact-grid">
              {/* Left: info */}
              <div>
                {data.cabinet.adresse && (
                  <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
                    <span style={{ fontSize: 20, color: GOLD, flexShrink: 0 }}>📍</span>
                    <div>
                      <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Adresse</div>
                      <div style={{ fontSize: 15 }}>{data.cabinet.adresse}, {data.cabinet.ville}</div>
                    </div>
                  </div>
                )}
                {data.cabinet.telephone && (
                  <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
                    <span style={{ fontSize: 20, color: GOLD, flexShrink: 0 }}>📞</span>
                    <div>
                      <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Téléphone</div>
                      <a href={`tel:${data.cabinet.telephone}`} style={{ fontSize: 15, color: '#fff', textDecoration: 'none' }}>
                        {data.cabinet.telephone}
                      </a>
                    </div>
                  </div>
                )}
                {data.cabinet.email && (
                  <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
                    <span style={{ fontSize: 20, color: GOLD, flexShrink: 0 }}>✉️</span>
                    <div>
                      <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Email</div>
                      <a href={`mailto:${data.cabinet.email}`} style={{ fontSize: 15, color: '#fff', textDecoration: 'none' }}>
                        {data.cabinet.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Hours */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
                  <span style={{ fontSize: 20, color: GOLD, flexShrink: 0 }}>🕐</span>
                  <div>
                    <div style={{ fontSize: 12, color: GOLD, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Horaires</div>
                    <div style={{ fontSize: 15 }}>
                      {data.cabinet.workingDays} · {data.cabinet.workStartTime} – {data.cabinet.workEndTime}
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                {data.cabinet.whatsappNumber && (
                  <a
                    href={`https://wa.me/${data.cabinet.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 10,
                      background: '#25D366', color: '#fff',
                      padding: '13px 28px', borderRadius: 10,
                      fontWeight: 700, fontSize: 15,
                      textDecoration: 'none',
                      boxShadow: '0 4px 20px rgba(37,211,102,0.25)',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                )}
              </div>

              {/* Right: Map */}
              <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid rgba(245,158,11,0.2)` }}>
                {data.site.googleMapsEmbed ? (
                  <iframe
                    src={data.site.googleMapsEmbed}
                    width="100%"
                    height="320"
                    style={{ border: 0, display: 'block' }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Carte du cabinet"
                  />
                ) : (
                  <div style={{
                    height: 320, background: CARD_BG,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: 'rgba(255,255,255,0.4)',
                  }}>
                    📍 {data.cabinet.ville}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer style={{ background: '#080D1A', padding: '24px', color: '#fff' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                color: DARK_BG,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 16,
              }}>K</div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{data.cabinet.nom}</span>
            </div>
            <span style={{ fontSize: 13, color: GOLD, opacity: 0.7 }}>
              Propulsé par KinéPro
            </span>
          </div>
        </footer>
      </div>

      {/* ── RESPONSIVE STYLES ──────────────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          .prem-desktop-links { display: none !important; }
          .prem-hamburger { display: flex !important; }
          .prem-contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
