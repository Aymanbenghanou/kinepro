import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TemplateRenderer from '@/components/cabinet-sites/TemplateRenderer'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params
  const cabinet = await prisma.cabinet.findUnique({
    where: { slug },
    select: {
      nom: true, ville: true,
      site: { select: { contentFr: true, contentAr: true, heroImageUrl: true } },
    },
  })
  if (!cabinet) return { title: 'Cabinet introuvable' }

  const fr = cabinet.site?.contentFr as Record<string, any> | null
  const title = fr?.seoTitle || `${cabinet.nom} — ${cabinet.ville ?? 'Maroc'} | Kinésithérapie`
  const description = fr?.seoDescription || `Prenez rendez-vous en ligne avec ${cabinet.nom}, votre cabinet de kinésithérapie.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: cabinet.site?.heroImageUrl ? [cabinet.site.heroImageUrl] : [],
    },
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'MedicalBusiness',
        name: cabinet.nom,
        description,
        address: { '@type': 'PostalAddress', addressLocality: cabinet.ville ?? 'Maroc' },
      }),
    },
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
          contentFr: true, contentAr: true,
          heroImageUrl: true, googleMapsEmbed: true,
          testimonials: {
            orderBy: { createdAt: 'desc' },
            select: { id: true, patientName: true, textFr: true, textAr: true, rating: true },
          },
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

  if (!cabinet || !cabinet.site) {
    notFound()
  }

  if (!cabinet.site.published) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ textAlign: 'center', color: 'white', padding: 40, maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🚧</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px' }}>Site en construction</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, margin: '0 0 28px' }}>{cabinet.nom} — bientôt en ligne</p>
          {cabinet.telephone && (
            <a href={`tel:${cabinet.telephone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#2563EB', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
              📞 {cabinet.telephone}
            </a>
          )}
        </div>
      </div>
    )
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
      contentFr: cabinet.site.contentFr as Record<string, any> | null,
      contentAr: cabinet.site.contentAr as Record<string, any> | null,
      heroImageUrl: cabinet.site.heroImageUrl,
      googleMapsEmbed: cabinet.site.googleMapsEmbed,
    },
    seanceTypes: cabinet.seanceTypes,
    praticiens: cabinet.praticiens,
    testimonials: cabinet.site.testimonials,
  }

  return <TemplateRenderer templateId={cabinet.site.templateId} data={data} />
}
