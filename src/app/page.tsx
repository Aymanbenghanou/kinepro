import { prisma }        from '@/lib/prisma'
import { CABINETS_BASE } from '@/lib/landing-stats'
import Navbar           from '@/components/landing/Navbar'
import HeroSection       from '@/components/landing/HeroSection'
import ProblemSolution   from '@/components/landing/ProblemSolution'
import FeaturesSection   from '@/components/landing/FeaturesSection'
import GoogleMapsFeature from '@/components/landing/GoogleMapsFeature'
import HowItWorks        from '@/components/landing/HowItWorks'
import StatsSection      from '@/components/landing/StatsSection'
import Pricing           from '@/components/landing/Pricing'
import FaqSection        from '@/components/landing/FaqSection'
import CtaSection        from '@/components/landing/CtaSection'
import LandingFooter     from '@/components/landing/LandingFooter'

// Rendu à la requête (pas de pré-rendu au build) : les comptes DB sont lus au
// runtime, où la base est joignable — le build ne dépend pas de la DB.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'KinéPro — La plateforme de gestion pour kinésithérapeutes marocains',
  description:
    'Gérez votre cabinet de kiné avec KinéPro : dossiers patients, agenda intelligent, rappels WhatsApp automatiques et boost Google Maps. Essai gratuit 7 jours.',
}

export default async function LandingPage() {
  // Comptes réels en base, dans le Server Component (pas de fetch client, pas d'API).
  // Garde-fou : si la DB est momentanément indisponible, la vitrine ne plante pas.
  let cabinets = 0
  let rdv = 0
  try {
    ;[cabinets, rdv] = await Promise.all([
      prisma.cabinet.count(),
      prisma.rendezVous.count(),
    ])
  } catch (e) {
    console.error('[landing] échec lecture des comptes DB', e)
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'white', color: '#0F172A' }}>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSolution />
        <FeaturesSection />
        <GoogleMapsFeature />
        <HowItWorks />
        <StatsSection cabinets={CABINETS_BASE + cabinets} rdv={rdv} />
        <Pricing />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
