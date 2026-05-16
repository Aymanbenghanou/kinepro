'use client'

import { useState, useEffect, useRef } from 'react'

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.12 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

const faqs = [
  {
    q: "Combien de temps pour commencer à utiliser KinéPro ?",
    a: "Moins de 10 minutes. Créez votre compte, renseignez votre cabinet et ajoutez vos premiers patients. Vous êtes opérationnel immédiatement. Aucune installation, aucune formation requise.",
  },
  {
    q: "Mes données patients sont-elles sécurisées ?",
    a: "Oui, entièrement. Vos données sont hébergées dans des centres de données européens (Supabase/AWS EU) avec chiffrement SSL, sauvegardes automatiques et isolation par cabinet. Aucune donnée n'est partagée entre cabinets.",
  },
  {
    q: "L'application fonctionne-t-elle en arabe ?",
    a: "L'interface est actuellement en français. Le support client est disponible en français et en arabe (FR/عربي). Une interface en arabe est prévue dans une prochaine version.",
  },
  {
    q: "Comment fonctionnent les rappels WhatsApp ?",
    a: "Quand un RDV est créé ou confirmé dans l'agenda, KinéPro génère automatiquement un message WhatsApp personnalisé avec le nom du patient, l'heure, la date et le praticien. Vous cliquez simplement pour envoyer. Après la séance, un message de feedback est préparé automatiquement.",
  },
  {
    q: "Puis-je annuler mon abonnement à tout moment ?",
    a: "Oui, sans frais ni pénalité. Vous pouvez annuler depuis les paramètres ou en contactant notre support. Vous conservez l'accès jusqu'à la fin de la période payée.",
  },
  {
    q: "Puis-je avoir plusieurs praticiens dans mon cabinet ?",
    a: "Oui. Vous pouvez ajouter autant de praticiens que vous souhaitez, leur attribuer des spécialités, des couleurs dans l'agenda, et même leur créer des accès séparés à l'application.",
  },
]

function FaqItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #E2E8F0', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', lineHeight: 1.4, flex: 1 }}>{faq.q}</span>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: open ? '#2563EB' : '#F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'background 0.2s, transform 0.3s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke={open ? 'white' : '#64748B'} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </button>
      <div style={{
        maxHeight: open ? 200 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <p style={{ padding: '0 24px 20px', fontSize: 14, color: '#64748B', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
      </div>
    </div>
  )
}

export default function FaqSection() {
  const { ref, visible } = useReveal()
  return (
    <section id="faq" style={{ padding: '96px 24px', background: '#F8FAFC' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div ref={ref} style={{ textAlign: 'center', marginBottom: 48, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.6s ease' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>FAQ</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 900, color: '#0F172A', margin: '0 auto 12px', letterSpacing: '-0.5px' }}>
            Questions fréquentes
          </h2>
          <p style={{ fontSize: 15, color: '#64748B' }}>Tout ce que vous voulez savoir avant de commencer.</p>
        </div>

        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {faqs.map((faq, i) => <FaqItem key={faq.q} faq={faq} index={i} />)}
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', marginTop: 28 }}>
          Une autre question ? <a href="mailto:support@kinepro.ma" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Contactez-nous</a>
        </p>
      </div>
    </section>
  )
}
