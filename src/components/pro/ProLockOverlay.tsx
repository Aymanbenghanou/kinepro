'use client'

import { Lock, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { buildContactCtaUrl } from '@/lib/contact-cta'
import { useAppConfig } from '@/components/providers/AppConfigProvider'

/**
 * Overlay qui couvre son parent (parent DOIT être `position: relative`).
 * Bloque les interactions avec le contenu derrière, affiche un message
 * d'upgrade et un bouton WhatsApp.
 *
 * Pattern d'usage :
 *   <div style={{ position: 'relative' }}>
 *     <FeatureUI />
 *     {!hasProAccess && <ProLockOverlay feature="Documents patients" />}
 *   </div>
 *
 * Le contenu derrière reste rendu (preview teasing) mais le clic est capturé
 * par l'overlay : `pointerEvents: 'auto'` sur tout l'overlay.
 */
export default function ProLockOverlay({ feature }: { feature: string }) {
  const { supportWhatsapp } = useAppConfig()
  const contactUrl = buildContactCtaUrl(supportWhatsapp)
  return (
    <div
      aria-label={`Verrou Pro — ${feature}`}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        pointerEvents: 'auto', // capture tous les clics
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        // backdrop blur + dim
        background: 'rgba(255, 255, 255, 0.62)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          maxWidth: 380,
          width: '100%',
          background: 'white',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          boxShadow: '0 10px 40px rgba(15, 23, 42, 0.15)',
          padding: '28px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#EFF6FF', color: '#2563EB',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Lock size={26} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
          Fonctionnalité Pro
        </h3>
        <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 6px', fontWeight: 500 }}>
          {feature}
        </p>
        <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.55, margin: '12px 0 22px' }}>
          Cette fonctionnalité est réservée aux abonnements Pro. Contactez-nous pour passer au plan Pro.
        </p>
        <a
          href={contactUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 10,
            background: '#25D366', color: 'white', textDecoration: 'none',
            fontWeight: 700, fontSize: 14, marginBottom: 10,
          }}
        >
          <MessageCircle size={16} />
          Contacter via WhatsApp
        </a>
        <div>
          <Link href="/abonnement" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>
            En savoir plus →
          </Link>
        </div>
      </div>
    </div>
  )
}
