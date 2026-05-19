/**
 * GET /api/cabinet-site/[slug]
 * Public — no auth. Returns all data needed to render a cabinet site.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Context = { params: Promise<{ slug: string }> }

export async function GET(_req: NextRequest, { params }: Context) {
  const { slug } = await params

  try {
    const cabinet = await prisma.cabinet.findUnique({
      where: { slug },
      select: {
        id: true, nom: true, ville: true, adresse: true,
        telephone: true, email: true, whatsappNumber: true,
        slug: true, logoUrl: true,
        workStartTime: true, workEndTime: true, workingDays: true,
        site: {
          select: {
            id: true, templateId: true, published: true,
            primaryColor: true, secondaryColor: true,
            heroTitle: true, heroSubtitle: true, heroImageUrl: true,
            aboutText: true, googleMapsEmbed: true,
            testimonials: {
              orderBy: { createdAt: 'desc' },
              select: { id: true, patientName: true, text: true, rating: true },
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
    })

    if (!cabinet || !cabinet.site) {
      return NextResponse.json({ error: 'Site introuvable' }, { status: 404 })
    }
    if (!cabinet.site.published) {
      return NextResponse.json({ error: 'Site en construction' }, { status: 404 })
    }

    return NextResponse.json({
      cabinet: {
        nom: cabinet.nom, ville: cabinet.ville, adresse: cabinet.adresse,
        telephone: cabinet.telephone, email: cabinet.email,
        whatsappNumber: cabinet.whatsappNumber, slug: cabinet.slug,
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
    })
  } catch (err) {
    console.error('[GET /api/cabinet-site/[slug]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
