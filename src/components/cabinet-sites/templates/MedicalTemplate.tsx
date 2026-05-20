'use client'

import { useState, useEffect, useRef } from 'react'
import { ServiceIcon, WhatsAppFloatingButton, WhatsAppContactButton } from '../CabinetSiteShared'

interface SiteContent {
  heroTitle?: string
  heroSubtitle?: string
  aboutTitle?: string
  aboutText?: string
  servicesTitle?: string
  servicesSubtitle?: string
  teamTitle?: string
  teamSubtitle?: string
  bookingTitle?: string
  bookingSubtitle?: string
  testimonialsTitle?: string
  contactTitle?: string
  stats?: { number: string; label: string }[]
}

export interface SiteData {
  cabinet: {
    nom: string
    ville: string
    adresse?: string | null
    telephone?: string | null
    email?: string | null
    whatsappNumber?: string | null
    slug: string | null
    logoUrl?: string | null
    workStartTime: string
    workEndTime: string
    workingDays: string
  }
  site: {
    templateId: string
    primaryColor: string
    secondaryColor: string
    contentFr: SiteContent | null
    contentAr: SiteContent | null
    heroImageUrl?: string | null
    googleMapsEmbed?: string | null
  }
  seanceTypes: { id: string; nom: string; dureeDefaut: number; tarifDefaut: number | null; couleur: string | null; description: string | null }[]
  praticiens: { id: string; nom: string; prenom: string; specialite: string | null; couleur: string | null }[]
  testimonials: { id: string; patientName: string; textFr: string; textAr: string; rating: number }[]
}

const APP_URL = 'https://kinepro-omega.vercel.app'
const NAVY = '#1E3A5F'
const BLUE = '#2563EB'
const HERO_IMG = 'https://res.cloudinary.com/djouneyaq/image/upload/v1779231325/difference-kine-osteo_m2ze25.jpg'
const ABOUT_IMG = 'https://res.cloudinary.com/djouneyaq/image/upload/v1778974291/POL_6607-950x600_b8jayx.jpg'

function useCountUp(target: number, active: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    const duration = 1400
    const steps = 50
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [active, target])
  return count
}

