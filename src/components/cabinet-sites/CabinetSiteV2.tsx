'use client'

import { useState, useEffect, useRef } from 'react'
import { ServiceIcon, WhatsAppFloatingButton, WhatsAppContactButton } from './CabinetSiteShared'

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface SeanceType {
  id: string
  nom: string
  dureeDefaut?: number | null
  tarifDefaut?: number | null
  description?: string | null
}

interface Praticien {
  id: string
  nom: string
  prenom: string
  specialite?: string | null
}

interface Testimonial {
  id: string
  patientName: string
  textFr: string
  textAr: string
  rating: number
}

interface CabinetData {
  cabinet: {
    nom: string
    ville: string
    adresse?: string | null
    telephone?: string | null
    email?: string | null
    whatsappNumber?: string | null
    slug: string
    logoUrl?: string | null
    workStartTime: string
    workEndTime: string
    workingDays: string
  }
  site: {
    templateId: string
    primaryColor: string
    secondaryColor: string
    contentFr?: Record<string, any> | null
    contentAr?: Record<string, any> | null
    heroImageUrl?: string | null
    googleMapsEmbed?: string | null
  }
  seanceTypes: SeanceType[]
  praticiens: Praticien[]
  testimonials: Testimonial[]
}

// ── Template configs ──────────────────────────────────────────────────────────

const TEMPLATE_CONFIGS = {
  medical: {
    defaultPrimary: '#2563EB',
    defaultSecondary: '#1E3A5F',
    accentColor: '#DBEAFE',
    bgColor: '#F8FAFF',
    cardBg: '#FFFFFF',
    textColor: '#1E293B',
    subtleColor: '#64748B',
    isDark: false,
    borderRadius: '14px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    heroImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1920&q=80',
  },
  premium: {
    defaultPrimary: '#C9A227',
    defaultSecondary: '#1A1A2E',
    accentColor: '#FFF8E7',
    bgColor: '#0F0F1A',
    cardBg: '#1A1A2E',
    textColor: '#E2E8F0',
    subtleColor: '#94A3B8',
    isDark: true,
    borderRadius: '8px',
    fontFamily: 'Georgia, "Times New Roman", serif',
    heroImage: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1920&q=80',
  },
  warm: {
    defaultPrimary: '#0D9488',
    defaultSecondary: '#065F46',
    accentColor: '#CCFBF1',
    bgColor: '#FFFBF5',
    cardBg: '#FFFFFF',
    textColor: '#1C1917',
    subtleColor: '#78716C',
    isDark: false,
    borderRadius: '18px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    heroImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1920&q=80',
  },
  sport: {
    defaultPrimary: '#06B6D4',
    defaultSecondary: '#1D4ED8',
    accentColor: '#164E63',
    bgColor: '#0A0F1E',
    cardBg: '#111827',
    textColor: '#E2E8F0',
    subtleColor: '#94A3B8',
    isDark: true,
    borderRadius: '8px',
    fontFamily: '"Inter", system-ui, sans-serif',
    heroImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1920&q=80',
  },
} as const

type TemplateId = keyof typeof TEMPLATE_CONFIGS

// ── Default services fallback ─────────────────────────────────────────────────

