'use client'

import { useState, useEffect, useRef } from 'react'

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
const DARK = '#0F172A'
const GOLD = '#F59E0B'
const HERO_IMG = 'https://res.cloudinary.com/djouneyaq/image/upload/v1779231314/kinesitherapie2x_bumgqa.webp'
const ABOUT_IMG = 'https://res.cloudinary.com/djouneyaq/image/upload/v1779231325/attachement_173374694012430_fnxoke.webp'

function useCountUp(target: number, active: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    const duration = 1600
    const steps = 60
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

export default function PremiumTemplate({ data }: { data: SiteData }) {
  const [lang, setLang] = useState<'fr' | 'ar'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('cabinet_site_lang') as 'fr' | 'ar') ?? 'fr'
    return 'fr'
  })
  const [statsVisible, setStatsVisible] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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
  const primary = site.primaryColor || DARK
  const accent = site.secondaryColor || GOLD

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const workHours = `${cabinet.workStartTime.slice(0, 5)}–${cabinet.workEndTime.slice(0, 5)}`

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: isRTL ? "'Cairo', sans-serif" : "'Segoe UI', system-ui, sans-serif", margin: 0, padding: 0, background: '#FFFFFF', color: '#1a1a1a' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .fade-in { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .fade-in.visible { opacity: 1; transform: none; }
        .prem-nav-link { text-decoration: none; color: ${primary}; font-weight: 600; font-size: 14px; padding: 6px 2px; position: relative; }
        .prem-nav-link::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 2px; background: ${accent}; transition: width 0.25s; }
        .prem-nav-link:hover::after { width: 100%; }
        .gold-btn { display: inline-block; background: linear-gradient(135deg, ${accent} 0%, #D97706 100%); color: #fff; padding: 13px 30px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 15px; border: none; cursor: pointer; transition: transform 0.15s, box-shadow 0.2s; box-shadow: 0 4px 18px rgba(245,158,11,0.35); }
        .gold-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(245,158,11,0.45); }
        .service-card-p { background: #fff; border-top: 3px solid ${accent}; border-radius: 12px; padding: 30px 24px; box-shadow: 0 2px 14px rgba(0,0,0,0.07); transition: box-shadow 0.22s, transform 0.22s; cursor: default; }
        .service-card-p:hover { box-shadow: 0 0 0 2px ${accent}, 0 12px 36px rgba(245,158,11,0.15); transform: translateY(-3px); }
        .team-card-p { background: #fff; border-radius: 16px; padding: 34px 24px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; }
        .team-card-p:hover { transform: translateY(-5px); box-shadow: 0 12px 40px rgba(245,158,11,0.15); }
        .testimonial-card-p { background: #1E293B; border-left: 4px solid ${accent}; border-radius: 12px; padding: 30px; }
        @media (max-width: 768px) {
          .prem-hero-btns { flex-direction: column !important; gap: 14px !important; align-items: center !important; }
          .stats-grid-p { grid-template-columns: 1fr !important; }
          .services-grid-p { grid-template-columns: 1fr !important; }
          .about-grid-p { grid-template-columns: 1fr !important; }
          .team-grid-p { grid-template-columns: 1fr 1fr !important; }
          .testimonials-grid-p { grid-template-columns: 1fr !important; }
          .contact-grid-p { grid-template-columns: 1fr !important; }
          .prem-nav-links { display: none !important; }
          .prem-mobile-btn { display: flex !important; }
          .prem-mobile-menu { display: ${menuOpen ? 'flex' : 'none'} !important; }
          .hero-stat-cards { flex-direction: column !important; gap: 12px !important; align-items: center !important; }
          .hero-stat-card { width: 100% !important; max-width: 280px; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 1000, background: scrolled ? 'rgba(255,255,255,0.97)' : '#fff', boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.1)' : '0 1px 8px rgba(0,0,0,0.06)', padding: '0 5%', transition: 'box-shadow 0.3s, background 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {cabinet.logoUrl
              ? <img src={cabinet.logoUrl} alt="logo" style={{ height: 42, objectFit: 'contain' }} />
              : <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${accent} 0%, #D97706 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18 }}>K</div>
            }
            <div>
              <p style={{ fontWeight: 900, fontSize: 16, color: primary, lineHeight: 1.1 }}>{cabinet.nom}</p>
              <p style={{ fontSize: 11, color: '#64748B', letterSpacing: 0.5 }}>{cabinet.ville}</p>
            </div>
          </div>
          <div className="prem-nav-links" style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
            <a href="#services" className="prem-nav-link">{lang === 'ar' ? 'الخدمات' : 'Services'}</a>
            <a href="#about" className="prem-nav-link">{lang === 'ar' ? 'عن العيادة' : 'À propos'}</a>
            <a href="#team" className="prem-nav-link">{lang === 'ar' ? 'الفريق' : 'Équipe'}</a>
            <a href="#contact" className="prem-nav-link">{lang === 'ar' ? 'التواصل' : 'Contact'}</a>
            <a href={bookingUrl} className="gold-btn" style={{ padding: '9px 22px', fontSize: 14 }}>
              {lang === 'ar' ? 'احجز موعدك' : 'Prendre RDV'}
            </a>
            <button onClick={toggleLang} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, border: `1.5px solid ${accent}`, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: 'transparent', color: accent }}>
              {lang === 'fr' ? 'ع عربي' : 'FR'}
            </button>
          </div>
          <button className="prem-mobile-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 5, padding: 8 }}>
            <span style={{ width: 24, height: 2, background: primary, display: 'block', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
            <span style={{ width: 24, height: 2, background: primary, display: 'block', opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
            <span style={{ width: 24, height: 2, background: primary, display: 'block', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
          </button>
        </div>
        <div className="prem-mobile-menu" style={{ display: 'none', flexDirection: 'column', gap: 18, paddingBottom: 24, borderTop: `1px solid #F1F5F9` }}>
          <a href="#services" className="prem-nav-link" onClick={() => setMenuOpen(false)}>{lang === 'ar' ? 'الخدمات' : 'Services'}</a>
          <a href="#about" className="prem-nav-link" onClick={() => setMenuOpen(false)}>{lang === 'ar' ? 'عن العيادة' : 'À propos'}</a>
          <a href="#team" className="prem-nav-link" onClick={() => setMenuOpen(false)}>{lang === 'ar' ? 'الفريق' : 'Équipe'}</a>
          <a href="#contact" className="prem-nav-link" onClick={() => setMenuOpen(false)}>{lang === 'ar' ? 'التواصل' : 'Contact'}</a>
          <a href={bookingUrl} className="gold-btn" style={{ width: 'fit-content' }}>{lang === 'ar' ? 'احجز موعدك' : 'Prendre RDV'}</a>
          <button onClick={toggleLang} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, border: `1.5px solid ${accent}`, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: 'transparent', color: accent, width: 'fit-content' }}>
            {lang === 'fr' ? 'ع عربي' : 'FR'}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${site.heroImageUrl || HERO_IMG})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.82)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(15,23,42,0.5) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 5%', maxWidth: 860, width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `rgba(245,158,11,0.18)`, border: `1px solid ${accent}`, borderRadius: 999, padding: '7px 20px', marginBottom: 32 }}>
            <span style={{ color: accent, fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>★ Cabinet Premium</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem,6vw,4rem)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 22, letterSpacing: '-0.8px' }}>
            {content?.heroTitle ?? cabinet.nom}
          </h1>
          <p style={{ fontSize: 'clamp(1rem,2vw,1.2rem)', color: 'rgba(255,255,255,0.78)', lineHeight: 1.8, marginBottom: 44, maxWidth: 600, margin: '0 auto 44px' }}>
            {content?.heroSubtitle ?? `${lang === 'ar' ? 'عيادة متخصصة في' : 'Cabinet d\'excellence à'} ${cabinet.ville}`}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }} className="prem-hero-btns">
            <a href={bookingUrl} className="gold-btn" style={{ fontSize: 16, padding: '16px 44px' }}>
              {lang === 'ar' ? 'احجز موعدك الآن' : 'Réserver maintenant'}
            </a>
            <a href="#about" style={{ display: 'inline-block', border: '2px solid rgba(255,255,255,0.5)', color: '#fff', padding: '14px 36px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 16, background: 'transparent', transition: 'border-color 0.2s, background 0.2s', cursor: 'pointer' }}>
              {lang === 'ar' ? 'اكتشف المزيد' : 'En savoir plus'}
            </a>
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }} className="hero-stat-cards">
            {stats.slice(0, 3).map((s, i) => (
              <div key={i} className="hero-stat-card" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '20px 32px', minWidth: 140 }}>
                <p style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900, color: accent, lineHeight: 1 }}>{s.number}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6, fontWeight: 600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section ref={statsRef} style={{ background: primary, padding: '56px 5%' }}>
        <div className="stats-grid-p" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          {stats.map((s, i) => {
            const numVal = parseInt(s.number.replace(/\D/g, '')) || 0
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const count = useCountUp(numVal, statsVisible)
            const suffix = s.number.replace(/[0-9]/g, '')
            return (
              <div key={i}>
                <div style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, color: accent, lineHeight: 1 }}>
                  {statsVisible ? count : 0}{suffix}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: '96px 5%', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="fade-in" style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>
              {lang === 'ar' ? 'ما نقدمه' : 'Nos prestations'}
            </p>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, color: primary, marginBottom: 14 }}>
              {content?.servicesTitle ?? (lang === 'ar' ? 'خدماتنا المتميزة' : 'Services d\'excellence')}
            </h2>
            <p style={{ fontSize: 16, color: '#64748B', maxWidth: 520, margin: '0 auto' }}>
              {content?.servicesSubtitle ?? (lang === 'ar' ? 'رعاية متكاملة بأعلى المعايير' : 'Des soins de haute qualité adaptés à chaque besoin')}
            </p>
          </div>
          <div className="services-grid-p" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28 }}>
            {seanceTypes.length > 0 ? seanceTypes.map(s => (
              <div key={s.id} className="service-card-p fade-in" style={{ borderTopColor: s.couleur || accent }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: primary, marginBottom: 10 }}>{s.nom}</h3>
                {s.description && <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.75, marginBottom: 16 }}>{s.description}</p>}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: accent, fontWeight: 700, background: `rgba(245,158,11,0.1)`, padding: '4px 12px', borderRadius: 999 }}>⏱ {s.dureeDefaut} min</span>
                  {s.tarifDefaut && <span style={{ fontSize: 13, color: '#10B981', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: 999 }}>💰 {s.tarifDefaut} DH</span>}
                </div>
              </div>
            )) : (
              ['Kinésithérapie', 'Rééducation', 'Ostéopathie'].map(name => (
                <div key={name} className="service-card-p fade-in">
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: primary, marginBottom: 10 }}>{name}</h3>
                  <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.75 }}>{lang === 'ar' ? 'علاج متخصص بأعلى المعايير' : 'Soins spécialisés selon les meilleures pratiques.'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding: '96px 5%', background: '#fff' }}>
        <div className="about-grid-p" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, maxWidth: 1100, margin: '0 auto', alignItems: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
          <div className="fade-in" style={{ position: 'relative' }}>
            <img src={ABOUT_IMG} alt="À propos" style={{ width: '100%', borderRadius: 20, objectFit: 'cover', height: 460, boxShadow: '0 24px 70px rgba(15,23,42,0.18)' }} />
            <div style={{ position: 'absolute', bottom: -20, right: isRTL ? 'auto' : -20, left: isRTL ? -20 : 'auto', background: `linear-gradient(135deg, ${accent} 0%, #D97706 100%)`, borderRadius: 14, padding: '20px 28px', boxShadow: `0 8px 32px rgba(245,158,11,0.4)`, color: '#fff' }}>
              <p style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>10+</p>
              <p style={{ fontSize: 13, marginTop: 4, fontWeight: 600, opacity: 0.9 }}>{lang === 'ar' ? 'سنوات خبرة' : "Ans d'expertise"}</p>
            </div>
          </div>
          <div className="fade-in" style={{ textAlign: isRTL ? 'right' : 'left', paddingTop: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16 }}>
              {lang === 'ar' ? 'من نحن' : 'Notre histoire'}
            </p>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.3rem)', fontWeight: 900, color: primary, marginBottom: 22, lineHeight: 1.2 }}>
              {content?.aboutTitle ?? `${lang === 'ar' ? 'عيادة' : 'Cabinet'} ${cabinet.nom}`}
            </h2>
            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.9, marginBottom: 32 }}>
              {content?.aboutText ?? (lang === 'ar' ? `عيادة ${cabinet.nom} في ${cabinet.ville} — مكان يجمع بين الخبرة والتكنولوجيا الحديثة لضمان أفضل رعاية لمرضانا.` : `Le cabinet ${cabinet.nom}, à ${cabinet.ville}, allie expertise médicale et technologies de pointe pour offrir des soins d'exception à chaque patient.`)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                lang === 'ar' ? 'فريق من الأخصائيين المعتمدين دولياً' : 'Équipe de spécialistes certifiés',
                lang === 'ar' ? 'أحدث الأجهزة والتقنيات العلاجية' : 'Dernières technologies thérapeutiques',
                lang === 'ar' ? 'متابعة شخصية مستمرة لكل مريض' : 'Suivi personnalisé et continu',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `rgba(245,158,11,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: accent, fontWeight: 700, fontSize: 14 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      {praticiens.length > 0 && (
        <section id="team" style={{ padding: '96px 5%', background: '#F8FAFC' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="fade-in" style={{ textAlign: 'center', marginBottom: 60 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>
                {lang === 'ar' ? 'الخبراء' : 'Notre expertise'}
              </p>
              <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, color: primary, marginBottom: 14 }}>
                {content?.teamTitle ?? (lang === 'ar' ? 'فريقنا المتميز' : 'Notre Équipe d\'Élite')}
              </h2>
              <p style={{ fontSize: 16, color: '#64748B', maxWidth: 500, margin: '0 auto' }}>
                {content?.teamSubtitle ?? (lang === 'ar' ? 'نخبة من المختصين في خدمتكم' : 'Des professionnels d\'exception à votre service')}
              </p>
            </div>
            <div className="team-grid-p" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 28 }}>
              {praticiens.map(p => (
                <div key={p.id} className="team-card-p fade-in">
                  <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'transparent', border: `2px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', position: 'relative' }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: p.couleur || primary }}>{p.prenom[0]}{p.nom[0]}</span>
                    <div style={{ position: 'absolute', width: 14, height: 14, background: accent, borderRadius: '50%', bottom: 4, right: 4, border: '2px solid #fff' }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: primary }}>{p.prenom} {p.nom}</h3>
                  {p.specialite && <p style={{ fontSize: 13, color: accent, marginTop: 6, fontWeight: 600 }}>{p.specialite}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BOOKING CTA */}
      <section style={{ padding: '100px 5%', background: primary, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: `rgba(245,158,11,0.07)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: `rgba(245,158,11,0.05)`, pointerEvents: 'none' }} />
        <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16 }}>
            {lang === 'ar' ? 'ابدأ رحلة شفائك' : 'Commencez votre guérison'}
          </p>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)', fontWeight: 900, color: '#fff', marginBottom: 18, lineHeight: 1.2 }}>
            {content?.bookingTitle ?? (lang === 'ar' ? 'احجز موعدك الآن' : 'Prenez rendez-vous dès maintenant')}
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 44, lineHeight: 1.8 }}>
            {content?.bookingSubtitle ?? (lang === 'ar' ? 'خذ الخطوة الأولى نحو صحة أفضل' : 'Faites le premier pas vers une meilleure santé')}
          </p>
          <a href={bookingUrl} className="gold-btn" style={{ fontSize: 17, padding: '18px 52px', boxShadow: `0 12px 40px rgba(245,158,11,0.5)` }}>
            {lang === 'ar' ? 'احجز موعدك' : 'Réserver mon rendez-vous'}
          </a>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section style={{ padding: '96px 5%', background: '#0F172A' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="fade-in" style={{ textAlign: 'center', marginBottom: 60 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>
                {lang === 'ar' ? 'ما يقوله مرضانا' : 'Témoignages'}
              </p>
              <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, color: '#fff', marginBottom: 14 }}>
                {content?.testimonialsTitle ?? (lang === 'ar' ? 'آراء مرضانا' : 'Ce que disent nos patients')}
              </h2>
            </div>
            <div className="testimonials-grid-p" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {testimonials.map(t => (
                <div key={t.id} className="testimonial-card-p fade-in">
                  <div style={{ color: accent, fontSize: 20, marginBottom: 16, letterSpacing: 2 }}>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.82)', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 20 }}>
                    "{lang === 'ar' ? t.textAr : t.textFr}"
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: accent }}>— {t.patientName}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTACT */}
      <section id="contact" style={{ padding: '96px 5%', background: '#1E293B' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="fade-in" style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12 }}>
              {lang === 'ar' ? 'تواصل معنا' : 'Nous trouver'}
            </p>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, color: '#fff', marginBottom: 14 }}>
              {content?.contactTitle ?? (lang === 'ar' ? 'اتصل بنا' : 'Nous contacter')}
            </h2>
          </div>
          <div className="contact-grid-p" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {cabinet.adresse && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `rgba(245,158,11,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>📍</div>
                  <div>
                    <p style={{ fontWeight: 700, color: accent, marginBottom: 4, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{lang === 'ar' ? 'العنوان' : 'Adresse'}</p>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>{cabinet.adresse}, {cabinet.ville}</p>
                  </div>
                </div>
              )}
              {cabinet.telephone && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `rgba(245,158,11,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>📞</div>
                  <div>
                    <p style={{ fontWeight: 700, color: accent, marginBottom: 4, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{lang === 'ar' ? 'الهاتف' : 'Téléphone'}</p>
                    <a href={`tel:${cabinet.telephone}`} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, textDecoration: 'none', fontWeight: 600 }}>{cabinet.telephone}</a>
                  </div>
                </div>
              )}
              {cabinet.email && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `rgba(245,158,11,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>✉️</div>
                  <div>
                    <p style={{ fontWeight: 700, color: accent, marginBottom: 4, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{lang === 'ar' ? 'البريد' : 'Email'}</p>
                    <a href={`mailto:${cabinet.email}`} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, textDecoration: 'none', fontWeight: 600 }}>{cabinet.email}</a>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `rgba(245,158,11,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>🕐</div>
                <div>
                  <p style={{ fontWeight: 700, color: accent, marginBottom: 4, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>{lang === 'ar' ? 'ساعات العمل' : 'Horaires'}</p>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>{cabinet.workingDays} · {workHours}</p>
                </div>
              </div>
              {cabinet.whatsappNumber && (
                <a href={`https://wa.me/${cabinet.whatsappNumber}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#25D366', color: '#fff', padding: '14px 30px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15, width: 'fit-content', boxShadow: '0 6px 24px rgba(37,211,102,0.3)', transition: 'transform 0.15s' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              )}
            </div>
            <div className="fade-in">
              {site.googleMapsEmbed ? (
                <iframe src={site.googleMapsEmbed} style={{ width: '100%', height: 380, border: 'none', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} allowFullScreen loading="lazy" />
              ) : (
                <div style={{ width: '100%', height: 380, background: 'rgba(255,255,255,0.05)', borderRadius: 16, border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
                  📍 {cabinet.ville}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#080D1A', color: '#fff', padding: '52px 5% 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 28, paddingBottom: 36, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                {cabinet.logoUrl
                  ? <img src={cabinet.logoUrl} alt="logo" style={{ height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                  : <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${accent} 0%, #D97706 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18 }}>K</div>
                }
                <p style={{ fontWeight: 900, fontSize: 18 }}>{cabinet.nom}</p>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{cabinet.ville}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'right' }}>
              {cabinet.telephone && <a href={`tel:${cabinet.telephone}`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>{cabinet.telephone}</a>}
              {cabinet.email && <a href={`mailto:${cabinet.email}`} style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>{cabinet.email}</a>}
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{cabinet.workingDays} · {workHours}</p>
            </div>
          </div>
          <div style={{ paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>© {new Date().getFullYear()} {cabinet.nom}. {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'Tous droits réservés.'}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Propulsé par <strong style={{ color: accent }}>KinéPro</strong></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
