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

interface SiteData {
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

export default function SportTemplate({ data }: { data: SiteData }) {
  const { cabinet } = data
  const bookingUrl = cabinet.slug ? `${APP_URL}/booking/${cabinet.slug}` : '#'

  const [lang, setLang] = useState<'fr' | 'ar'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('cabinet_site_lang') as 'fr' | 'ar') ?? 'fr'
    return 'fr'
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const [countersStarted, setCountersStarted] = useState(false)

  function toggleLang() {
    const next = lang === 'fr' ? 'ar' : 'fr'
    setLang(next)
    if (typeof window !== 'undefined') localStorage.setItem('cabinet_site_lang', next)
  }

  const content = lang === 'ar' ? (data.site.contentAr ?? data.site.contentFr) : (data.site.contentFr ?? data.site.contentAr)
  const isRTL = lang === 'ar'

  useEffect(() => {
    if (lang === 'ar') {
      if (!document.getElementById('cairo-font')) {
        const link = document.createElement('link')
        link.id = 'cairo-font'
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap'
        document.head.appendChild(link)
      }
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
    if (!statsRef.current || countersStarted) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setCountersStarted(true)
        observer.disconnect()
      }
    }, { threshold: 0.3 })
    observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [countersStarted])

  const defaultStats = [
    { number: '800+', label: lang === 'ar' ? 'رياضي تعافى' : 'Athlètes rétablis' },
    { number: '12+', label: lang === 'ar' ? 'سنوات خبرة' : 'Années d\'expérience' },
    { number: '95%', label: lang === 'ar' ? 'عودة للمنافسة' : 'Retour compétition' },
    { number: '20+', label: lang === 'ar' ? 'تقنية متخصصة' : 'Techniques spécialisées' },
  ]
  const stats = content?.stats ?? defaultStats

  const fontFamily = isRTL ? "'Cairo', sans-serif" : "'Segoe UI', system-ui, sans-serif"

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily, background: '#0F172A', color: '#F1F5F9', minHeight: '100vh' }}>
      <style>{`
        .fade-in { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .fade-in.visible { opacity: 1; transform: none; }
        .sport-nav-link { color: #E2E8F0; text-decoration: none; font-weight: 500; font-size: 15px; padding: 4px 0; position: relative; transition: color 0.2s; }
        .sport-nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background: #06B6D4; transform: scaleX(0); transition: transform 0.2s; }
        .sport-nav-link:hover { color: #06B6D4; }
        .sport-nav-link:hover::after { transform: scaleX(1); }
        .sport-card { background: #1E293B; border-top: 3px solid #06B6D4; border-radius: 12px; padding: 28px; transition: box-shadow 0.3s, transform 0.3s; }
        .sport-card:hover { box-shadow: 0 0 20px rgba(6,182,212,0.2); transform: translateY(-6px); }
        .team-card { background: #1E293B; border: 2px solid #1D4ED8; border-radius: 16px; padding: 28px 20px; text-align: center; transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s; }
        .team-card:hover { border-color: #06B6D4; box-shadow: 0 0 24px rgba(6,182,212,0.25); transform: translateY(-4px); }
        .testi-card { background: #1E293B; border-left: 4px solid #06B6D4; border-radius: 12px; padding: 28px; transition: box-shadow 0.3s; }
        .testi-card:hover { box-shadow: 0 8px 32px rgba(6,182,212,0.15); }
        .contact-card { background: #1E293B; border-radius: 14px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; transition: box-shadow 0.3s; }
        .contact-card:hover { box-shadow: 0 4px 20px rgba(6,182,212,0.15); }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 16px rgba(6,182,212,0.5); } 50% { box-shadow: 0 0 32px rgba(6,182,212,0.9), 0 0 48px rgba(6,182,212,0.4); } }
        .pulse-btn { animation: pulse-glow 2.4s ease-in-out infinite; }
        .hamburger { display: none !important; }
        @media (max-width: 768px) {
          .hamburger { display: flex !important; background: none; border: none; cursor: pointer; font-size: 24px; color: white; }
          .nav-links { display: none !important; }
          .nav-links.open { display: flex !important; flex-direction: column; position: absolute; top: 68px; left: 0; right: 0; background: rgba(15,23,42,0.98); padding: 20px; gap: 12px; z-index: 100; border-top: 1px solid #1E293B; }
          .hero-buttons { flex-direction: column !important; align-items: flex-start !important; }
          .hero-stat-cards { grid-template-columns: repeat(3,1fr) !important; }
          .two-col { flex-direction: column !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .services-grid { grid-template-columns: 1fr !important; }
          .team-grid { grid-template-columns: repeat(2,1fr) !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(30,41,59,0.8)', padding: '0 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {cabinet.logoUrl
              ? <img src={cabinet.logoUrl} alt={cabinet.nom} style={{ height: 42, width: 42, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(6,182,212,0.15)', border: '2px solid #06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4', fontWeight: 800, fontSize: 20, boxShadow: '0 0 12px rgba(6,182,212,0.4)' }}>K</div>
            }
            <span style={{ fontWeight: 700, fontSize: 17, color: 'white' }}>{cabinet.nom}</span>
          </div>
          <div className={`nav-links${menuOpen ? ' open' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="#services" className="sport-nav-link">{lang === 'ar' ? 'خدماتنا' : 'Services'}</a>
            <a href="#about" className="sport-nav-link">{lang === 'ar' ? 'من نحن' : 'À propos'}</a>
            <a href="#team" className="sport-nav-link">{lang === 'ar' ? 'الفريق' : 'Équipe'}</a>
            <a href="#contact" className="sport-nav-link">{lang === 'ar' ? 'اتصل بنا' : 'Contact'}</a>
            <a href={bookingUrl} style={{ background: '#06B6D4', color: '#0F172A', padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 0 16px rgba(6,182,212,0.4)', transition: 'box-shadow 0.2s' }}>
              {lang === 'ar' ? 'احجز موعداً' : 'Prendre RDV'}
            </a>
            <button onClick={toggleLang} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, border: '1.5px solid #06B6D4', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: 'transparent', color: '#06B6D4' }}>
              {lang === 'fr' ? 'ع عربي' : 'FR'}
            </button>
          </div>
          <button onClick={() => setMenuOpen(o => !o)} className="hamburger">☰</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', paddingTop: 68 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(https://res.cloudinary.com/djouneyaq/image/upload/v1779231314/KOSSPARIS_DSC9951-1-480x320-1_ycjl6b.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.8)' }} />
        {/* Diagonal accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(29,78,216,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '80px 48px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)', borderRadius: 999, padding: '6px 18px', marginBottom: 28, color: '#06B6D4', fontSize: 14, fontWeight: 700, boxShadow: '0 0 12px rgba(6,182,212,0.2)' }}>
            <span>⚡</span> {lang === 'ar' ? 'الأداء والتعافي' : 'Performance & Récupération'}
          </div>
          <h1 style={{ fontSize: 'clamp(2.4rem, 7vw, 5rem)', fontWeight: 900, color: 'white', margin: '0 0 20px', lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: '-0.02em', maxWidth: 700 }}>
            {content?.heroTitle ?? cabinet.nom}
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'rgba(226,232,240,0.85)', marginBottom: 40, lineHeight: 1.7, maxWidth: 560 }}>
            {content?.heroSubtitle ?? (lang === 'ar' ? 'عيادة كينيزيتيرابيا متخصصة لإعادة تأهيل الرياضيين وتعزيز الأداء' : 'Cabinet spécialisé en kinésithérapie sportive pour la rééducation et l\'optimisation des performances')}
          </p>
          <div className="hero-buttons" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 72 }}>
            <a href={bookingUrl} className="pulse-btn" style={{ background: 'linear-gradient(135deg, #06B6D4, #1D4ED8)', color: 'white', padding: '16px 40px', borderRadius: 8, fontWeight: 800, fontSize: 16, textDecoration: 'none', display: 'inline-block' }}>
              {lang === 'ar' ? 'احجز موعداً' : 'Réserver une séance'}
            </a>
            <a href="#services" style={{ color: 'white', padding: '16px 40px', borderRadius: 8, fontWeight: 600, fontSize: 16, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.3)', display: 'inline-block', transition: 'border-color 0.2s' }}>
              {lang === 'ar' ? 'اكتشف خدماتنا' : 'Découvrir nos services'}
            </a>
          </div>
          {/* Hero stat cards */}
          <div className="hero-stat-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, maxWidth: 600 }}>
            {[
              { num: '800+', label: lang === 'ar' ? 'رياضي تعافى' : 'Athlètes traités' },
              { num: '12+', label: lang === 'ar' ? 'سنوات خبرة' : 'Ans d\'expérience' },
              { num: '95%', label: lang === 'ar' ? 'نسبة النجاح' : 'Taux de succès' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(30,41,59,0.8)', backdropFilter: 'blur(8px)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#06B6D4', lineHeight: 1, textShadow: '0 0 12px rgba(6,182,212,0.5)' }}>{s.num}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section ref={statsRef} style={{ background: '#111827', padding: '56px 24px', borderTop: '1px solid #1E293B', borderBottom: '1px solid #1E293B' }}>
        <div className="stats-grid" style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32, textAlign: 'center' }}>
          {stats.map((s, i) => (
            <div key={i} className="fade-in">
              <div style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 800, color: '#06B6D4', lineHeight: 1, textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>{s.number}</div>
              <div style={{ fontSize: 14, color: '#94A3B8', marginTop: 8, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: '96px 24px', background: '#0F172A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }} className="fade-in">
            <div style={{ display: 'inline-block', background: 'rgba(6,182,212,0.1)', color: '#06B6D4', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              {lang === 'ar' ? 'خدماتنا' : 'Nos spécialités'}
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: 'white', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
              {content?.servicesTitle ?? (lang === 'ar' ? 'خدماتنا المتخصصة' : 'Nos Services')}
            </h2>
            <p style={{ color: '#94A3B8', fontSize: 17, maxWidth: 600 }}>
              {content?.servicesSubtitle ?? (lang === 'ar' ? 'تقنيات متقدمة لإعادة التأهيل الرياضي' : 'Des techniques avancées pour votre rééducation sportive')}
            </p>
          </div>
          <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {data.seanceTypes.length > 0 ? data.seanceTypes.map((s, i) => (
              <div key={s.id} className="sport-card fade-in">
                <div style={{ color: '#06B6D4', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>◆ {lang === 'ar' ? 'تخصص' : 'Spécialité'}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 8 }}>{s.nom}</h3>
                {s.description && <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{s.description}</p>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(6,182,212,0.1)', color: '#06B6D4', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, border: '1px solid rgba(6,182,212,0.2)' }}>{s.dureeDefaut} min</span>
                  {s.tarifDefaut && <span style={{ background: 'rgba(29,78,216,0.15)', color: '#93C5FD', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, border: '1px solid rgba(29,78,216,0.3)' }}>{s.tarifDefaut} MAD</span>}
                </div>
              </div>
            )) : ([
              { icon: '⚡', title: lang === 'ar' ? 'إعادة تأهيل رياضية' : 'Rééducation Sportive' },
              { icon: '🏋️', title: lang === 'ar' ? 'تقوية عضلية' : 'Renforcement Musculaire' },
              { icon: '🧊', title: lang === 'ar' ? 'علاج الإصابات الحادة' : 'Traumatologie Aiguë' },
              { icon: '🦵', title: lang === 'ar' ? 'إعادة تأهيل الركبة' : 'Rééducation du Genou' },
              { icon: '💪', title: lang === 'ar' ? 'تأهيل ما بعد الجراحة' : 'Post-chirurgical' },
              { icon: '🏃', title: lang === 'ar' ? 'تحسين الأداء' : 'Optimisation Performance' },
            ]).map((s, i) => (
              <div key={i} className="sport-card fade-in">
                <div style={{ color: '#06B6D4', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>◆</div>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.6 }}>{lang === 'ar' ? 'تقنيات متقدمة لتحقيق أفضل النتائج' : 'Techniques avancées pour des résultats optimaux'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding: '96px 24px', background: '#111827' }}>
        <div className="two-col" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64 }}>
          <div style={{ flex: 1 }} className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 4, height: 36, background: 'linear-gradient(180deg, #06B6D4, #1D4ED8)', borderRadius: 2 }} />
              <span style={{ color: '#06B6D4', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'ar' ? 'من نحن' : 'À propos'}</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 800, color: 'white', marginBottom: 20, lineHeight: 1.2, textTransform: 'uppercase' }}>
              {content?.aboutTitle ?? (lang === 'ar' ? cabinet.nom : cabinet.nom)}
            </h2>
            <p style={{ color: '#94A3B8', fontSize: 16, lineHeight: 1.8, marginBottom: 28 }}>
              {content?.aboutText ?? (lang === 'ar'
                ? `في ${cabinet.nom}، نختص في كينيزيتيرابيا الرياضة وإعادة التأهيل. نستخدم أحدث التقنيات لمساعدتك على العودة إلى أفضل مستوياتك.`
                : `Au ${cabinet.nom}, nous sommes spécialisés en kinésithérapie du sport et rééducation. Nous utilisons les techniques les plus avancées pour vous aider à retrouver votre meilleur niveau.`)}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: '⚡', text: lang === 'ar' ? 'تقنيات متقدمة' : 'Techniques avancées' },
                { icon: '🎯', text: lang === 'ar' ? 'نتائج مضمونة' : 'Résultats garantis' },
                { icon: '🏆', text: lang === 'ar' ? 'خبراء معتمدون' : 'Experts certifiés' },
                { icon: '📊', text: lang === 'ar' ? 'متابعة رقمية' : 'Suivi digital' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(30,41,59,0.5)', borderRadius: 10, padding: '12px 16px', border: '1px solid rgba(6,182,212,0.1)' }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ color: '#CBD5E1', fontSize: 14, fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(6,182,212,0.2)', boxShadow: '0 0 40px rgba(6,182,212,0.15)', minHeight: 420 }} className="fade-in">
            <img src="https://res.cloudinary.com/djouneyaq/image/upload/v1779231315/kinesitherapeute-sport-1024x683_izcie4.jpg" alt="Cabinet sport" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 420 }} />
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" style={{ padding: '96px 24px', background: '#0F172A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }} className="fade-in">
            <div style={{ display: 'inline-block', background: 'rgba(6,182,212,0.1)', color: '#06B6D4', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Team</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: 'white', marginBottom: 12, textTransform: 'uppercase' }}>
              {content?.teamTitle ?? (lang === 'ar' ? 'فريقنا المتخصص' : 'Notre Équipe')}
            </h2>
            <p style={{ color: '#94A3B8', fontSize: 17 }}>
              {content?.teamSubtitle ?? (lang === 'ar' ? 'خبراء في كينيزيتيرابيا الرياضة' : 'Experts en kinésithérapie du sport')}
            </p>
          </div>
          <div className="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {(data.praticiens.length > 0 ? data.praticiens.map(p => ({
              key: p.id,
              initials: `${p.prenom[0]}${p.nom[0]}`,
              name: `${p.prenom} ${p.nom}`,
              spec: p.specialite,
            })) : [
              { key: '1', initials: 'KA', name: lang === 'ar' ? 'كريم الأمراني' : 'Karim Amrani', spec: lang === 'ar' ? 'كينيزيتيرابيا رياضية' : 'Kinésithérapie Sportive' },
              { key: '2', initials: 'LB', name: lang === 'ar' ? 'ليلى بنشقرون' : 'Leila Benchekroun', spec: lang === 'ar' ? 'إعادة تأهيل ما بعد الجراحة' : 'Rééducation Post-op' },
              { key: '3', initials: 'YO', name: lang === 'ar' ? 'يوسف الوزاني' : 'Youssef Ouazzani', spec: lang === 'ar' ? 'تحسين الأداء الرياضي' : 'Performance Sportive' },
            ]).map((p, i) => (
              <div key={p.key} className="team-card fade-in">
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(6,182,212,0.15)', border: '2px solid #06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4', fontWeight: 800, fontSize: 26, margin: '0 auto 16px', boxShadow: '0 0 16px rgba(6,182,212,0.3)' }}>
                  {p.initials}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 4 }}>Dr. {p.name}</h3>
                {p.spec && <p style={{ color: '#06B6D4', fontSize: 14, fontWeight: 600 }}>{p.spec}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING CTA */}
      <section style={{ padding: '96px 24px', background: '#111827', position: 'relative', overflow: 'hidden' }}>
        {/* Diagonal accent stripes */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(6,182,212,0.03) 40px, rgba(6,182,212,0.03) 80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #06B6D4, transparent)' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }} className="fade-in">
          <div style={{ display: 'inline-block', background: 'rgba(6,182,212,0.1)', color: '#06B6D4', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>
            {lang === 'ar' ? 'حجز موعد' : 'Réservation'}
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, color: 'white', marginBottom: 16, textTransform: 'uppercase' }}>
            {content?.bookingTitle ?? (lang === 'ar' ? 'ابدأ تعافيك اليوم' : 'Commencez Votre Récupération')}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 18, marginBottom: 48, lineHeight: 1.6 }}>
            {content?.bookingSubtitle ?? (lang === 'ar' ? 'احجز جلستك الأولى مع أخصائيينا' : 'Réservez votre première séance avec nos spécialistes')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <a href={bookingUrl} className="pulse-btn" style={{ background: 'linear-gradient(135deg, #06B6D4, #1D4ED8)', color: 'white', padding: '18px 48px', borderRadius: 8, fontWeight: 800, fontSize: 17, textDecoration: 'none', display: 'inline-block' }}>
              {lang === 'ar' ? 'احجز الآن' : 'Réserver maintenant'}
            </a>
            {cabinet.telephone && (
              <a href={`tel:${cabinet.telephone}`} style={{ color: '#06B6D4', padding: '18px 32px', borderRadius: 8, fontWeight: 600, fontSize: 16, textDecoration: 'none', border: '2px solid rgba(6,182,212,0.4)', display: 'inline-block', transition: 'border-color 0.2s' }}>
                📞 {cabinet.telephone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '96px 24px', background: '#111827' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }} className="fade-in">
            <div style={{ display: 'inline-block', background: 'rgba(6,182,212,0.1)', color: '#06B6D4', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              {lang === 'ar' ? 'آراء' : 'Avis'}
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>
              {content?.testimonialsTitle ?? (lang === 'ar' ? 'ماذا يقول رياضيونا' : 'Ils Témoignent')}
            </h2>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {(data.testimonials.length > 0 ? data.testimonials : [
              { id: '1', patientName: lang === 'ar' ? 'عمر الفهد' : 'Omar F.', textFr: 'Retour sur le terrain en un temps record. Une équipe au top qui connaît vraiment son métier.', textAr: 'عدت للملعب في وقت قياسي. فريق محترف حقيقي يعرف عمله جيداً.', rating: 5 },
              { id: '2', patientName: lang === 'ar' ? 'ريم الحداد' : 'Rim H.', textFr: 'Après ma rupture des ligaments, ce cabinet m\'a accompagnée jusqu\'à la compétition. Merci !', textAr: 'بعد تمزق الرباط، رافقني هذا المركز حتى العودة للمنافسة. شكراً!', rating: 5 },
              { id: '3', patientName: lang === 'ar' ? 'سفيان العلوي' : 'Soufiane A.', textFr: 'Techniques modernes, suivi personnalisé et résultats qui parlent d\'eux-mêmes. Je recommande !', textAr: 'تقنيات حديثة، متابعة شخصية ونتائج تتكلم بنفسها. أنصح بشدة!', rating: 5 },
            ] as typeof data.testimonials).map((t, i) => (
              <div key={t.id} className="testi-card fade-in">
                <div style={{ fontSize: 40, color: '#06B6D4', lineHeight: 1, marginBottom: 16, fontFamily: 'Georgia, serif', textShadow: '0 0 12px rgba(6,182,212,0.4)' }}>"</div>
                <p style={{ color: '#CBD5E1', fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
                  {lang === 'ar' ? t.textAr : t.textFr}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>{t.patientName}</span>
                  <div style={{ color: '#06B6D4', fontSize: 14 }}>{'★'.repeat(t.rating)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: '96px 24px', background: '#0F172A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }} className="fade-in">
            <div style={{ display: 'inline-block', background: 'rgba(6,182,212,0.1)', color: '#06B6D4', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Contact</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: 'white', textTransform: 'uppercase', marginBottom: 12 }}>
              {content?.contactTitle ?? (lang === 'ar' ? 'تواصل معنا' : 'Nous Contacter')}
            </h2>
            <p style={{ color: '#94A3B8', fontSize: 17 }}>{cabinet.adresse ?? cabinet.ville}</p>
          </div>
          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20, marginBottom: 40 }}>
            {cabinet.telephone && (
              <div className="contact-card fade-in">
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📞</div>
                <div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lang === 'ar' ? 'الهاتف' : 'Téléphone'}</div>
                  <a href={`tel:${cabinet.telephone}`} style={{ color: '#06B6D4', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>{cabinet.telephone}</a>
                </div>
              </div>
            )}
            {cabinet.email && (
              <div className="contact-card fade-in">
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>✉️</div>
                <div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</div>
                  <a href={`mailto:${cabinet.email}`} style={{ color: '#06B6D4', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>{cabinet.email}</a>
                </div>
              </div>
            )}
            {cabinet.adresse && (
              <div className="contact-card fade-in">
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📍</div>
                <div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lang === 'ar' ? 'العنوان' : 'Adresse'}</div>
                  <span style={{ color: '#E2E8F0', fontWeight: 600, fontSize: 15 }}>{cabinet.adresse}</span>
                </div>
              </div>
            )}
            {cabinet.whatsappNumber && (
              <div className="contact-card fade-in">
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>💬</div>
                <div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>WhatsApp</div>
                  <a href={`https://wa.me/${cabinet.whatsappNumber}`} target="_blank" rel="noopener noreferrer" style={{ color: '#4ADE80', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
                    {cabinet.whatsappNumber}
                  </a>
                </div>
              </div>
            )}
          </div>
          {data.site.googleMapsEmbed && (
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(6,182,212,0.2)', boxShadow: '0 0 32px rgba(6,182,212,0.1)' }} className="fade-in">
              <iframe src={data.site.googleMapsEmbed} width="100%" height="360" style={{ border: 'none', display: 'block' }} loading="lazy" />
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#020617', padding: '40px 24px', borderTop: '1px solid rgba(6,182,212,0.2)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4', fontWeight: 800, fontSize: 16, boxShadow: '0 0 8px rgba(6,182,212,0.3)' }}>K</div>
            <span style={{ fontWeight: 700, color: '#E2E8F0', fontSize: 16 }}>{cabinet.nom}</span>
          </div>
          <span style={{ color: '#475569', fontSize: 13 }}>
            Propulsé par <a href="https://kinepro-omega.vercel.app" style={{ color: '#06B6D4', fontWeight: 600, textDecoration: 'none' }}>KinéPro</a>
          </span>
        </div>
      </footer>
    </div>
  )
}
