import Link from 'next/link'
import LandingFooter from '@/components/landing/LandingFooter'

// Un bloc = un titre + une suite de parties : chaque partie est soit un paragraphe
// (string), soit une liste à puces (string[]). L'ordre est préservé.
export type LegalBlock = { heading: string; body: (string | string[])[] }

export default function LegalShell({ title, updated, blocks }: {
  title: string; updated: string; blocks: LegalBlock[]
}) {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'white', color: '#0F172A', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Barre de retour */}
      <div style={{ background: '#EFF6FF', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '16px 24px', width: '100%' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#2563EB', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 72px', width: '100%', flex: 1 }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#1E3A5F', letterSpacing: '-0.5px', margin: '0 0 8px', lineHeight: 1.2 }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 36px' }}>Dernière mise à jour : {updated}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {blocks.map((b, i) => (
            <section key={i}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E3A5F', margin: '0 0 10px' }}>{b.heading}</h2>
              {b.body.map((part, j) =>
                Array.isArray(part) ? (
                  <ul key={j} style={{ margin: '8px 0', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {part.map((li, k) => (
                      <li key={k} style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.6 }}>{li}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={j} style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.7, margin: '0 0 8px' }}>{part}</p>
                )
              )}
            </section>
          ))}
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
