import Navbar           from '@/components/landing/Navbar'
import HeroSection       from '@/components/landing/HeroSection'
import ProblemSolution   from '@/components/landing/ProblemSolution'
import FeaturesSection   from '@/components/landing/FeaturesSection'
import GoogleMapsFeature from '@/components/landing/GoogleMapsFeature'
import HowItWorks        from '@/components/landing/HowItWorks'
import PricingSection    from '@/components/landing/PricingSection'
import FaqSection        from '@/components/landing/FaqSection'
import CtaSection        from '@/components/landing/CtaSection'
import LandingFooter     from '@/components/landing/LandingFooter'

export const metadata = {
  title: 'KinéPro — La plateforme de gestion pour kinésithérapeutes marocains',
  description:
    'Gérez votre cabinet de kiné avec KinéPro : dossiers patients, agenda intelligent, rappels WhatsApp automatiques et boost Google Maps. Essai gratuit 7 jours.',
}

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'white', color: '#0F172A' }}>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSolution />
        <FeaturesSection />
        <GoogleMapsFeature />
        <HowItWorks />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
