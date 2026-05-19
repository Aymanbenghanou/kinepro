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

export default function MedicalTemplate({ data }: { data: SiteData }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const bookingUrl = data.cabinet.slug
    ? `https://kinepro-omega.vercel.app/booking/${data.cabinet.slug}`
    : '/';

  const accent = data.site.primaryColor || '#2563EB';

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

  const heroBackground = data.site.heroImageUrl
    ? `url(${data.site.heroImageUrl})`
    : 'linear-gradient(135deg, #1E3A5F, #2563EB)';

  const heroOverlay = data.site.heroImageUrl
    ? 'rgba(30,58,95,0.7)'
    : 'transparent';

  return (
    <>
      <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: '#F8FAFC', color: '#0F172A', minHeight: '100vh' }}>

        {/* ── NAVBAR ─────────────────────────────────────────────── */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrolled ? '#ffffff' : 'transparent',
          boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.09)' : 'none',
          transition: 'background 0.3s, box-shadow 0.3s',
          padding: '0 24px',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>

            {/* Logo */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              onClick={() => scrollTo('accueil')}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#1E3A5F', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 18,
              }}>K</div>
              <span style={{ fontWeight: 700, fontSize: 16, color: scrolled ? '#0F172A' : '#fff' }}>
                {data.cabinet.nom}
              </span>
            </div>

            {/* Desktop links */}
            <div className="med-desktop-links" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 15, fontWeight: 500,
                    color: scrolled ? '#0F172A' : '#fff',
                    transition: 'color 0.2s',
                  }}
                >
                  {link.label}
                </button>
              ))}
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: accent, color: '#fff',
                  padding: '9px 20px', borderRadius: 8,
                  fontWeight: 600, fontSize: 15,
                  textDecoration: 'none',
                  transition: 'opacity 0.2s',
                }}
              >
                Prendre RDV →
              </a>
            </div>

            {/* Hamburger */}
            <button
              className="med-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'none',
                background: 'none', border: 'none', cursor: 'pointer',
                flexDirection: 'column', gap: 5, padding: 4,
              }}
              aria-label="Menu"
            >
              <span style={{ display: 'block', width: 24, height: 2, background: scrolled ? '#0F172A' : '#fff', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 24, height: 2, background: scrolled ? '#0F172A' : '#fff', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 24, height: 2, background: scrolled ? '#0F172A' : '#fff', borderRadius: 2 }} />
            </button>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div style={{
              background: '#fff', borderTop: '1px solid #E2E8F0',
              padding: '12px 0',
            }}>
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '12px 24px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 15, fontWeight: 500, color: '#0F172A',
                  }}
                >
                  {link.label}
                </button>
              ))}
              <div style={{ padding: '8px 24px' }}>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    background: accent, color: '#fff',
                    padding: '10px 20px', borderRadius: 8,
                    fontWeight: 600, textDecoration: 'none',
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
            backgroundImage: heroBackground,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Overlay */}
          {data.site.heroImageUrl && (
            <div style={{
              position: 'absolute', inset: 0,
              background: heroOverlay,
            }} />
          )}

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '120px 24px 80px', maxWidth: 760, margin: '0 auto' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 20, padding: '6px 16px',
              color: '#fff', fontSize: 13, fontWeight: 500,
              marginBottom: 24,
            }}>
              ✓ Cabinet de kinésithérapie agréé
            </div>

            {/* H1 */}
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 64px)',
              fontWeight: 800, color: '#fff',
              lineHeight: 1.15, margin: '0 0 20px',
            }}>
              {data.site.heroTitle || data.cabinet.nom}
            </h1>

            {/* Subtitle */}
            {data.site.heroSubtitle && (
              <p style={{
                fontSize: 'clamp(16px, 2.5vw, 22px)',
                color: 'rgba(255,255,255,0.85)',
                margin: '0 0 40px',
                lineHeight: 1.6,
              }}>
                {data.site.heroSubtitle}
              </p>
            )}

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#fff', color: '#1E3A5F',
                  padding: '14px 32px', borderRadius: 10,
                  fontWeight: 700, fontSize: 16,
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}
              >
                Prendre RDV →
              </a>
              <button
                onClick={() => scrollTo('services')}
                style={{
                  background: 'transparent', color: '#fff',
                  padding: '14px 32px', borderRadius: 10,
                  fontWeight: 600, fontSize: 16,
                  border: '2px solid rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                }}
              >
                Nos services
              </button>
            </div>

            {/* Trust row */}
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Cabinet agréé', 'Prise en charge mutuelle', 'Équipement moderne'].map(t => (
                <span key={t} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#4ADE80', fontWeight: 700 }}>✓</span> {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERVICES ───────────────────────────────────────────── */}
        <section id="services" style={{ background: '#fff', padding: '80px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', margin: '0 0 12px' }}>
                Nos services
              </h2>
              <div style={{ width: 40, height: 4, background: accent, borderRadius: 2, margin: '0 auto' }} />
            </div>

            {/* Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}>
              {data.seanceTypes.map(s => (
                <div
                  key={s.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '24px',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.couleur, flexShrink: 0 }} />
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>{s.nom}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: '#64748B' }}>⏱ {s.dureeDefaut} min</span>
                    <span style={{ fontSize: 13, color: '#1E3A5F', fontWeight: 600 }}>{s.tarifDefaut} MAD</span>
                  </div>
                  {s.description && (
                    <p style={{
                      fontSize: 14, color: '#475569', margin: 0,
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
        <section id="equipe" style={{ background: '#F8FAFC', padding: '80px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', margin: '0 0 12px' }}>
                Notre équipe
              </h2>
              <div style={{ width: 40, height: 4, background: accent, borderRadius: 2, margin: '0 auto' }} />
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
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '32px 24px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: '#1E3A5F', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, fontWeight: 700,
                      margin: '0 auto 16px',
                    }}>
                      {initials}
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
                      Dr. {p.prenom} {p.nom}
                    </h3>
                    {p.specialite && (
                      <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 16px' }}>{p.specialite}</p>
                    )}
                    <div style={{ width: '40%', height: 2, background: '#1E3A5F', margin: '0 auto', borderRadius: 2 }} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── TÉMOIGNAGES ────────────────────────────────────────── */}
        {data.testimonials.length > 0 && (
          <section id="temoignages" style={{ background: '#fff', padding: '80px 24px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <h2 style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', margin: '0 0 12px' }}>
                  Ce que disent nos patients
                </h2>
                <div style={{ width: 40, height: 4, background: accent, borderRadius: 2, margin: '0 auto' }} />
              </div>

              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center',
              }}>
                {data.testimonials.map(t => {
                  const initial = t.patientName.charAt(0).toUpperCase();
                  return (
                    <div key={t.id} style={{
                      background: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: '28px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      maxWidth: 340,
                      flex: '1 1 280px',
                    }}>
                      {/* Stars */}
                      <div style={{ marginBottom: 12 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} style={{ color: i < t.rating ? '#F59E0B' : '#E2E8F0', fontSize: 18 }}>★</span>
                        ))}
                      </div>
                      {/* Quote */}
                      <p style={{
                        fontSize: 14, color: '#475569', fontStyle: 'italic',
                        margin: '0 0 16px', lineHeight: 1.6,
                      }}>
                        &ldquo;{t.text}&rdquo;
                      </p>
                      {/* Patient */}
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1E3A5F' }}>
                        {initial}.
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── CONTACT ────────────────────────────────────────────── */}
        <section id="contact" style={{ background: '#1E3A5F', padding: '80px 24px', color: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
                Nous contacter
              </h2>
              <div style={{ width: 40, height: 4, background: '#fff', borderRadius: 2, margin: '0 auto' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }} className="med-contact-grid">
              {/* Left: info */}
              <div>
                {data.cabinet.adresse && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <span style={{ fontSize: 20 }}>📍</span>
                    <div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Adresse</div>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>{data.cabinet.adresse}, {data.cabinet.ville}</div>
                    </div>
                  </div>
                )}
                {data.cabinet.telephone && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <span style={{ fontSize: 20 }}>📞</span>
                    <div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Téléphone</div>
                      <a href={`tel:${data.cabinet.telephone}`} style={{ fontSize: 15, fontWeight: 500, color: '#fff', textDecoration: 'none' }}>
                        {data.cabinet.telephone}
                      </a>
                    </div>
                  </div>
                )}
                {data.cabinet.email && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <span style={{ fontSize: 20 }}>✉️</span>
                    <div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Email</div>
                      <a href={`mailto:${data.cabinet.email}`} style={{ fontSize: 15, fontWeight: 500, color: '#fff', textDecoration: 'none' }}>
                        {data.cabinet.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Hours */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                  <span style={{ fontSize: 20 }}>🕐</span>
                  <div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Horaires</div>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>
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
                      padding: '12px 24px', borderRadius: 10,
                      fontWeight: 600, fontSize: 15,
                      textDecoration: 'none',
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
              <div style={{ borderRadius: 12, overflow: 'hidden', minHeight: 280 }}>
                {data.site.googleMapsEmbed ? (
                  <iframe
                    src={data.site.googleMapsEmbed}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Carte du cabinet"
                  />
                ) : (
                  <div style={{
                    height: 300, background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 12, fontSize: 18, color: 'rgba(255,255,255,0.7)',
                  }}>
                    📍 {data.cabinet.ville}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer style={{ background: '#0F1F3D', padding: '24px', color: '#fff' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 15,
              }}>K</div>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{data.cabinet.nom}</span>
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Propulsé par KinéPro
            </span>
          </div>
        </footer>
      </div>

      {/* ── RESPONSIVE STYLES ──────────────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          .med-desktop-links { display: none !important; }
          .med-hamburger { display: flex !important; }
          .med-contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
