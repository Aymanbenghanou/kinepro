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

export default function WarmTemplate({ data }: { data: SiteData }) {
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
    { number: '500+', label: lang === 'ar' ? 'مريض راضٍ' : 'Patients satisfaits' },
    { number: '10+', label: lang === 'ar' ? 'سنوات خبرة' : 'Années d\'expérience' },
    { number: '98%', label: lang === 'ar' ? 'نسبة النجاح' : 'Taux de réussite' },
    { number: '15+', label: lang === 'ar' ? 'خدمة متخصصة' : 'Services spécialisés' },
  ]
  const stats = content?.stats ?? defaultStats

  const fontFamily = isRTL ? "'Cairo', sans-serif" : "'Segoe UI', system-ui, sans-serif"

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily, background: '#FFF7ED', color: '#1C1917', minHeight: '100vh' }}>
      <style>{`
        .fade-in { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .fade-in.visible { opacity: 1; transform: none; }
        .warm-nav-link { color: #1C1917; text-decoration: none; font-weight: 500; font-size: 15px; padding: 4px 0; border-bottom: 2px solid transparent; transition: color 0.2s, border-color 0.2s; }
        .warm-nav-link:hover { color: #0D9488; border-bottom-color: #0D9488; }
        .warm-card { background: white; border: 1px solid #FED7AA; border-top: 4px solid #0D9488; border-radius: 16px; padding: 28px; transition: box-shadow 0.3s, transform 0.3s; }
        .warm-card:hover { box-shadow: -6px 0 0 0 #0D9488, 0 8px 32px rgba(13,148,136,0.12); transform: translateY(-4px); }
        .team-card { background: white; border-radius: 20px; padding: 28px 20px; text-align: center; transition: box-shadow 0.3s, transform 0.3s; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .team-card:hover { box-shadow: 0 12px 40px rgba(13,148,136,0.18); transform: translateY(-6px); }
        .testi-card { background: white; border-radius: 16px; padding: 28px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); transition: box-shadow 0.3s; }
        .testi-card:hover { box-shadow: 0 8px 32px rgba(13,148,136,0.14); }
        .contact-info-card { background: white; border-radius: 14px; padding: 20px 24px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .hamburger { display: none !important; }
        @media (max-width: 768px) {
          .hamburger { display: flex !important; background: none; border: none; cursor: pointer; font-size: 24px; }
          .nav-links { display: none !important; }
          .nav-links.open { display: flex !important; flex-direction: column; position: absolute; top: 68px; left: 0; right: 0; background: white; padding: 20px; gap: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); z-index: 100; }
          .hero-cta-card { flex-direction: column !important; }
          .two-col { flex-direction: column !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .services-grid { grid-template-columns: 1fr !important; }
          .team-grid { grid-template-columns: repeat(2,1fr) !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '0 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {cabinet.logoUrl
              ? <img src={cabinet.logoUrl} alt={cabinet.nom} style={{ height: 42, width: 42, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 20 }}>K</div>
            }
            <span style={{ fontWeight: 700, fontSize: 17, color: '#1C1917' }}>{cabinet.nom}</span>
          </div>
          <div className={`nav-links${menuOpen ? ' open' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="#services" className="warm-nav-link">{lang === 'ar' ? 'خدماتنا' : 'Services'}</a>
            <a href="#about" className="warm-nav-link">{lang === 'ar' ? 'من نحن' : 'À propos'}</a>
            <a href="#team" className="warm-nav-link">{lang === 'ar' ? 'الفريق' : 'Équipe'}</a>
            <a href="#contact" className="warm-nav-link">{lang === 'ar' ? 'اتصل بنا' : 'Contact'}</a>
            <a href={bookingUrl} style={{ background: '#F59E0B', color: 'white', padding: '9px 22px', borderRadius: 999, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
              {lang === 'ar' ? 'احجز موعداً' : 'Prendre RDV'}
            </a>
            <button onClick={toggleLang} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, border: '1.5px solid #0D9488', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: 'transparent', color: '#0D9488' }}>
              {lang === 'fr' ? 'ع عربي' : 'FR'}
            </button>
          </div>
          <button onClick={() => setMenuOpen(o => !o)} className="hamburger">☰</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(https://res.cloudinary.com/djouneyaq/image/upload/v1779231314/KINESENS-centre-de-kinesitherapie-Luxembourg-reeducation-mobilite-illu12-pediatrique-min_oeixyt.webp)`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,148,136,0.65)' }} />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: 800 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, padding: '6px 20px', marginBottom: 24, color: 'white', fontSize: 14, fontWeight: 600 }}>
            {cabinet.ville}
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 800, color: 'white', margin: '0 0 20px', lineHeight: 1.15, textShadow: '0 2px 16px rgba(0,0,0,0.3)' }}>
            {content?.heroTitle ?? cabinet.nom}
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', color: 'rgba(255,255,255,0.92)', marginBottom: 40, lineHeight: 1.6 }}>
            {content?.heroSubtitle ?? (lang === 'ar' ? 'رعاية صحية متخصصة بلمسة إنسانية دافئة' : 'Des soins kinésithérapeutiques avec une touche humaine et chaleureuse')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <a href={bookingUrl} style={{ background: '#F59E0B', color: 'white', padding: '14px 36px', borderRadius: 999, fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 20px rgba(245,158,11,0.5)' }}>
              {lang === 'ar' ? 'احجز موعداً' : 'Réserver une séance'}
            </a>
            <a href="#services" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: 'white', padding: '14px 36px', borderRadius: 999, fontWeight: 600, fontSize: 16, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.5)' }}>
              {lang === 'ar' ? 'خدماتنا' : 'Nos services'}
            </a>
          </div>
        </div>
        {/* Frosted glass CTA card */}
        <div className="hero-cta-card" style={{ position: 'relative', zIndex: 2, marginTop: 60, display: 'flex', alignItems: 'center', gap: 32, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '24px 40px', color: 'white', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{lang === 'ar' ? 'اعتنِ بنفسك' : 'Prenez soin de vous'}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>{cabinet.workingDays} · {cabinet.workStartTime} – {cabinet.workEndTime}</div>
          </div>
          <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.4)' }} />
          {(['🌿 Approche douce', '👨‍👩‍👧 Toute la famille', '🕐 Flexible'] as string[]).map(badge => (
            <span key={badge} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '6px 16px', fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)' }}>{badge}</span>
          ))}
        </div>
      </section>

      {/* Wavy divider */}
      <svg viewBox="0 0 1440 80" style={{ marginTop: -1, display: 'block', background: '#FFF7ED' }} preserveAspectRatio="none">
        <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#CCFBF1" />
      </svg>

      {/* STATS BAR */}
      <section ref={statsRef} style={{ background: '#CCFBF1', padding: '48px 24px' }}>
        <div className="stats-grid" style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
          {stats.map((s, i) => (
            <div key={i} className="fade-in">
              <div style={{ fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 800, color: '#0D9488', lineHeight: 1 }}>{s.number}</div>
              <div style={{ fontSize: 14, color: '#374151', marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: '96px 24px', background: '#FFF7ED' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }} className="fade-in">
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: '#0D9488', marginBottom: 12 }}>
              {content?.servicesTitle ?? (lang === 'ar' ? 'خدماتنا' : 'Nos Services')}
            </h2>
            <p style={{ color: '#78716C', fontSize: 17, maxWidth: 600, margin: '0 auto' }}>
              {content?.servicesSubtitle ?? (lang === 'ar' ? 'نقدم مجموعة شاملة من خدمات إعادة التأهيل' : 'Une prise en charge complète et personnalisée')}
            </p>
          </div>
          <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {data.seanceTypes.length > 0 ? data.seanceTypes.map((s, i) => (
              <div key={s.id} className="warm-card fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}>
                  <ServiceIcon nom={s.nom} size={26} color="white" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0D9488', marginBottom: 8 }}>{s.nom}</h3>
                {s.description && <p style={{ color: '#78716C', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{s.description}</p>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {s.dureeDefaut && <span style={{ background: '#CCFBF1', color: '#0D9488', borderRadius: 999, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>{s.dureeDefaut} min</span>}
                  {s.tarifDefaut && <span style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 999, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>{s.tarifDefaut} MAD</span>}
                </div>
                <a href="#booking" style={{ marginTop: 'auto', color: '#0D9488', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {lang === 'ar' ? 'احجز ←' : 'Réserver →'}
                </a>
              </div>
            )) : ([
              { icon: '🦴', title: lang === 'ar' ? 'علاج عضلي هيكلي' : 'Thérapie Musculo-Squelettique' },
              { icon: '🧘', title: lang === 'ar' ? 'إعادة التأهيل' : 'Rééducation Fonctionnelle' },
              { icon: '🏃', title: lang === 'ar' ? 'طب الرياضة' : 'Kinésithérapie du Sport' },
              { icon: '👶', title: lang === 'ar' ? 'علاج الأطفال' : 'Pédiatrie' },
              { icon: '🫁', title: lang === 'ar' ? 'علاج التنفس' : 'Kinésithérapie Respiratoire' },
              { icon: '🧓', title: lang === 'ar' ? 'طب الشيخوخة' : 'Gériatrie' },
            ]).map((s, i) => (
              <div key={i} className="warm-card fade-in">
                <div style={{ fontSize: 32, marginBottom: 16 }}>{s.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0D9488', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: '#78716C', fontSize: 14, lineHeight: 1.6 }}>{lang === 'ar' ? 'رعاية متخصصة وشخصية لكل مريض' : 'Une prise en charge personnalisée et bienveillante'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding: '96px 24px', background: '#FFFBF5' }}>
        <div className="two-col" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64 }}>
          <div style={{ flex: 1 }} className="fade-in">
            <div style={{ display: 'inline-block', background: '#CCFBF1', color: '#0D9488', borderRadius: 999, padding: '5px 18px', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
              {lang === 'ar' ? 'من نحن' : 'À propos de nous'}
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 800, color: '#0D9488', marginBottom: 20, lineHeight: 1.2 }}>
              {content?.aboutTitle ?? (lang === 'ar' ? `مرحباً بكم في ${cabinet.nom}` : `Bienvenue au ${cabinet.nom}`)}
            </h2>
            <p style={{ color: '#57534E', fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>
              {content?.aboutText ?? (lang === 'ar'
                ? `في ${cabinet.nom}، نجمع بين الكفاءة المهنية والرعاية الإنسانية. نؤمن أن كل مريض يستحق اهتماماً فردياً ورعاية شاملة.`
                : `Au ${cabinet.nom}, nous conjuguons expertise clinique et bienveillance humaine. Chaque patient mérite une attention individuelle et des soins de qualité adaptés à ses besoins.`)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                lang === 'ar' ? 'فريق متخصص ومؤهل' : 'Équipe qualifiée et spécialisée',
                lang === 'ar' ? 'أجهزة حديثة ومتطورة' : 'Équipements modernes',
                lang === 'ar' ? 'متابعة شخصية لكل مريض' : 'Suivi personnalisé',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#0D9488', fontSize: 18 }}>✓</span>
                  <span style={{ color: '#44403C', fontSize: 15, fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 64px rgba(13,148,136,0.2)', minHeight: 420 }} className="fade-in">
            <img src="https://res.cloudinary.com/djouneyaq/image/upload/v1779193379/kinepro/documents/s6mshtgzkshlw9fjvao7.jpg" alt="Cabinet" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 420 }} />
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" style={{ padding: '96px 24px', background: '#FFF7ED' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }} className="fade-in">
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: '#0D9488', marginBottom: 12 }}>
              {content?.teamTitle ?? (lang === 'ar' ? 'فريقنا الطبي' : 'Notre Équipe')}
            </h2>
            <p style={{ color: '#78716C', fontSize: 17 }}>
              {content?.teamSubtitle ?? (lang === 'ar' ? 'متخصصون ملتزمون بصحتكم' : 'Des professionnels dévoués à votre santé')}
            </p>
          </div>
          <div className="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {(data.praticiens.length > 0 ? data.praticiens.map((p, i) => ({
              key: p.id,
              initials: `${p.prenom[0]}${p.nom[0]}`,
              name: `${p.prenom} ${p.nom}`,
              spec: p.specialite,
            })) : [
              { key: '1', initials: 'AK', name: lang === 'ar' ? 'أحمد الكريمي' : 'Ahmed Karimi', spec: lang === 'ar' ? 'كينيزيتيرابيا رياضية' : 'Kinésithérapie Sportive' },
              { key: '2', initials: 'SB', name: lang === 'ar' ? 'سارة بنعلي' : 'Sara Benali', spec: lang === 'ar' ? 'كينيزيتيرابيا تنفسية' : 'Kinésithérapie Respiratoire' },
              { key: '3', initials: 'MR', name: lang === 'ar' ? 'محمد الرشيدي' : 'Mohamed Rachidi', spec: lang === 'ar' ? 'إعادة التأهيل' : 'Rééducation' },
            ]).map((p, i) => (
              <div key={p.key} className="team-card fade-in">
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 26, margin: '0 auto 16px' }}>
                  {p.initials}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1C1917', marginBottom: 4 }}>Dr. {p.name}</h3>
                {p.spec && <p style={{ color: '#0D9488', fontSize: 14, fontWeight: 600 }}>{p.spec}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING CTA */}
      <section style={{ padding: '96px 24px', background: 'linear-gradient(135deg, #0D9488, #0F766E)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }} className="fade-in">
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: 'white', marginBottom: 16 }}>
            {content?.bookingTitle ?? (lang === 'ar' ? 'احجز موعدك الآن' : 'Prenez Rendez-vous')}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 18, marginBottom: 40, lineHeight: 1.6 }}>
            {content?.bookingSubtitle ?? (lang === 'ar' ? 'حجز سريع وسهل عبر الإنترنت' : 'Réservation rapide et facile en ligne')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <a href={bookingUrl} style={{ background: '#F59E0B', color: 'white', padding: '16px 44px', borderRadius: 999, fontWeight: 800, fontSize: 17, textDecoration: 'none', boxShadow: '0 4px 24px rgba(245,158,11,0.5)' }}>
              {lang === 'ar' ? 'احجز الآن' : 'Réserver maintenant'}
            </a>
            {cabinet.telephone && (
              <a href={`tel:${cabinet.telephone}`} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '16px 32px', borderRadius: 999, fontWeight: 600, fontSize: 16, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)' }}>
                📞 {cabinet.telephone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '96px 24px', background: '#FFFBF5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }} className="fade-in">
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: '#0D9488', marginBottom: 12 }}>
              {content?.testimonialsTitle ?? (lang === 'ar' ? 'آراء مرضانا' : 'Témoignages')}
            </h2>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {(data.testimonials.length > 0 ? data.testimonials : [
              { id: '1', patientName: lang === 'ar' ? 'فاطمة الزهراء' : 'Fatima Z.', textFr: 'Excellent cabinet, des soins de qualité et une équipe très professionnelle et humaine.', textAr: 'مركز ممتاز، خدمات عالية الجودة وفريق محترف ومتفهم.', rating: 5 },
              { id: '2', patientName: lang === 'ar' ? 'يوسف المنصوري' : 'Youssef M.', textFr: 'Très satisfait de ma rééducation. Résultats rapides et accompagnement bienveillant.', textAr: 'سعيد جداً بإعادة التأهيل. نتائج سريعة ومتابعة ممتازة.', rating: 5 },
              { id: '3', patientName: lang === 'ar' ? 'نجوى الحسني' : 'Nadia H.', textFr: 'Une approche douce et efficace. Je recommande vivement ce cabinet à tous.', textAr: 'نهج لطيف وفعّال. أنصح به بشدة للجميع.', rating: 5 },
            ] as typeof data.testimonials).map((t, i) => (
              <div key={t.id} className="testi-card fade-in">
                <div style={{ fontSize: 40, color: '#0D9488', lineHeight: 1, marginBottom: 12, fontFamily: 'Georgia, serif' }}>«</div>
                <p style={{ color: '#57534E', fontSize: 15, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 16 }}>
                  {lang === 'ar' ? t.textAr : t.textFr}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#1C1917', fontSize: 14 }}>{t.patientName}</span>
                  <div style={{ color: '#F59E0B', fontSize: 14 }}>{'★'.repeat(t.rating)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: '96px 24px', background: '#0D9488' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }} className="fade-in">
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, color: 'white', marginBottom: 12 }}>
              {content?.contactTitle ?? (lang === 'ar' ? 'تواصل معنا' : 'Nous Contacter')}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17 }}>{cabinet.adresse ?? cabinet.ville}</p>
          </div>
          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 24, marginBottom: 40 }}>
            {cabinet.telephone && (
              <div className="contact-info-card fade-in">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📞</div>
                <div>
                  <div style={{ fontSize: 12, color: '#78716C', fontWeight: 600, marginBottom: 2 }}>{lang === 'ar' ? 'الهاتف' : 'Téléphone'}</div>
                  <a href={`tel:${cabinet.telephone}`} style={{ color: '#0D9488', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>{cabinet.telephone}</a>
                </div>
              </div>
            )}
            {cabinet.email && (
              <div className="contact-info-card fade-in">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>✉️</div>
                <div>
                  <div style={{ fontSize: 12, color: '#78716C', fontWeight: 600, marginBottom: 2 }}>Email</div>
                  <a href={`mailto:${cabinet.email}`} style={{ color: '#0D9488', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>{cabinet.email}</a>
                </div>
              </div>
            )}
            {cabinet.adresse && (
              <div className="contact-info-card fade-in">
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📍</div>
                <div>
                  <div style={{ fontSize: 12, color: '#78716C', fontWeight: 600, marginBottom: 2 }}>{lang === 'ar' ? 'العنوان' : 'Adresse'}</div>
                  <span style={{ color: '#1C1917', fontWeight: 600, fontSize: 15 }}>{cabinet.adresse}</span>
                </div>
              </div>
            )}
            {cabinet.whatsappNumber && (
              <div className="contact-info-card fade-in" style={{ gridColumn: '1 / -1' }}>
                <WhatsAppContactButton whatsappNumber={cabinet.whatsappNumber} cabinetName={cabinet.nom} lang={lang} />
              </div>
            )}
          </div>
          {data.site.googleMapsEmbed && (
            <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} className="fade-in">
              <iframe src={data.site.googleMapsEmbed} width="100%" height="360" style={{ border: 'none', display: 'block' }} loading="lazy" />
            </div>
          )}
        </div>
      </section>

      {cabinet.whatsappNumber && <WhatsAppFloatingButton whatsappNumber={cabinet.whatsappNumber} cabinetName={cabinet.nom} lang={lang} />}

      {/* FOOTER */}
      <footer style={{ background: 'white', padding: '40px 24px', borderTop: '1px solid #FED7AA' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16 }}>K</div>
            <span style={{ fontWeight: 700, color: '#1C1917', fontSize: 16 }}>{cabinet.nom}</span>
          </div>
          <span style={{ color: '#A8A29E', fontSize: 13 }}>
            Propulsé par <a href="https://kinepro-omega.vercel.app" style={{ color: '#0D9488', fontWeight: 600, textDecoration: 'none' }}>KinéPro</a>
          </span>
        </div>
      </footer>
    </div>
  )
}
