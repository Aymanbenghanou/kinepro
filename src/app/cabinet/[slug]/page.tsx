import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import dynamic from 'next/dynamic'

// Dynamically load templates client-side (they use browser APIs)
const MedicalTemplate = dynamic(() => import('@/components/cabinet-sites/templates/MedicalTemplate'), { ssr: false })
const PremiumTemplate = dynamic(() => import('@/components/cabinet-sites/templates/PremiumTemplate'), { ssr: false })
const WarmTemplate    = dynamic(() => import('@/components/cabinet-sites/templates/WarmTemplate'),    { ssr: false })
const SportTemplate   = dynamic(() => import('@/components/cabinet-sites/templates/SportTemplate'),   { ssr: false })

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params
  const cab = await prisma.cabinet.findUnique({ where: { slug }, select: { nom: true, ville: true } })
  if (!cab) return { title: 'Cabinet introuvable' }
  return {
    title: `${cab.nom} — ${cab.ville ?? 'Maroc'} | Kinésithérapie`,
    description: `Prenez rendez-vous en ligne avec ${cab.nom}, votre cabinet de kinésithérapie.`,
  }
}

export default async function CabinetSitePage({ params }: { params: Params }) {
  const { slug } = await params

  const cabinet = await prisma.cabinet.findUnique({
    where: { slug },
    select: {
      id: true, nom: true, ville: true, adresse: true,
      telephone: true, email: true, whatsappNumber: true,
      slug: true, logoUrl: true,
      workStartTime: true, workEndTime: true, workingDays: true,
      site: {
        select: {
          templateId: true, published: true,
          primaryColor: true, secondaryColor: true,
          heroTitle: true, heroSubtitle: true, heroImageUrl: true,
          aboutText: true, googleMapsEmbed: true,
          testimonials: { orderBy: { createdAt: 'desc' }, select: { id: true, patientName: true, text: true, rating: true } },
        },
      },
      seanceTypes: {
        where: { actif: true },
        select: { id: true, nom: true, dureeDefaut: true, tarifDefaut: true, couleur: true, description: true },
        orderBy: { nom: 'asc' },
      },
      praticiens: {
        where: { actif: true },
        select: { id: true, nom: true, prenom: true, specialite: true, couleur: true },
        orderBy: { nom: 'asc' },
      },
    },
  }).catch(() => null)

  if (!cabinet || !cabinet.site || !cabinet.site.published) {
    // Show "under construction" instead of 404 for unpublished sites
    if (cabinet && cabinet.site && !cabinet.site.published) {
      return (
        <div style={{ minHeight:'100vh', background:'#0F172A', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif' }}>
          <div style={{ textAlign:'center', color:'white', padding:40 }}>
            <div style={{ fontSize:64, marginBottom:20 }}>🚧</div>
            <h1 style={{ fontSize:28, fontWeight:800, margin:'0 0 12px' }}>Site en construction</h1>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:16, margin:0 }}>{cabinet.nom} — bientôt en ligne</p>
          </div>
        </div>
      )
    }
    notFound()
  }

  const data = {
    cabinet: {
      nom: cabinet.nom,
      ville: cabinet.ville ?? '',
      adresse: cabinet.adresse,
      telephone: cabinet.telephone,
      email: cabinet.email,
      whatsappNumber: cabinet.whatsappNumber,
      slug: cabinet.slug,
      logoUrl: cabinet.logoUrl,
      workStartTime: cabinet.workStartTime ?? '08:00',
      workEndTime: cabinet.workEndTime ?? '18:00',
      workingDays: cabinet.workingDays ?? '1,2,3,4,5,6',
    },
    site: {
      templateId: cabinet.site.templateId,
      primaryColor: cabinet.site.primaryColor,
      secondaryColor: cabinet.site.secondaryColor,
      heroTitle: cabinet.site.heroTitle,
      heroSubtitle: cabinet.site.heroSubtitle,
      heroImageUrl: cabinet.site.heroImageUrl,
      aboutText: cabinet.site.aboutText,
      googleMapsEmbed: cabinet.site.googleMapsEmbed,
    },
    seanceTypes: cabinet.seanceTypes,
    praticiens: cabinet.praticiens,
    testimonials: cabinet.site.testimonials,
  }

  const Template =
    cabinet.site.templateId === 'premium' ? PremiumTemplate :
    cabinet.site.templateId === 'warm'    ? WarmTemplate    :
    cabinet.site.templateId === 'sport'   ? SportTemplate   :
    MedicalTemplate

  return <Template data={data} />
}
