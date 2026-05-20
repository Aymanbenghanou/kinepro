'use client'

/**
 * Shared components and utilities for all cabinet site templates.
 * Imported by MedicalTemplate, PremiumTemplate, WarmTemplate, SportTemplate.
 */

import {
  Dumbbell, Scissors, Hand, Zap, Waves, RotateCcw,
  ClipboardList, Wind, Brain, Baby, ArrowUpDown,
  Activity, PersonStanding, Stethoscope, ActivitySquare,
  type LucideProps,
} from 'lucide-react'

// ── Icon mapper ──────────────────────────────────────────────────────────────

type IconComponent = React.ComponentType<LucideProps>

function pickIcon(nom: string): IconComponent {
  const n = nom.toLowerCase()
  if (n.includes('lombaire') || n.includes('dos') || n.includes('colonne')) return ActivitySquare
  if (n.includes('sport') || n.includes('musculaire') || n.includes('renforcement')) return Dumbbell
  if (n.includes('post-op') || n.includes('opératoire') || n.includes('chirurgie')) return Scissors
  if (n.includes('massage') || n.includes('thérapeutique')) return Hand
  if (n.includes('électro') || n.includes('electro')) return Zap
  if (n.includes('balnéo') || n.includes('eau')) return Waves
  if (n.includes('mobilisation') || n.includes('articulaire')) return RotateCcw
  if (n.includes('bilan') || n.includes('évaluation')) return ClipboardList
  if (n.includes('respiratoire') || n.includes('pulmonaire')) return Wind
  if (n.includes('neurologique') || n.includes('neuro')) return Brain
  if (n.includes('pédiatrique') || n.includes('enfant')) return Baby
  if (n.includes('cervical') || n.includes('cou') || n.includes('nuque')) return ArrowUpDown
  if (n.includes('genou') || n.includes('hanche') || n.includes('cheville')) return Activity
  if (n.includes('épaule') || n.includes('bras')) return PersonStanding
  return Stethoscope
}

export function ServiceIcon({
  nom,
  size = 24,
  color = 'white',
}: {
  nom: string
  size?: number
  color?: string
}) {
  const Icon = pickIcon(nom)
  return <Icon size={size} color={color} strokeWidth={2} />
}

// ── WhatsApp helpers ─────────────────────────────────────────────────────────

export function formatWhatsApp(phone: string): string {
  const clean = phone.replace(/[\s\-\+]/g, '')
  if (clean.startsWith('212')) return clean
  if (clean.startsWith('0')) return '212' + clean.slice(1)
  return '212' + clean
}

export function whatsAppUrl(phone: string, cabinetName: string, lang: 'fr' | 'ar' = 'fr'): string {
  const number = formatWhatsApp(phone)
  const msg =
    lang === 'ar'
      ? `مرحباً، أرغب في حجز موعد في ${cabinetName} 📅`
      : `Bonjour, je souhaite prendre un rendez-vous au ${cabinetName} 📅`
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`
}

// WhatsApp SVG (official icon, no external dep)
function WhatsAppSVG({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ── Floating WhatsApp Button ─────────────────────────────────────────────────

export function WhatsAppFloatingButton({
  whatsappNumber,
  cabinetName,
  lang = 'fr',
}: {
  whatsappNumber: string
  cabinetName: string
  lang?: 'fr' | 'ar'
}) {
  const url = whatsAppUrl(whatsappNumber, cabinetName, lang)
  const tooltip = lang === 'ar' ? 'تواصل معنا على واتساب' : 'Contactez-nous sur WhatsApp'

  return (
    <>
      <style>{`
        .wa-float {
          position: fixed;
          bottom: 32px;
          right: 28px;
          z-index: 50;
          width: 56px;
          height: 56px;
          background: #25D366;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(37,211,102,0.45);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          text-decoration: none;
          animation: waPulse 2.8s infinite;
        }
        .wa-float:hover {
          transform: scale(1.12);
          box-shadow: 0 6px 28px rgba(37,211,102,0.6);
          animation: none;
        }
        .wa-float:hover .wa-tooltip {
          opacity: 1;
          transform: translateX(0);
          pointer-events: auto;
        }
        .wa-tooltip {
          position: absolute;
          right: 68px;
          white-space: nowrap;
          background: #1a1a1a;
          color: white;
          padding: 7px 13px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          opacity: 0;
          transform: translateX(8px);
          transition: opacity 0.2s ease, transform 0.2s ease;
          pointer-events: none;
        }
        .wa-tooltip::after {
          content: '';
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-left-color: #1a1a1a;
        }
        @keyframes waPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(37,211,102,0.45); }
          50%       { box-shadow: 0 4px 32px rgba(37,211,102,0.75), 0 0 0 8px rgba(37,211,102,0.12); }
        }
      `}</style>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="wa-float"
        aria-label={tooltip}
      >
        <span className="wa-tooltip">{tooltip}</span>
        <WhatsAppSVG size={28} />
      </a>
    </>
  )
}

// ── WhatsApp Contact Button (inline in Contact section) ───────────────────────

export function WhatsAppContactButton({
  whatsappNumber,
  cabinetName,
  lang = 'fr',
  style,
}: {
  whatsappNumber: string
  cabinetName: string
  lang?: 'fr' | 'ar'
  style?: React.CSSProperties
}) {
  const url = whatsAppUrl(whatsappNumber, cabinetName, lang)
  const label = lang === 'ar' ? 'تواصل معنا على واتساب 💬' : '💬 Nous contacter sur WhatsApp'

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        background: '#25D366',
        color: '#fff',
        padding: '14px 28px',
        borderRadius: 10,
        textDecoration: 'none',
        fontWeight: 700,
        fontSize: 15,
        boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        width: '100%',
        maxWidth: 360,
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,0.45)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,211,102,0.35)' }}
    >
      <WhatsAppSVG size={20} />
      {label}
    </a>
  )
}