export default function MedicalTemplate({ data }: { data: SiteData }) {
  const [lang, setLang] = useState<'fr' | 'ar'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('cabinet_site_lang') as 'fr' | 'ar') ?? 'fr'
    return 'fr'
  })
  const [statsVisible, setStatsVisible] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  function toggleLang() {
    const next = lang === 'fr' ? 'ar' : 'fr'
    setLang(next)
    if (typeof window !== 'undefined') localStorage.setItem('cabinet_site_lang', next)
  }

  const content = lang === 'ar' ? (data.site.contentAr ?? data.site.contentFr) : (data.site.contentFr ?? data.site.contentAr)
  const isRTL = lang === 'ar'
  const { cabinet, site, seanceTypes, praticiens, testimonials } = data
  const bookingUrl = cabinet.slug ? `${APP_URL}/booking/${cabinet.slug}` : '#'
  const primary = site.primaryColor || NAVY
  const accent = site.secondaryColor || BLUE

  const defaultStats = [
    { number: '500', label: lang === 'ar' ? 'مريض راضٍ' : 'Patients satisfaits' },
    { number: '10', label: lang === 'ar' ? 'سنوات خبرة' : 'Ans d\'expérience' },
    { number: '98', label: lang === 'ar' ? '٪ نسبة النجاح' : '% Taux de réussite' },
  ]
  const stats = content?.stats ?? defaultStats

  useEffect(() => {
    if (lang === 'ar') {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap'
      document.head.appendChild(link)
    }
  }, [lang])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const ref = statsRef.current
    if (!ref) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setStatsVisible(true) }, { threshold: 0.3 })
    obs.observe(ref)
    return () => obs.disconnect()
  }, [])

  const workHours = `${cabinet.workStartTime.slice(0, 5)}–${cabinet.workEndTime.slice(0, 5)}`

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: isRTL ? "'Cairo', sans-serif" : "'Segoe UI', system-ui, sans-serif", margin: 0, padding: 0, background: '#FFFFFF', color: '#1a1a1a' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .fade-in { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .fade-in.visible { opacity: 1; transform: none; }
        .nav-link { text-decoration: none; color: ${primary}; font-weight: 600; font-size: 14px; padding: 6px 2px; border-bottom: 2px solid transparent; transition: border-color 0.2s; }
        .nav-link:hover { border-bottom-color: ${accent}; }
        .service-card { background: #fff; border-left: 4px solid ${accent}; border-radius: 10px; padding: 28px 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); transition: transform 0.22s, box-shadow 0.22s; cursor: default; }
        .service-card:hover { transform: translateY(-4px); box-shadow: 0 10px 32px rgba(37,99,235,0.13); }
        .team-card { background: #fff; border-radius: 14px; padding: 32px 24px; text-align: center; box-shadow: 0 2px 14px rgba(0,0,0,0.07); transition: transform 0.2s; }
        .team-card:hover { transform: translateY(-4px); }
        .testimonial-card { background: #fff; border-radius: 12px; padding: 28px; box-shadow: 0 2px 14px rgba(0,0,0,0.07); }
        .cta-btn { display: inline-block; background: ${accent}; color: #fff; padding: 13px 30px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; border: none; cursor: pointer; transition: background 0.18s, transform 0.15s; }
        .cta-btn:hover { background: #1d4ed8; transform: translateY(-1px); }
        .cta-outline { display: inline-block; border: 2px solid #fff; color: #fff; padding: 11px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; cursor: pointer; transition: background 0.18s; background: transparent; }
        .cta-outline:hover { background: rgba(255,255,255,0.15); }
        @media (max-width: 768px) {
          .hero-btns { flex-direction: column !important; gap: 12px !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
          .services-grid { grid-template-columns: 1fr !important; }
          .about-grid { grid-template-columns: 1fr !important; }
          .team-grid { grid-template-columns: 1fr 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .mobile-menu { display: ${menuOpen ? 'flex' : 'none'} !important; }
          .hero-title { font-size: 2rem !important; }
          .trust-badges { flex-wrap: wrap; gap: 8px !important; }
        }
        .service-icon-circle:hover { transform: scale(1.1) rotate(-5deg); }
        @media (max-width: 900px) { .services-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .services-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: '0 5%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {cabinet.logoUrl && <img src={cabinet.logoUrl} alt="logo" style={{ height: 40, objectFit: 'contain' }} />}
            <span style={{ fontWeight: 800, fontSize: 18, color: primary, letterSpacing: '-0.3px' }}>{cabinet.nom}</span>
          </div>
          <div className="nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            <a href="#services" className="nav-link">{lang === 'ar' ? 'خدماتنا' : 'Services'}</a>
            <a href="#about" className="nav-link">{lang === 'ar' ? 'عن العيادة' : 'À propos'}</a>
            <a href="#team" className="nav-link">{lang === 'ar' ? 'فريقنا' : 'Équipe'}</a>
            <a href="#contact" className="nav-link">{lang === 'ar' ? 'اتصل بنا' : 'Contact'}</a>
            <a href={bookingUrl} className="cta-btn" style={{ padding: '9px 22px', fontSize: 14 }}>
              {lang === 'ar' ? 'احجز موعدك' : 'Prendre RDV'}
            </a>
            <button onClick={toggleLang} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, border: `1.5px solid ${primary}`, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: 'transparent', color: primary }}>
              {lang === 'fr' ? 'ع عربي' : 'FR'}
            </button>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 5, padding: 8 }}>
            <span style={{ width: 24, height: 2, background: primary, display: 'block' }} />
            <span style={{ width: 24, height: 2, background: primary, display: 'block' }} />
            <span style={{ width: 24, height: 2, background: primary, display: 'block' }} />
          </button>
        </div>
        <div className="mobile-menu" style={{ display: 'none', flexDirection: 'column', gap: 16, paddingBottom: 20, borderTop: `1px solid #eee` }}>
          <a href="#services" className="nav-link" onClick={() => setMenuOpen(false)}>{lang === 'ar' ? 'خدماتنا' : 'Services'}</a>
          <a href="#about" className="nav-link" onClick={() => setMenuOpen(false)}>{lang === 'ar' ? 'عن العيادة' : 'À propos'}</a>
          <a href="#team" className="nav-link" onClick={() => setMenuOpen(false)}>{lang === 'ar' ? 'فريقنا' : 'Équipe'}</a>
          <a href="#contact" className="nav-link" onClick={() => setMenuOpen(false)}>{lang === 'ar' ? 'اتصل بنا' : 'Contact'}</a>
          <a href={bookingUrl} className="cta-btn" style={{ width: 'fit-content' }}>{lang === 'ar' ? 'احجز موعدك' : 'Prendre RDV'}</a>
          <button onClick={toggleLang} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, border: `1.5px solid ${primary}`, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: 'transparent', color: primary, width: 'fit-content' }}>
            {lang === 'fr' ? 'ع عربي' : 'FR'}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${site.heroImageUrl || HERO_IMG})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,58,95,0.75)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 5%', maxWidth: 720, textAlign: isRTL ? 'right' : 'left' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }} className="trust-badges">
            {['✓ Certifié', '✓ Prise en charge CNSS', '✓ En ligne 24/7'].map(b => (
              <span key={b} style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', padding: '5px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)' }}>{b}</span>
            ))}
          </div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(2rem,5vw,3.4rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.5px' }}>
            {content?.heroTitle ?? cabinet.nom}
          </h1>
          <p style={{ fontSize: 'clamp(1rem,2vw,1.2rem)', color: 'rgba(255,255,255,0.87)', lineHeight: 1.75, marginBottom: 36, maxWidth: 560 }}>
            {content?.heroSubtitle ?? `${lang === 'ar' ? 'عيادة متخصصة في' : 'Cabinet spécialisé à'} ${cabinet.ville}`}
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }} className="hero-btns">
            <a href={bookingUrl} className="cta-btn" style={{ fontSize: 16, padding: '15px 36px' }}>
              {lang === 'ar' ? 'احجز موعدك الآن' : 'Réserver maintenant'}
            </a>
            <a href="#about" className="cta-outline" style={{ fontSize: 16, padding: '13px 30px' }}>
              {lang === 'ar' ? 'اكتشف العيادة' : 'Découvrir le cabinet'}
            </a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section ref={statsRef} style={{ background: '#F8FAFC', padding: '60px 5%' }}>
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          {stats.map((s, i) => {
            const numVal = parseInt(s.number.replace(/\D/g, '')) || 0
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const count = useCountUp(numVal, statsVisible)
            const suffix = s.number.replace(/[0-9]/g, '')
            return (
              <div key={i} className="fade-in" style={{ padding: '20px 10px' }}>
                <div style={{ fontSize: 'clamp(2.2rem,5vw,3.2rem)', fontWeight: 900, color: accent, lineHeight: 1 }}>
                  {statsVisible ? count : 0}{suffix}
                </div>
                <div style={{ fontSize: 15, color: '#64748B', marginTop: 8, fontWeight: 600 }}>{s.label}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: '90px 5%', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="fade-in" style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, color: primary, marginBottom: 14 }}>
              {content?.servicesTitle ?? (lang === 'ar' ? 'خدماتنا' : 'Nos Services')}
            </h2>
            <p style={{ fontSize: 16, color: '#64748B', maxWidth: 520, margin: '0 auto' }}>
              {content?.servicesSubtitle ?? (lang === 'ar' ? 'نقدم رعاية متكاملة لصحتك' : 'Une prise en charge complète et personnalisée')}
            </p>
          </div>
          <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {seanceTypes.length > 0 ? seanceTypes.map(s => (
              <div key={s.id} className="service-card fade-in" style={{ borderTopColor: s.couleur || accent, borderTop: `4px solid ${s.couleur || accent}`, borderLeft: 'none' }}>
                {/* Icon circle */}
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: s.couleur || accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, transition: 'transform 0.2s' }} className="service-icon-circle">
                  <ServiceIcon nom={s.nom} size={26} color="white" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: primary, marginBottom: 8 }}>{s.nom}</h3>
                {s.description && <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65, marginBottom: 12 }}>{s.description}</p>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: accent, fontWeight: 700, background: `${accent}15`, padding: '3px 10px', borderRadius: 999 }}>⏱ {s.dureeDefaut} min</span>
                  {s.tarifDefaut && <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 999 }}>{s.tarifDefaut} MAD</span>}
                </div>
                <a href="#booking" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: accent, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'gap 0.15s' }}>
                  {lang === 'ar' ? 'احجز الآن ←' : 'Réserver →'}
                </a>
              </div>
            )) : (
              ['Kinésithérapie', 'Rééducation', 'Ostéopathie'].map(name => (
                <div key={name} className="service-card fade-in" style={{ borderTop: `4px solid ${accent}`, borderLeft: 'none' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <ServiceIcon nom={name} size={26} color="white" />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: primary, marginBottom: 8 }}>{name}</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>{lang === 'ar' ? 'رعاية متخصصة ومخصصة لاحتياجاتك' : 'Soins spécialisés adaptés à vos besoins.'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding: '90px 5%', background: '#F8FAFC' }}>
        <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, maxWidth: 1100, margin: '0 auto', alignItems: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
          <div className="fade-in" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
              {lang === 'ar' ? 'من نحن' : 'À propos de nous'}
            </p>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 800, color: primary, marginBottom: 20, lineHeight: 1.2 }}>
              {content?.aboutTitle ?? `${lang === 'ar' ? 'مرحباً بكم في عيادة' : 'Bienvenue au cabinet'} ${cabinet.nom}`}
            </h2>
            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.85, marginBottom: 28 }}>
              {content?.aboutText ?? (lang === 'ar' ? `عيادة ${cabinet.nom} في ${cabinet.ville} تقدم رعاية صحية متخصصة بأحدث التقنيات وأكثر المعالجين خبرة.` : `Le cabinet ${cabinet.nom}, situé à ${cabinet.ville}, vous offre une prise en charge professionnelle et personnalisée avec les dernières techniques thérapeutiques.`)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                lang === 'ar' ? '✓ فريق من الأخصائيين المعتمدين' : '✓ Équipe de spécialistes certifiés',
                lang === 'ar' ? '✓ تقنيات حديثة ومعدات متطورة' : '✓ Techniques modernes et équipements avancés',
                lang === 'ar' ? '✓ متابعة شخصية لكل مريض' : '✓ Suivi personnalisé pour chaque patient',
              ].map(item => <span key={item} style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{item}</span>)}
            </div>
          </div>
          <div className="fade-in">
            <img src={ABOUT_IMG} alt="À propos" style={{ width: '100%', borderRadius: 16, objectFit: 'cover', height: 420, boxShadow: '0 20px 60px rgba(30,58,95,0.15)' }} />
          </div>
        </div>
      </section>

      {/* TEAM */}
      {praticiens.length > 0 && (
        <section id="team" style={{ padding: '90px 5%', background: '#fff' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="fade-in" style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, color: primary, marginBottom: 14 }}>
                {content?.teamTitle ?? (lang === 'ar' ? 'فريقنا الطبي' : 'Notre Équipe')}
              </h2>
              <p style={{ fontSize: 16, color: '#64748B', maxWidth: 500, margin: '0 auto' }}>
                {content?.teamSubtitle ?? (lang === 'ar' ? 'نخبة من المختصين في خدمتكم' : 'Des professionnels dévoués à votre santé')}
              </p>
            </div>
            <div className="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 28 }}>
              {praticiens.map(p => (
                <div key={p.id} className="team-card fade-in">
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: p.couleur || primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, margin: '0 auto 16px' }}>
                    {p.prenom[0]}{p.nom[0]}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: primary }}>{p.prenom} {p.nom}</h3>
                  {p.specialite && <p style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>{p.specialite}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BOOKING CTA */}
      <section style={{ padding: '90px 5%', background: primary }}>
        <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
            {content?.bookingTitle ?? (lang === 'ar' ? 'احجز موعدك الآن' : 'Prenez rendez-vous maintenant')}
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 36, lineHeight: 1.7 }}>
            {content?.bookingSubtitle ?? (lang === 'ar' ? 'احجز بسهولة عبر الإنترنت على مدار الساعة' : 'Réservez facilement en ligne, 24h/24 et 7j/7')}
          </p>
          <a href={bookingUrl} style={{ display: 'inline-block', background: '#fff', color: primary, padding: '16px 44px', borderRadius: 10, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', transition: 'transform 0.15s' }}>
            {lang === 'ar' ? 'احجز موعدك' : 'Réserver mon rendez-vous'}
          </a>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section style={{ padding: '90px 5%', background: '#F8FAFC' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="fade-in" style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, color: primary, marginBottom: 14 }}>
                {content?.testimonialsTitle ?? (lang === 'ar' ? 'آراء مرضانا' : 'Ce que disent nos patients')}
              </h2>
            </div>
            <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28 }}>
              {testimonials.map(t => (
                <div key={t.id} className="testimonial-card fade-in">
                  <div style={{ color: '#F59E0B', fontSize: 18, marginBottom: 14 }}>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                  <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.75, fontStyle: 'italic', marginBottom: 18 }}>
                    "{lang === 'ar' ? t.textAr : t.textFr}"
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: primary }}>— {t.patientName}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTACT */}
      <section id="contact" style={{ padding: '90px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="fade-in" style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, color: primary, marginBottom: 14 }}>
              {content?.contactTitle ?? (lang === 'ar' ? 'اتصل بنا' : 'Nous contacter')}
            </h2>
          </div>
          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {cabinet.adresse && (
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, marginTop: 2 }}>📍</span>
                  <div>
                    <p style={{ fontWeight: 700, color: primary, marginBottom: 4 }}>{lang === 'ar' ? 'العنوان' : 'Adresse'}</p>
                    <p style={{ color: '#64748B', fontSize: 15 }}>{cabinet.adresse}, {cabinet.ville}</p>
                  </div>
                </div>
              )}
              {cabinet.telephone && (
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, marginTop: 2 }}>📞</span>
                  <div>
                    <p style={{ fontWeight: 700, color: primary, marginBottom: 4 }}>{lang === 'ar' ? 'الهاتف' : 'Téléphone'}</p>
                    <a href={`tel:${cabinet.telephone}`} style={{ color: accent, fontSize: 15, textDecoration: 'none', fontWeight: 600 }}>{cabinet.telephone}</a>
                  </div>
                </div>
              )}
              {cabinet.email && (
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, marginTop: 2 }}>✉️</span>
                  <div>
                    <p style={{ fontWeight: 700, color: primary, marginBottom: 4 }}>{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                    <a href={`mailto:${cabinet.email}`} style={{ color: accent, fontSize: 15, textDecoration: 'none', fontWeight: 600 }}>{cabinet.email}</a>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, marginTop: 2 }}>🕐</span>
                <div>
                  <p style={{ fontWeight: 700, color: primary, marginBottom: 4 }}>{lang === 'ar' ? 'ساعات العمل' : 'Horaires'}</p>
                  <p style={{ color: '#64748B', fontSize: 15 }}>{cabinet.workingDays} · {workHours}</p>
                </div>
              </div>
              {cabinet.whatsappNumber && (
                <WhatsAppContactButton
                  whatsappNumber={cabinet.whatsappNumber}
                  cabinetName={cabinet.nom}
                  lang={lang}
                />
              )}
            </div>
            <div className="fade-in">
              {site.googleMapsEmbed ? (
                <iframe src={site.googleMapsEmbed} style={{ width: '100%', height: 360, border: 'none', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} allowFullScreen loading="lazy" />
              ) : (
                <div style={{ width: '100%', height: 360, background: '#F1F5F9', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 15 }}>
                  📍 {cabinet.ville}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: primary, color: '#fff', padding: '48px 5% 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24, paddingBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            <div>
              {cabinet.logoUrl && <img src={cabinet.logoUrl} alt="logo" style={{ height: 36, objectFit: 'contain', marginBottom: 8, filter: 'brightness(0) invert(1)' }} />}
              <p style={{ fontWeight: 800, fontSize: 18 }}>{cabinet.nom}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{cabinet.ville}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: isRTL ? 'right' : 'right' }}>
              {cabinet.telephone && <a href={`tel:${cabinet.telephone}`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14 }}>{cabinet.telephone}</a>}
              {cabinet.email && <a href={`mailto:${cabinet.email}`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14 }}>{cabinet.email}</a>}
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{cabinet.workingDays} · {workHours}</p>
            </div>
          </div>
          <div style={{ paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>© {new Date().getFullYear()} {cabinet.nom}. {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'Tous droits réservés.'}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Propulsé par <strong style={{ color: accent }}>KinéPro</strong></p>
          </div>
        </div>
      </footer>

      {cabinet.whatsappNumber && (
        <WhatsAppFloatingButton
          whatsappNumber={cabinet.whatsappNumber}
          cabinetName={cabinet.nom}
          lang={lang}
        />
      )}
    </div>
  )
}
