'use client'

import Link from 'next/link'

function DashboardMockup() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
      {/* Main card */}
      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.22)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.4)' }}>
        {/* Topbar */}
        <div style={{ background: '#1E3A5F', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 6, padding: '3px 12px', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>kinepro.ma/dashboard</div>
          </div>
        </div>

        {/* Dashboard content */}
        <div style={{ display: 'flex' }}>
          {/* Mini sidebar */}
          <div style={{ width: 48, background: '#1E3A5F', padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            {['🏠','📅','👥','🩺','💳','📊'].map((icon, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: 8, background: i === 0 ? '#2563EB' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer' }}>
                {icon}
              </div>
            ))}
          </div>

          {/* Main area */}
          <div style={{ flex: 1, padding: '16px', background: '#F8FAFC' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#1E3A5F', margin: '0 0 12px' }}>Tableau de bord</p>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Patients', value: '142', color: '#2563EB' },
                { label: 'RDV mois', value: '38',  color: '#16A34A' },
                { label: 'Revenus',  value: '8.4k', color: '#F59E0B' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'white', borderRadius: 8, padding: '8px 10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: 9, color: '#64748B' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Mini calendar row */}
            <div style={{ background: 'white', borderRadius: 8, padding: '10px', border: '1px solid #E2E8F0', marginBottom: 8 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Agenda — Aujourd'hui</p>
              {[
                { time: '09:00', name: 'Khalid M.', color: '#2563EB' },
                { time: '10:30', name: 'Fatima B.', color: '#16A34A' },
                { time: '14:00', name: 'Ahmed R.',  color: '#8B5CF6' },
              ].map((rdv) => (
                <div key={rdv.time} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 3, height: 28, borderRadius: 2, background: rdv.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#64748B', width: 28 }}>{rdv.time}</div>
                  <div style={{ flex: 1, background: `${rdv.color}12`, borderRadius: 4, padding: '3px 6px', fontSize: 9, fontWeight: 500, color: '#374151' }}>{rdv.name}</div>
                </div>
              ))}
            </div>

            {/* Chart placeholder */}
            <div style={{ background: 'white', borderRadius: 8, padding: '10px', border: '1px solid #E2E8F0' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>Revenus — 6 mois</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 36 }}>
                {[55, 70, 45, 80, 65, 90].map((h, i) => (
                  <div key={i} style={{ flex: 1, background: i === 5 ? '#2563EB' : '#DBEAFE', borderRadius: '3px 3px 0 0', height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification cards */}
      <div style={{ position: 'absolute', top: -14, right: -20, background: 'white', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #E2E8F0', animation: 'floatA 3s ease-in-out infinite' }}>
        <span style={{ fontSize: 18 }}>📅</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>24 RDV aujourd'hui</div>
          <div style={{ fontSize: 10, color: '#64748B' }}>+3 depuis hier</div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 40, right: -24, background: 'white', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #E2E8F0', animation: 'floatB 3.5s ease-in-out infinite' }}>
        <span style={{ fontSize: 18 }}>⭐</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>4.9 / 5 Google</div>
          <div style={{ fontSize: 10, color: '#64748B' }}>89 avis ce mois</div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: -10, left: -20, background: '#25D366', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 32px rgba(37,211,102,0.3)', display: 'flex', alignItems: 'center', gap: 8, animation: 'floatC 4s ease-in-out infinite' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>💬 WhatsApp envoyé ✓</div>
      </div>

      <style>{`
        @keyframes floatA { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes floatB { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes floatC { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  )
}

export default function HeroSection() {
  return (
    <section id="hero" style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      padding: '100px 20px 80px',
    }}>
      {/* Real physiotherapy photo — full cover background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://res.cloudinary.com/djouneyaq/image/upload/v1778974291/cover-kinestherapie-sport-paris-institut-kinesitherapieV2.jpg_atyja5.webp"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
          pointerEvents: 'none',
        }}
      />
      {/* Dark blue overlay for text readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15, 31, 61, 0.78)',
        pointerEvents: 'none',
      }} />

      <div className="hero-inner" style={{ maxWidth: 1180, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

        {/* Left — copy */}
        <div>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '6px 16px', marginBottom: 24 }}>
            <span style={{ fontSize: 16 }}>🇲🇦</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Conçu pour les kinés marocains</span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 900, color: 'white', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-1px' }}>
            Votre cabinet,<br />
            <span style={{ background: 'linear-gradient(90deg, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              géré intelligemment.
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.7, color: 'rgba(255,255,255,0.78)', margin: '0 0 32px', maxWidth: 480 }}>
            KinéPro centralise vos patients, automatise vos rappels WhatsApp et booste votre réputation Google — en une seule plateforme.
          </p>

          {/* CTAs — always horizontal, wrap gracefully */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
            <a href="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 24px', borderRadius: 12, fontSize: 15, fontWeight: 700,
              background: 'white', color: '#1E3A5F', textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(255,255,255,0.25)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 32px rgba(255,255,255,0.35)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 4px 24px rgba(255,255,255,0.25)' }}
            >
              Commencer gratuitement →
            </a>
            <a href="#features" onClick={e => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }) }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 24px', borderRadius: 12, fontSize: 15, fontWeight: 600,
                background: 'transparent', color: 'white', textDecoration: 'none',
                border: '1.5px solid rgba(255,255,255,0.4)',
                transition: 'background 0.2s, border-color 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.1)'; el.style.borderColor = 'rgba(255,255,255,0.7)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'rgba(255,255,255,0.4)' }}
            >
              Voir les fonctionnalités
            </a>
          </div>

          {/* Trust badges — horizontal row, no wrap */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {['✓ 7 jours gratuits', '✓ Sans carte bancaire', '✓ Support FR / عربي'].map(t => (
              <span key={t} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500, whiteSpace: 'nowrap' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Right — Dashboard mockup */}
        <div className="hero-mockup" style={{ display: 'flex', justifyContent: 'center' }}>
          <DashboardMockup />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll-hint" style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.5 }}>
        <span style={{ fontSize: 11, color: 'white', fontWeight: 500, letterSpacing: 1 }}>DÉFILER</span>
        <div style={{ width: 1, height: 32, background: 'white', animation: 'scrollPulse 2s ease-in-out infinite' }} />
        <style>{`@keyframes scrollPulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hero-inner {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            text-align: center;
          }
          .hero-inner > div:first-child {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-inner > div:first-child p {
            text-align: center;
          }
          .hero-inner > div:first-child > div:last-child {
            justify-content: center;
          }
          .hero-mockup {
            display: flex !important;
            padding-right: 0 !important;
            transform: scale(0.82);
            transform-origin: top center;
            margin-bottom: -40px;
          }
          .hero-scroll-hint {
            display: none !important;
          }
        }
      `}</style>
    </section>
  )
}