const DEFAULT_SERVICES_FR: SeanceType[] = [
  { id: 'f1', nom: 'Rééducation musculo-squelettique', dureeDefaut: 45, tarifDefaut: null, description: null },
  { id: 'f2', nom: 'Kinésithérapie du sport', dureeDefaut: 60, tarifDefaut: null, description: null },
  { id: 'f3', nom: 'Massage thérapeutique', dureeDefaut: 30, tarifDefaut: null, description: null },
  { id: 'f4', nom: 'Rééducation respiratoire', dureeDefaut: 45, tarifDefaut: null, description: null },
  { id: 'f5', nom: 'Bilan articulaire', dureeDefaut: 60, tarifDefaut: null, description: null },
  { id: 'f6', nom: 'Rééducation post-opératoire', dureeDefaut: 45, tarifDefaut: null, description: null },
]
const DEFAULT_SERVICES_AR: SeanceType[] = [
  { id: 'a1', nom: 'علاج عضلي هيكلي', dureeDefaut: 45, tarifDefaut: null, description: null },
  { id: 'a2', nom: 'كينيزيتيرابيا الرياضة', dureeDefaut: 60, tarifDefaut: null, description: null },
  { id: 'a3', nom: 'مساج علاجي', dureeDefaut: 30, tarifDefaut: null, description: null },
  { id: 'a4', nom: 'علاج تنفسي', dureeDefaut: 45, tarifDefaut: null, description: null },
  { id: 'a5', nom: 'تقييم مفصلي', dureeDefaut: 60, tarifDefaut: null, description: null },
  { id: 'a6', nom: 'إعادة تأهيل ما بعد الجراحة', dureeDefaut: 45, tarifDefaut: null, description: null },
]

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: string, active: boolean): string {
  const [value, setValue] = useState('0')
  useEffect(() => {
    if (!active) return
    const num = parseInt(target.replace(/\D/g, ''), 10)
    const suffix = target.replace(/\d/g, '')
    if (isNaN(num)) { setValue(target); return }
    let current = 0
    const step = Math.max(1, Math.ceil(num / 80))
    const timer = setInterval(() => {
      current = Math.min(current + step, num)
      setValue(current + suffix)
      if (current >= num) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [active, target])
  return value
}

// ── Stat item ─────────────────────────────────────────────────────────────────

function StatItem({ stat, active }: { stat: { number: string; label: string }; active: boolean }) {
  const value = useCountUp(stat.number, active)
  return (
    <div style={{ textAlign: 'center', color: 'white' }}>
      <div style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)', fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 14, opacity: 0.85, fontWeight: 500 }}>{stat.label}</div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CabinetSiteV2({ data }: { data: CabinetData }) {
  const { cabinet, site, seanceTypes, praticiens, testimonials } = data

  const tplId: TemplateId = (site.templateId in TEMPLATE_CONFIGS ? site.templateId : 'medical') as TemplateId
  const tpl = TEMPLATE_CONFIGS[tplId]
  const primary = site.primaryColor || tpl.defaultPrimary
  const secondary = site.secondaryColor || tpl.defaultSecondary
  const { isDark, accentColor, bgColor, cardBg, textColor, subtleColor, borderRadius } = tpl
  const heroImage = site.heroImageUrl || tpl.heroImage

  const [lang, setLang] = useState<'fr' | 'ar'>('fr')
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [showMobileCta, setShowMobileCta] = useState(false) // hidden until first scroll
  const [statsActive, setStatsActive] = useState(false)
  const [svcIndex, setSvcIndex] = useState(0)
  const [showSwipeHint, setShowSwipeHint] = useState(true)
  const lastScrollY = useRef(0)
  const statsRef = useRef<HTMLDivElement>(null)
  const svcScrollRef = useRef<HTMLDivElement>(null)

  const isRTL = lang === 'ar'
  const content = ((isRTL ? site.contentAr : site.contentFr) ?? {}) as SiteContent
  const defaultStats = [
    { number: '500+', label: isRTL ? 'مريض' : 'Patients' },
    { number: '10+', label: isRTL ? 'سنوات خبرة' : "Ans d'exp." },
    { number: '98%', label: isRTL ? 'رضا المرضى' : 'Satisfaction' },
  ]
  const stats = content.stats ?? defaultStats
  const defaultServices = isRTL ? DEFAULT_SERVICES_AR : DEFAULT_SERVICES_FR
  const displayServices = seanceTypes.length > 0 ? seanceTypes : defaultServices

  // Scroll handler
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 60)
      setShowBackToTop(y > 400)
      if (y > 200) setShowMobileCta(y < lastScrollY.current)
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cairo font for Arabic
  useEffect(() => {
    if (!isRTL) return
    const id = 'cairo-font'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [isRTL])

  // Fade-in observer
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.v2-fade')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('v2-visible')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.08 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  })

  // Stats counter trigger
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setStatsActive(true); io.disconnect() }
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Lock scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Services carousel — track active card on scroll
  useEffect(() => {
    const el = svcScrollRef.current
    if (!el) return
    const onScroll = () => {
      const card = el.querySelector<HTMLElement>('.v2-svc-card')
      if (!card) return
      const cardW = card.offsetWidth + 16 // gap
      const idx = Math.round(el.scrollLeft / cardW)
      setSvcIndex(idx)
      if (el.scrollLeft > 20) setShowSwipeHint(false)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Hide swipe hint after 2.5s
  useEffect(() => {
    const t = setTimeout(() => setShowSwipeHint(false), 2500)
    return () => clearTimeout(t)
  }, [])

  const navItems = [
    { label: isRTL ? 'الخدمات' : 'Services', href: '#services' },
    { label: isRTL ? 'من نحن' : 'À propos', href: '#about' },
    ...(praticiens.length > 0 ? [{ label: isRTL ? 'الفريق' : 'Équipe', href: '#team' }] : []),
    ...(testimonials.length > 0 ? [{ label: isRTL ? 'آراء المرضى' : 'Témoignages', href: '#testimonials' }] : []),
    { label: isRTL ? 'اتصل بنا' : 'Contact', href: '#contact' },
  ]

  const css = `
    ${tplId === 'premium' ? "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap');" : ''}
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .v2-fade { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }
    .v2-fade.v2-visible { opacity: 1; transform: none; }

    /* ── Navbar ── */
    .v2-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      padding: 0 20px;
      transition: background 0.3s, box-shadow 0.3s, backdrop-filter 0.3s;
    }
    .v2-nav.scrolled {
      background: ${isDark ? 'rgba(10,15,30,0.94)' : 'rgba(255,255,255,0.94)'};
      backdrop-filter: blur(14px);
      box-shadow: 0 2px 24px rgba(0,0,0,${isDark ? '0.4' : '0.1'});
    }
    .v2-nav-inner {
      max-width: 1240px; margin: 0 auto;
      height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .v2-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; flex-shrink: 0; }
    .v2-logo-circle {
      width: 38px; height: 38px; border-radius: 10px;
      background: ${primary}; display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 800; font-size: 17px; flex-shrink: 0;
    }
    .v2-logo-name {
      font-weight: 700; font-size: 15px; max-width: 28vw;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      color: white; transition: color 0.3s;
    }
    .v2-nav.scrolled .v2-logo-name { color: ${textColor}; }

    .v2-nav-desktop { display: none; align-items: center; gap: 2px; }
    .v2-nav-link {
      padding: 8px 13px; border-radius: 8px;
      color: rgba(255,255,255,0.85); font-weight: 600; font-size: 14px;
      text-decoration: none; transition: color 0.15s, background 0.15s;
    }
    .v2-nav.scrolled .v2-nav-link { color: ${subtleColor}; }
    .v2-nav-link:hover { background: ${primary}22; color: ${primary}; }

    .v2-lang { display: flex; background: rgba(255,255,255,0.15); border-radius: 999px; padding: 3px; }
    .v2-lang-btn {
      padding: 5px 12px; border-radius: 999px; border: none; cursor: pointer;
      font-weight: 700; font-size: 13px; transition: all 0.2s;
    }
    .v2-lang-btn.active { background: white; color: ${primary}; }
    .v2-lang-btn:not(.active) { background: transparent; color: rgba(255,255,255,0.8); }

    .v2-hamburger {
      width: 48px; height: 48px; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 5px;
      background: none; border: none; cursor: pointer; padding: 8px; border-radius: 8px;
    }
    .v2-hamburger span {
      display: block; width: 22px; height: 2px; border-radius: 2px;
      background: white; transition: background 0.3s;
    }
    .v2-nav.scrolled .v2-hamburger span { background: ${textColor}; }

    /* ── Full-screen overlay menu ── */
    .v2-overlay {
      position: fixed; inset: 0; z-index: 200;
      background: ${isDark ? '#0A0F1E' : primary};
      display: flex; flex-direction: column; padding: 20px 28px 40px;
      transform: translateX(100%);
      transition: transform 0.38s cubic-bezier(0.4,0,0.2,1);
      overflow-y: auto;
    }
    .v2-overlay.open { transform: none; }
    .v2-overlay-close {
      align-self: flex-end; width: 48px; height: 48px;
      background: rgba(255,255,255,0.15); border: none; border-radius: 50%;
      color: white; font-size: 22px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; margin-bottom: 32px;
    }
    .v2-overlay-link {
      display: block; color: white; text-decoration: none;
      font-size: clamp(1.5rem,5vw,2rem); font-weight: 700;
      padding: 18px 0; border-bottom: 1px solid rgba(255,255,255,0.12);
      opacity: 0; transform: translateX(20px);
      transition: opacity 0.3s, transform 0.3s;
    }
    .v2-overlay.open .v2-overlay-link { opacity: 1; transform: none; }
    .v2-overlay.open .v2-overlay-link:nth-child(3) { transition-delay: 0.06s; }
    .v2-overlay.open .v2-overlay-link:nth-child(4) { transition-delay: 0.12s; }
    .v2-overlay.open .v2-overlay-link:nth-child(5) { transition-delay: 0.18s; }
    .v2-overlay.open .v2-overlay-link:nth-child(6) { transition-delay: 0.24s; }
    .v2-overlay.open .v2-overlay-link:nth-child(7) { transition-delay: 0.30s; }

    /* ── Hero ── */
    .v2-hero { position: relative; min-height: 100svh; display: flex; align-items: center; overflow: hidden; }
    .v2-hero-bg {
      position: absolute; inset: 0;
      background-image: url('${heroImage}');
      background-size: cover; background-position: center;
      transform-origin: center;
    }
    .v2-hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(160deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.38) 55%, rgba(0,0,0,0.65) 100%);
    }
    .v2-hero-content {
      position: relative; z-index: 2;
      max-width: 1240px; margin: 0 auto;
      padding: 100px 24px 140px; width: 100%;
    }
    .v2-hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.14); backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.28);
      color: white; border-radius: 999px; padding: 7px 18px;
      font-size: 13px; font-weight: 600; margin-bottom: 24px;
    }
    .v2-hero-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ADE80; }
    .v2-hero-h1 {
      font-size: clamp(2.2rem,7vw,4.2rem); font-weight: 800;
      color: white; line-height: 1.08; margin-bottom: 20px;
      ${tplId === 'premium' ? 'font-family: "Playfair Display", Georgia, serif;' : ''}
    }
    .v2-hero-sub {
      font-size: clamp(1rem,2.8vw,1.25rem);
      color: rgba(255,255,255,0.82); margin-bottom: 40px;
      max-width: 540px; line-height: 1.65;
    }
    .v2-hero-btns { display: flex; flex-direction: column; gap: 12px; max-width: 360px; }
    .v2-btn-white {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 15px 28px; background: white; color: ${primary};
      border-radius: 13px; font-weight: 700; font-size: 16px;
      text-decoration: none; min-height: 52px;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .v2-btn-white:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(0,0,0,0.25); }
    .v2-btn-ghost {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 15px 28px; border: 2px solid rgba(255,255,255,0.65);
      color: white; border-radius: 13px; font-weight: 700; font-size: 16px;
      text-decoration: none; min-height: 52px;
      transition: background 0.15s, border-color 0.15s;
    }
    .v2-btn-ghost:hover { background: rgba(255,255,255,0.15); border-color: white; }

    .v2-scroll-bounce {
      position: absolute; bottom: 88px; left: 50%; transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      color: rgba(255,255,255,0.6); z-index: 2;
      animation: v2bounce 2.2s ease-in-out infinite;
    }
    [dir="rtl"] .v2-scroll-bounce { left: auto; right: 50%; transform: translateX(50%); }
    .v2-scroll-chevron {
      width: 22px; height: 22px;
      border-right: 2.5px solid rgba(255,255,255,0.6);
      border-bottom: 2.5px solid rgba(255,255,255,0.6);
      transform: rotate(45deg);
    }
    @keyframes v2bounce {
      0%,100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(10px); }
    }
    [dir="rtl"] @keyframes v2bounce {
      0%,100% { transform: translateX(50%) translateY(0); }
      50% { transform: translateX(50%) translateY(10px); }
    }
    .v2-wave { position: absolute; bottom: -1px; left: 0; right: 0; z-index: 2; }

    /* ── Stats bar ── */
    .v2-stats {
      background: linear-gradient(135deg, ${primary}, ${secondary});
      padding: 52px 24px;
    }
    .v2-stats-grid {
      max-width: 900px; margin: 0 auto;
      display: grid; grid-template-columns: repeat(3,1fr); gap: 16px;
    }

    /* ── Sections ── */
    .v2-section { padding: 88px 24px; }
    .v2-section-inner { max-width: 1240px; margin: 0 auto; }
    .v2-section-header { text-align: center; margin-bottom: 56px; }
    .v2-section-tag {
      display: inline-block; background: ${primary}18; color: ${primary};
      border-radius: 999px; padding: 5px 16px; font-size: 12px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px;
    }
    .v2-section-title {
      font-size: clamp(1.7rem,4vw,2.5rem); font-weight: 800; margin-bottom: 8px;
      ${tplId === 'premium' ? 'font-family: "Playfair Display", Georgia, serif;' : ''}
    }
    .v2-section-line { width: 48px; height: 4px; background: ${primary}; border-radius: 2px; margin: 12px auto 16px; }
    .v2-section-sub { font-size: 16px; color: ${subtleColor}; max-width: 580px; margin: 0 auto; line-height: 1.65; }

    /* ── Services ── */
    .v2-services-bg { background: ${isDark ? bgColor : '#F8FAFF'}; }
    .v2-svc-grid {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      gap: 16px;
      padding: 4px 20px 20px;
      margin: 0 -20px;
      scrollbar-width: none;
    }
    .v2-svc-grid::-webkit-scrollbar { display: none; }
    .v2-svc-card {
      flex: 0 0 75vw;
      max-width: 300px;
      min-height: 220px;
      scroll-snap-align: center;
      background: ${cardBg}; border-radius: 16px; overflow: hidden;
      display: flex; flex-direction: column;
      border: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'};
      box-shadow: 0 4px 16px rgba(0,0,0,${isDark ? '0.3' : '0.08'});
      transition: transform 0.22s, box-shadow 0.22s;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .v2-svc-card:active { transform: scale(0.98); }
    .v2-svc-card:hover { box-shadow: 0 14px 40px rgba(0,0,0,${isDark ? '0.35' : '0.14'}); }

    /* Carousel dots */
    .v2-svc-dots {
      display: flex; justify-content: center; gap: 8px; margin-top: 20px;
    }
    .v2-svc-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'};
      transition: all 0.25s ease;
    }
    .v2-svc-dot.active {
      width: 24px; border-radius: 4px; background: ${primary};
    }

    /* Swipe hint */
    .v2-svc-hint {
      text-align: center; font-size: 13px; color: ${subtleColor};
      font-weight: 600; margin-top: 14px; opacity: 1;
      transition: opacity 0.6s ease;
      animation: v2HintPulse 1.6s ease-in-out infinite;
    }
    .v2-svc-hint.fade { opacity: 0; pointer-events: none; }
    @keyframes v2HintPulse {
      0%,100% { transform: translateX(0); }
      50% { transform: translateX(6px); }
    }
    .v2-svc-top { height: 6px; background: linear-gradient(90deg, ${primary}, ${secondary}); }
    .v2-svc-body { padding: 24px; flex: 1; display: flex; flex-direction: column; }
    .v2-svc-icon {
      width: 56px; height: 56px; border-radius: 14px;
      background: linear-gradient(135deg, ${primary}, ${secondary});
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 18px;
      box-shadow: 0 6px 18px ${primary}40;
    }
    .v2-svc-name { font-size: 17px; font-weight: 700; margin-bottom: 8px; color: ${textColor}; }
    .v2-svc-desc { font-size: 14px; color: ${subtleColor}; line-height: 1.65; margin-bottom: 14px; flex: 1; }
    .v2-svc-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
    .v2-pill-dur {
      background: ${accentColor}; color: ${primary};
      border-radius: 999px; padding: 4px 13px; font-size: 12px; font-weight: 700;
    }
    .v2-pill-price {
      background: ${isDark ? 'rgba(252,211,77,0.12)' : '#FEF3C7'};
      color: ${isDark ? '#FCD34D' : '#92400E'};
      border-radius: 999px; padding: 4px 13px; font-size: 12px; font-weight: 700;
    }
    .v2-svc-link {
      color: ${primary}; font-weight: 700; font-size: 14px;
      text-decoration: none; display: inline-flex; align-items: center; gap: 5px;
      margin-top: auto;
    }
    .v2-svc-link:hover { text-decoration: underline; }

    /* ── About ── */
    .v2-about-bg { background: ${isDark ? 'rgba(255,255,255,0.025)' : accentColor + '28'}; }
    .v2-about-grid { display: flex; flex-direction: column; gap: 48px; }
    .v2-about-img-wrap { position: relative; flex-shrink: 0; }
    .v2-about-placeholder {
      width: 100%; aspect-ratio: 4/3; border-radius: 20px;
      background: linear-gradient(135deg, ${primary}25, ${secondary}35);
      display: flex; align-items: center; justify-content: center; font-size: 96px;
    }
    .v2-about-badge {
      position: absolute; bottom: -18px; right: 20px;
      background: ${primary}; color: white; border-radius: 12px;
      padding: 12px 20px; font-weight: 700; font-size: 14px;
      box-shadow: 0 8px 28px ${primary}55;
    }
    [dir="rtl"] .v2-about-badge { right: auto; left: 20px; }
    .v2-about-tag {
      display: inline-block; background: ${primary}15; color: ${primary};
      border-radius: 999px; padding: 5px 16px; font-size: 13px; font-weight: 700; margin-bottom: 16px;
    }
    .v2-about-title {
      font-size: clamp(1.6rem,4vw,2.4rem); font-weight: 800; margin-bottom: 18px;
      ${tplId === 'premium' ? 'font-family: "Playfair Display", Georgia, serif;' : ''}
    }
    .v2-about-text { font-size: 16px; color: ${subtleColor}; line-height: 1.8; margin-bottom: 28px; }
    .v2-bullet { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
    .v2-bullet-check {
      width: 28px; height: 28px; border-radius: 8px; background: ${primary};
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 13px; flex-shrink: 0; margin-top: 2px; font-weight: 700;
    }
    .v2-bullet-text { font-size: 15px; line-height: 1.55; font-weight: 500; }

    /* ── Team ── */
    .v2-team-scroll {
      display: flex; gap: 16px; overflow-x: auto; padding-bottom: 12px;
      scrollbar-width: none; -webkit-overflow-scrolling: touch; cursor: grab;
    }
    .v2-team-scroll::-webkit-scrollbar { display: none; }
    .v2-team-card {
      min-width: 192px; background: ${cardBg}; border-radius: ${borderRadius};
      padding: 28px 20px; text-align: center; flex-shrink: 0;
      border: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'};
      transition: transform 0.2s;
    }
    .v2-team-card:hover { transform: translateY(-4px); }
    .v2-team-avatar {
      width: 76px; height: 76px; border-radius: 50%;
      background: linear-gradient(135deg, ${primary}, ${secondary});
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 26px; font-weight: 800; margin: 0 auto 16px;
    }
    .v2-team-name { font-size: 16px; font-weight: 700; margin-bottom: 6px; color: ${textColor}; }
    .v2-team-spec { font-size: 13px; color: ${primary}; font-weight: 600; }

    /* ── Booking ── */
    .v2-booking-bg {
      background: linear-gradient(140deg, ${primary} 0%, ${secondary} 100%);
      padding: 96px 24px;
    }
    .v2-booking-inner { max-width: 820px; margin: 0 auto; text-align: center; }
    .v2-booking-title {
      font-size: clamp(1.9rem,5vw,3rem); font-weight: 800; color: white; margin-bottom: 14px;
      ${tplId === 'premium' ? 'font-family: "Playfair Display", Georgia, serif;' : ''}
    }
    .v2-booking-sub { font-size: 18px; color: rgba(255,255,255,0.82); margin-bottom: 48px; }
    .v2-steps { display: flex; flex-direction: column; gap: 14px; text-align: ${isRTL ? 'right' : 'left'}; margin-bottom: 44px; }
    .v2-step {
      display: flex; align-items: flex-start; gap: 16px;
      background: rgba(255,255,255,0.12); backdrop-filter: blur(8px);
      border-radius: 14px; padding: 18px 22px; border: 1px solid rgba(255,255,255,0.18);
    }
    .v2-step-num {
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(255,255,255,0.25); display: flex; align-items: center;
      justify-content: center; color: white; font-weight: 800; font-size: 16px; flex-shrink: 0;
    }
    .v2-step-text { color: white; font-size: 15px; line-height: 1.55; font-weight: 500; padding-top: 8px; }
    .v2-booking-cta {
      display: inline-flex; align-items: center; justify-content: center; gap: 10px;
      padding: 18px 40px; background: white; color: ${primary};
      border-radius: 14px; font-weight: 800; font-size: 18px;
      text-decoration: none; min-height: 58px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.22);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .v2-booking-cta:hover { transform: translateY(-3px); box-shadow: 0 18px 52px rgba(0,0,0,0.28); }

    /* ── Testimonials ── */
    .v2-testi-bg { background: ${isDark ? 'rgba(0,0,0,0.3)' : '#F1F5F9'}; }
    .v2-testi-grid { display: flex; flex-direction: column; gap: 20px; margin-top: 40px; }
    .v2-testi-card {
      background: ${cardBg}; border-radius: ${borderRadius}; padding: 28px 24px;
      border: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'};
    }
    .v2-testi-quote {
      font-size: 56px; color: ${primary}; opacity: 0.2;
      line-height: 0.8; margin-bottom: 8px; font-family: Georgia, serif; font-weight: 700;
    }
    .v2-testi-text { font-size: 15px; line-height: 1.72; color: ${subtleColor}; margin-bottom: 18px; font-style: italic; }
    .v2-testi-stars { color: #FBBF24; font-size: 15px; margin-bottom: 10px; letter-spacing: 3px; }
    .v2-testi-name { font-size: 14px; font-weight: 700; color: ${textColor}; }

    /* ── Contact ── */
    .v2-contact-grid { display: flex; flex-direction: column; gap: 40px; margin-top: 40px; }
    .v2-contact-items { display: flex; flex-direction: column; gap: 16px; }
    .v2-contact-item {
      display: flex; align-items: flex-start; gap: 16px;
      background: ${cardBg}; border-radius: ${borderRadius}; padding: 18px 20px;
      border: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'};
    }
    .v2-contact-icon {
      width: 46px; height: 46px; border-radius: 12px;
      background: ${primary}15; display: flex; align-items: center;
      justify-content: center; font-size: 20px; flex-shrink: 0;
    }
    .v2-contact-label { font-size: 11px; color: ${subtleColor}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; }
    .v2-contact-val { font-size: 15px; font-weight: 600; color: ${textColor}; }
    .v2-contact-val a { color: ${textColor}; text-decoration: none; }
    .v2-contact-val a:hover { color: ${primary}; }
    .v2-maps { border-radius: 20px; overflow: hidden; border: 2px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}; }
    .v2-maps-ph {
      height: 320px; background: ${isDark ? 'rgba(255,255,255,0.04)' : '#E2E8F0'};
      border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 56px;
    }

    /* ── Footer ── */
    .v2-footer { background: ${secondary}; padding: 52px 24px 28px; }
    .v2-footer-inner { max-width: 1240px; margin: 0 auto; }
    .v2-footer-top { display: flex; flex-direction: column; gap: 28px; margin-bottom: 36px; padding-bottom: 36px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .v2-footer-brand { display: flex; align-items: center; gap: 12px; }
    .v2-footer-logo { width: 42px; height: 42px; border-radius: 11px; background: ${primary}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 18px; }
    .v2-footer-name { color: white; font-weight: 700; font-size: 18px; }
    .v2-footer-tagline { color: rgba(255,255,255,0.45); font-size: 13px; margin-top: 3px; }
    .v2-footer-links { display: flex; flex-wrap: wrap; gap: 10px 22px; }
    .v2-footer-link { color: rgba(255,255,255,0.55); font-size: 14px; text-decoration: none; transition: color 0.15s; }
    .v2-footer-link:hover { color: white; }
    .v2-footer-bottom { text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; }
    .v2-footer-bottom a { color: rgba(255,255,255,0.55); text-decoration: none; }

    /* ── Floating ── */
    .v2-backtop {
      position: fixed; bottom: 100px; right: 20px; z-index: 40;
      width: 46px; height: 46px; border-radius: 50%; border: none; cursor: pointer;
      background: ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)'};
      color: ${isDark ? 'white' : '#1E293B'}; font-size: 18px;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(10px); transition: background 0.2s, transform 0.2s;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    [dir="rtl"] .v2-backtop { right: auto; left: 20px; }
    .v2-backtop:hover { background: ${primary}; color: white; transform: translateY(-2px); }

    .v2-mobile-cta {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 90;
      padding: 12px 16px; padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
      background: ${isDark ? '#0A0F1E' : 'white'};
      box-shadow: 0 -4px 24px rgba(0,0,0,${isDark ? '0.4' : '0.12'});
      transform: translateY(0); transition: transform 0.3s ease;
    }
    .v2-mobile-cta.hidden { transform: translateY(110%); }
    .v2-mobile-cta-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 15px; background: ${primary}; color: white;
      border-radius: 13px; text-decoration: none; font-weight: 700; font-size: 16px; min-height: 52px;
    }

    /* ── Responsive ── */
    @media (min-width: 600px) {
      .v2-hero-btns { flex-direction: row; max-width: 460px; }
      .v2-testi-grid { flex-direction: row; flex-wrap: wrap; }
      .v2-testi-card { flex: 1; min-width: 260px; }
      .v2-steps { display: grid; grid-template-columns: repeat(3,1fr); }
    }
    @media (min-width: 1024px) {
      .v2-svc-grid {
        display: grid; grid-template-columns: repeat(3,1fr);
        gap: 24px; overflow: visible; padding: 0; margin: 0;
        scroll-snap-type: none;
      }
      .v2-svc-card { flex: 1; max-width: none; scroll-snap-align: none; }
      .v2-svc-card:hover { transform: translateY(-5px); }
      .v2-svc-dots, .v2-svc-hint { display: none; }
      .v2-about-grid { flex-direction: row; align-items: center; gap: 72px; }
      [dir="rtl"] .v2-about-grid { flex-direction: row-reverse; }
      .v2-about-img-wrap { flex: 1; }
      .v2-about-text-wrap { flex: 1; }
      .v2-contact-grid { flex-direction: row; }
      .v2-contact-items { flex: 1; }
      .v2-maps-wrap { flex: 1; }
      .v2-footer-top { flex-direction: row; justify-content: space-between; align-items: flex-start; }
      .v2-mobile-cta { display: none; }
      .v2-hamburger { display: none; }
      .v2-nav-desktop { display: flex; }
    }
  `

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: isRTL ? '"Cairo", system-ui, sans-serif' : tpl.fontFamily, background: bgColor, color: textColor, overflowX: 'hidden' }}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ── NAVBAR ── */}
      <nav className={`v2-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="v2-nav-inner">
          <a href="#" className="v2-logo">
            {cabinet.logoUrl
              ? <img src={cabinet.logoUrl} alt={cabinet.nom} style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover' }} />
              : <div className="v2-logo-circle">K</div>}
            <span className="v2-logo-name">{cabinet.nom}</span>
          </a>

          <nav className="v2-nav-desktop">
            {navItems.map(it => (
              <a key={it.href} href={it.href} className="v2-nav-link">{it.label}</a>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="v2-lang">
              {(['fr', 'ar'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`v2-lang-btn${lang === l ? ' active' : ''}`}>
                  {l === 'fr' ? 'FR' : 'ع'}
                </button>
              ))}
            </div>
            <button className="v2-hamburger" onClick={() => setMenuOpen(true)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* ── OVERLAY MENU ── */}
      <div className={`v2-overlay${menuOpen ? ' open' : ''}`} aria-modal aria-hidden={!menuOpen}>
        <button className="v2-overlay-close" onClick={() => setMenuOpen(false)}>✕</button>
        {navItems.map(it => (
          <a key={it.href} href={it.href} className="v2-overlay-link" onClick={() => setMenuOpen(false)}>
            {it.label}
          </a>
        ))}
        {cabinet.telephone && (
          <a href={`tel:${cabinet.telephone}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 16, fontWeight: 600, marginTop: 32 }}>
            📞 {cabinet.telephone}
          </a>
        )}
      </div>

      {/* ── HERO ── */}
      <section className="v2-hero">
        <div className="v2-hero-bg" />
        <div className="v2-hero-overlay" />
        <div className="v2-hero-content">
          <div className="v2-hero-badge">
            <span className="v2-hero-badge-dot" />
            {isRTL ? 'مركز معتمد ومرخص' : 'Cabinet certifié & agréé'}
          </div>
          <h1 className="v2-hero-h1">
            {content.heroTitle ?? (isRTL ? `مرحباً بكم في ${cabinet.nom}` : `Bienvenue au ${cabinet.nom}`)}
          </h1>
          <p className="v2-hero-sub">
            {content.heroSubtitle ?? (isRTL
              ? `رعاية كينيزيتيرابية متخصصة وشخصية في ${cabinet.ville}`
              : `Des soins de kinésithérapie personnalisés au cœur de ${cabinet.ville}`)}
          </p>
          <div className="v2-hero-btns">
            <a href="#booking" className="v2-btn-white">
              📅 {isRTL ? 'احجز موعدك' : 'Prendre RDV'}
            </a>
            {cabinet.telephone && (
              <a href={`tel:${cabinet.telephone}`} className="v2-btn-ghost">
                📞 {isRTL ? 'اتصل بنا' : 'Nous appeler'}
              </a>
            )}
          </div>
        </div>
        <div className="v2-scroll-bounce">
          <div className="v2-scroll-chevron" />
        </div>
        <svg className="v2-wave" viewBox="0 0 1440 56" preserveAspectRatio="none" height="56">
          <path d="M0,56 C360,0 720,56 1080,20 C1260,4 1380,40 1440,28 L1440,56 Z" fill={bgColor} />
        </svg>
      </section>

      {/* ── STATS BAR ── */}
      <section className="v2-stats">
        <div className="v2-stats-grid" ref={statsRef}>
          {stats.map((s, i) => (
            <StatItem key={i} stat={s} active={statsActive} />
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className={`v2-section v2-services-bg`} id="services">
        <div className="v2-section-inner">
          <div className="v2-section-header v2-fade">
            <div className="v2-section-tag">{isRTL ? 'خدماتنا' : 'Nos spécialités'}</div>
            <h2 className="v2-section-title">{content.servicesTitle ?? (isRTL ? 'خدماتنا المتخصصة' : 'Nos Services')}</h2>
            <div className="v2-section-line" />
            <p className="v2-section-sub">{content.servicesSubtitle ?? (isRTL ? 'رعاية شاملة ومتخصصة لكل مريض' : 'Une prise en charge complète et personnalisée')}</p>
          </div>
          <div className="v2-svc-grid" ref={svcScrollRef}>
            {displayServices.map((s, i) => (
              <a key={s.id} href="#booking" className="v2-svc-card v2-fade">
                <div className="v2-svc-top" />
                <div className="v2-svc-body">
                  <div className="v2-svc-icon">
                    <ServiceIcon nom={s.nom} size={28} color="white" />
                  </div>
                  <div className="v2-svc-name">{s.nom}</div>
                  {s.description && <p className="v2-svc-desc">{s.description}</p>}
                  <div className="v2-svc-pills">
                    {s.dureeDefaut && <span className="v2-pill-dur">⏱ {s.dureeDefaut} min</span>}
                    {s.tarifDefaut && <span className="v2-pill-price">💰 {s.tarifDefaut} MAD</span>}
                  </div>
                  <span className="v2-svc-link">
                    {isRTL ? 'احجز هذا العلاج ←' : 'Réserver ce soin →'}
                  </span>
                </div>
              </a>
            ))}
          </div>
          <div className={`v2-svc-hint${showSwipeHint ? '' : ' fade'}`}>
            {isRTL ? '← اسحب لاستكشاف المزيد →' : '← Glissez pour découvrir →'}
          </div>
          <div className="v2-svc-dots">
            {displayServices.map((_, i) => (
              <div key={i} className={`v2-svc-dot${i === svcIndex ? ' active' : ''}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className={`v2-section v2-about-bg`} id="about">
        <div className="v2-section-inner">
          <div className="v2-about-grid">
            <div className="v2-about-img-wrap v2-fade">
              <div className="v2-about-placeholder">🏥</div>
              <div className="v2-about-badge">📍 {cabinet.ville || 'Maroc'}</div>
            </div>
            <div className="v2-about-text-wrap v2-fade">
              <div className="v2-about-tag">{isRTL ? 'من نحن' : 'À propos de nous'}</div>
              <h2 className="v2-about-title">
                {content.aboutTitle ?? (isRTL ? `مرحباً بكم في ${cabinet.nom}` : `Bienvenue au ${cabinet.nom}`)}
              </h2>
              <p className="v2-about-text">
                {content.aboutText ?? (isRTL
                  ? `في ${cabinet.nom}، نجمع بين الكفاءة المهنية والرعاية الإنسانية. نؤمن أن كل مريض يستحق اهتماماً فردياً ورعاية شاملة تلبي احتياجاته الخاصة.`
                  : `Au ${cabinet.nom}, nous conjuguons expertise clinique et bienveillance humaine. Chaque patient bénéficie d'une attention individuelle et de soins de qualité adaptés à ses besoins.`)}
              </p>
              {[
                isRTL ? 'فريق متخصص ومؤهل عالياً' : 'Équipe qualifiée et expérimentée',
                isRTL ? 'تقنيات حديثة ومعدات متطورة' : 'Équipements et techniques modernes',
                isRTL ? 'برنامج علاجي مخصص لكل حالة' : 'Programme thérapeutique personnalisé',
              ].map((txt, i) => (
                <div key={i} className="v2-bullet">
                  <div className="v2-bullet-check">✓</div>
                  <span className="v2-bullet-text">{txt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      {praticiens.length > 0 && (
        <section className="v2-section" id="team">
          <div className="v2-section-inner">
            <div className="v2-section-header v2-fade">
              <div className="v2-section-tag">{isRTL ? 'فريقنا' : 'Notre équipe'}</div>
              <h2 className="v2-section-title">{content.teamTitle ?? (isRTL ? 'فريقنا المتخصص' : 'Notre Équipe')}</h2>
              <div className="v2-section-line" />
              <p className="v2-section-sub">{content.teamSubtitle ?? (isRTL ? 'محترفون في خدمتكم' : 'Des professionnels dédiés à votre santé')}</p>
            </div>
            <div className="v2-team-scroll">
              {praticiens.map(p => (
                <div key={p.id} className="v2-team-card">
                  <div className="v2-team-avatar">{p.prenom[0]}{p.nom[0]}</div>
                  <div className="v2-team-name">{p.prenom} {p.nom}</div>
                  {p.specialite && <div className="v2-team-spec">{p.specialite}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BOOKING ── */}
      <section className="v2-booking-bg" id="booking">
        <div className="v2-booking-inner">
          <h2 className="v2-booking-title v2-fade">{content.bookingTitle ?? (isRTL ? 'احجز موعدك' : 'Prendre Rendez-vous')}</h2>
          <p className="v2-booking-sub v2-fade">{content.bookingSubtitle ?? (isRTL ? 'حجز سريع وسهل في 3 خطوات بسيطة' : 'Simple et rapide en 3 étapes')}</p>
          <div className="v2-steps v2-fade">
            {[
              { n: '1', fr: 'Choisissez votre soin', ar: 'اختر نوع العلاج' },
              { n: '2', fr: 'Sélectionnez un créneau', ar: 'حدد الوقت المناسب' },
              { n: '3', fr: 'Confirmez votre RDV', ar: 'أكد موعدك وانتهى' },
            ].map(step => (
              <div key={step.n} className="v2-step">
                <div className="v2-step-num">{step.n}</div>
                <div className="v2-step-text">{isRTL ? step.ar : step.fr}</div>
              </div>
            ))}
          </div>
          <a href={`/booking/${cabinet.slug}`} className="v2-booking-cta v2-fade">
            📅 {isRTL ? 'حجز موعد الآن' : 'Réserver maintenant'}
          </a>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      {testimonials.length > 0 && (
        <section className={`v2-section v2-testi-bg`} id="testimonials">
          <div className="v2-section-inner">
            <div className="v2-section-header v2-fade">
              <div className="v2-section-tag">{isRTL ? 'آراء المرضى' : 'Témoignages'}</div>
              <h2 className="v2-section-title">{content.testimonialsTitle ?? (isRTL ? 'آراء مرضانا' : 'Ce que disent nos patients')}</h2>
              <div className="v2-section-line" />
            </div>
            <div className="v2-testi-grid">
              {testimonials.map(t => (
                <div key={t.id} className="v2-testi-card v2-fade">
                  <div className="v2-testi-quote">"</div>
                  <p className="v2-testi-text">{isRTL ? t.textAr : t.textFr}</p>
                  <div className="v2-testi-stars">{'★'.repeat(t.rating)}{'☆'.repeat(Math.max(0, 5 - t.rating))}</div>
                  <div className="v2-testi-name">{t.patientName}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CONTACT ── */}
      <section className="v2-section" id="contact">
        <div className="v2-section-inner">
          <div className="v2-section-header v2-fade">
            <div className="v2-section-tag">{isRTL ? 'اتصل بنا' : 'Contact'}</div>
            <h2 className="v2-section-title">{content.contactTitle ?? (isRTL ? 'أين نجدنا' : 'Nous trouver')}</h2>
            <div className="v2-section-line" />
          </div>
          <div className="v2-contact-grid">
            <div className="v2-contact-items">
              {cabinet.adresse && (
                <div className="v2-contact-item v2-fade">
                  <div className="v2-contact-icon">📍</div>
                  <div>
                    <div className="v2-contact-label">{isRTL ? 'العنوان' : 'Adresse'}</div>
                    <div className="v2-contact-val">{cabinet.adresse}{cabinet.ville ? `, ${cabinet.ville}` : ''}</div>
                  </div>
                </div>
              )}
              {cabinet.telephone && (
                <div className="v2-contact-item v2-fade">
                  <div className="v2-contact-icon">📞</div>
                  <div>
                    <div className="v2-contact-label">{isRTL ? 'الهاتف' : 'Téléphone'}</div>
                    <div className="v2-contact-val"><a href={`tel:${cabinet.telephone}`}>{cabinet.telephone}</a></div>
                  </div>
                </div>
              )}
              {cabinet.email && (
                <div className="v2-contact-item v2-fade">
                  <div className="v2-contact-icon">✉️</div>
                  <div>
                    <div className="v2-contact-label">{isRTL ? 'البريد الإلكتروني' : 'Email'}</div>
                    <div className="v2-contact-val"><a href={`mailto:${cabinet.email}`}>{cabinet.email}</a></div>
                  </div>
                </div>
              )}
              <div className="v2-contact-item v2-fade">
                <div className="v2-contact-icon">🕐</div>
                <div>
                  <div className="v2-contact-label">{isRTL ? 'ساعات العمل' : 'Horaires d\'ouverture'}</div>
                  <div className="v2-contact-val">{cabinet.workStartTime} – {cabinet.workEndTime}</div>
                </div>
              </div>
              {cabinet.whatsappNumber && (
                <div className="v2-fade" style={{ marginTop: 8 }}>
                  <WhatsAppContactButton whatsappNumber={cabinet.whatsappNumber} cabinetName={cabinet.nom} lang={lang} />
                </div>
              )}
            </div>
            <div className="v2-maps-wrap v2-fade">
              {site.googleMapsEmbed
                ? <div className="v2-maps"><iframe src={site.googleMapsEmbed} width="100%" height="360" style={{ border: 'none', display: 'block' }} loading="lazy" title="Carte" /></div>
                : <div className="v2-maps-ph">🗺️</div>}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="v2-footer">
        <div className="v2-footer-inner">
          <div className="v2-footer-top">
            <div>
              <div className="v2-footer-brand">
                <div className="v2-footer-logo">K</div>
                <div>
                  <div className="v2-footer-name">{cabinet.nom}</div>
                  <div className="v2-footer-tagline">{isRTL ? 'كينيزيتيرابيا متخصصة' : 'Kinésithérapie spécialisée'}</div>
                </div>
              </div>
            </div>
            <div className="v2-footer-links">
              {navItems.map(it => (
                <a key={it.href} href={it.href} className="v2-footer-link">{it.label}</a>
              ))}
            </div>
          </div>
          <div className="v2-footer-bottom">
            {isRTL ? 'بدعم من ' : 'Propulsé par '}<a href="https://kinepro-omega.vercel.app">KinéPro</a> · {new Date().getFullYear()}
          </div>
        </div>
      </footer>

      {/* ── FLOATING ELEMENTS ── */}
      {cabinet.whatsappNumber && (
        <WhatsAppFloatingButton whatsappNumber={cabinet.whatsappNumber} cabinetName={cabinet.nom} lang={lang} />
      )}
      {showBackToTop && (
        <button className="v2-backtop" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={isRTL ? 'العودة إلى الأعلى' : 'Retour en haut'}>
          ↑
        </button>
      )}
      <div className={`v2-mobile-cta${showMobileCta ? '' : ' hidden'}`}>
        <a href="#booking" className="v2-mobile-cta-btn">
          📅 {isRTL ? 'احجز موعدك' : 'Prendre RDV'}
        </a>
      </div>
    </div>
  )
}
