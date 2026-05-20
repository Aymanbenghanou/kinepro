/**
 * POST /api/super-admin/sites/[cabinetId]/generate-content
 * Uses Claude API to generate bilingual (FR+AR) site content and saves it.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

type Context = { params: Promise<{ cabinetId: string }> }

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') return null
  return session
}

export async function POST(req: NextRequest, { params }: Context) {
  if (!await requireSuperAdmin()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { cabinetId } = await params

  try {
    // Gather cabinet context
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: {
        nom: true, ville: true,
        seanceTypes: { where: { actif: true }, select: { nom: true, dureeDefaut: true, tarifDefaut: true } },
        praticiens: { where: { actif: true }, select: { nom: true, prenom: true, specialite: true } },
        site: { select: { templateId: true } },
      },
    })
    if (!cabinet) return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 404 })

    const praticiensList = cabinet.praticiens
      .map(p => `${p.prenom} ${p.nom}${p.specialite ? ` (${p.specialite})` : ''}`)
      .join(', ') || 'Kinésithérapeute diplômé'
    const servicesList = cabinet.seanceTypes
      .map(s => `${s.nom}${s.dureeDefaut ? ` — ${s.dureeDefaut}min` : ''}${s.tarifDefaut ? ` — ${s.tarifDefaut} MAD` : ''}`)
      .join(', ') || 'Kinésithérapie générale'
    const templateId = cabinet.site?.templateId ?? 'medical'

    const prompt = `Tu es un expert en marketing pour cabinets de kinésithérapie au Maroc.
Génère le contenu complet pour le site web du cabinet suivant:
Cabinet: ${cabinet.nom}
Ville: ${cabinet.ville ?? 'Maroc'}
Praticiens: ${praticiensList}
Services: ${servicesList}
Template style: ${templateId}

Réponds UNIQUEMENT en JSON valide sans markdown:
{
  "fr": {
    "heroTitle": "titre accrocheur max 8 mots",
    "heroSubtitle": "sous-titre professionnel max 20 mots",
    "aboutTitle": "À propos de notre cabinet",
    "aboutText": "texte professionnel et chaleureux 3-4 phrases",
    "servicesTitle": "Nos services",
    "servicesSubtitle": "sous-titre services",
    "teamTitle": "Notre équipe",
    "teamSubtitle": "sous-titre équipe",
    "bookingTitle": "Prendre rendez-vous",
    "bookingSubtitle": "sous-titre réservation max 15 mots",
    "testimonialsTitle": "Ce que disent nos patients",
    "contactTitle": "Nous trouver",
    "seoTitle": "titre SEO max 60 chars",
    "seoDescription": "meta description max 155 chars",
    "stats": [
      {"number": "500+", "label": "Patients traités"},
      {"number": "10+", "label": "Années d'expérience"},
      {"number": "98%", "label": "Patients satisfaits"}
    ],
    "testimonials": [
      {"name": "Prénom M.", "text": "témoignage réaliste 2-3 phrases", "rating": 5},
      {"name": "Prénom B.", "text": "témoignage réaliste 2-3 phrases", "rating": 5},
      {"name": "Prénom E.", "text": "témoignage réaliste 2-3 phrases", "rating": 4}
    ]
  },
  "ar": {
    "heroTitle": "عنوان جذاب بالعربية",
    "heroSubtitle": "وصف مهني بالعربية",
    "aboutTitle": "من نحن",
    "aboutText": "نص تعريفي احترافي 3-4 جمل",
    "servicesTitle": "خدماتنا",
    "servicesSubtitle": "وصف الخدمات",
    "teamTitle": "فريقنا",
    "teamSubtitle": "وصف الفريق",
    "bookingTitle": "احجز موعدك",
    "bookingSubtitle": "وصف قصير للحجز",
    "testimonialsTitle": "آراء مرضانا",
    "contactTitle": "أين نجدنا",
    "seoTitle": "عنوان SEO",
    "seoDescription": "وصف meta",
    "stats": [
      {"number": "500+", "label": "مريض تم علاجه"},
      {"number": "10+", "label": "سنوات خبرة"},
      {"number": "98%", "label": "مرضى راضون"}
    ],
    "testimonials": [
      {"name": "الاسم", "text": "شهادة واقعية 2-3 جمل", "rating": 5},
      {"name": "الاسم", "text": "شهادة واقعية 2-3 جمل", "rating": 5},
      {"name": "الاسم", "text": "شهادة واقعية 2-3 جمل", "rating": 4}
    ]
  }
}`

    // Call Claude API
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text()
      console.error('[generate-content] Anthropic error:', errBody)
      return NextResponse.json({ error: 'Erreur API Claude' }, { status: 502 })
    }

    const anthropicData = await anthropicRes.json()
    const rawText: string = anthropicData.content?.[0]?.text ?? ''

    // Strip markdown code fences if present
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let parsed: { fr: Record<string, any>; ar: Record<string, any> }
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      console.error('[generate-content] JSON parse error, raw:', rawText.slice(0, 500))
      return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 502 })
    }

    const { fr, ar } = parsed

    // Extract testimonials for the Testimonial table
    const frTestimonials: { name: string; text: string; rating: number }[] = fr.testimonials ?? []
    const arTestimonials: { name: string; text: string; rating: number }[] = ar.testimonials ?? []

    // Upsert site with content (without testimonials array in JSON)
    const contentFrClean = { ...fr, testimonials: undefined }
    const contentArClean = { ...ar, testimonials: undefined }

    const site = await prisma.cabinetSite.upsert({
      where: { cabinetId },
      create: { cabinetId, contentFr: contentFrClean, contentAr: contentArClean },
      update: { contentFr: contentFrClean, contentAr: contentArClean },
    })

    // Replace existing AI testimonials (delete all, recreate)
    await prisma.testimonial.deleteMany({ where: { cabinetSiteId: site.id } })

    const maxLen = Math.max(frTestimonials.length, arTestimonials.length)
    const testimonials = []
    for (let i = 0; i < maxLen; i++) {
      const f = frTestimonials[i]
      const a = arTestimonials[i]
      const t = await prisma.testimonial.create({
        data: {
          cabinetSiteId: site.id,
          patientName: f?.name ?? a?.name ?? 'Patient',
          textFr: f?.text ?? '',
          textAr: a?.text ?? '',
          rating: f?.rating ?? a?.rating ?? 5,
        },
      })
      testimonials.push(t)
    }

    const updatedSite = await prisma.cabinetSite.findUnique({
      where: { cabinetId },
      include: { testimonials: { orderBy: { createdAt: 'desc' } } },
    })

    return NextResponse.json(updatedSite)
  } catch (err) {
    console.error('[generate-content]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
