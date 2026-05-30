/**
 * POST /api/super-admin/sites/[cabinetId]/generate-content
 * Uses Claude API to generate bilingual (FR+AR) site content and saves it.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertSuperAdmin } from '@/lib/super-admin-guard'

type Context = { params: Promise<{ cabinetId: string }> }

export async function POST(req: NextRequest, { params }: Context) {
  const __sa = await assertSuperAdmin(); if (__sa) return __sa
  const { cabinetId } = await params

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[generate-content] Missing ANTHROPIC_API_KEY env variable')
    return NextResponse.json(
      { error: 'Clé API Claude non configurée. Ajoutez ANTHROPIC_API_KEY dans les variables d\'environnement.' },
      { status: 503 }
    )
  }

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

    if (!cabinet) {
      return NextResponse.json({ error: 'Cabinet introuvable' }, { status: 404 })
    }

    const praticiensList = cabinet.praticiens
      .map(p => `${p.prenom} ${p.nom}${p.specialite ? ` (${p.specialite})` : ''}`)
      .join(', ') || 'Kinésithérapeute diplômé'
    const servicesList = cabinet.seanceTypes
      .map(s => `${s.nom}${s.dureeDefaut ? ` — ${s.dureeDefaut}min` : ''}${s.tarifDefaut ? ` — ${s.tarifDefaut} MAD` : ''}`)
      .join(', ') || 'Kinésithérapie générale, Rééducation, Massage thérapeutique'
    const templateId = cabinet.site?.templateId ?? 'medical'

    const prompt = `Tu es un expert en marketing pour cabinets de kinésithérapie au Maroc.
Génère le contenu complet pour le site web du cabinet suivant:
Cabinet: ${cabinet.nom}
Ville: ${cabinet.ville ?? 'Maroc'}
Praticiens: ${praticiensList}
Services: ${servicesList}
Template style: ${templateId}

Réponds UNIQUEMENT en JSON valide sans markdown ni backticks. Commence directement par { et termine par }:
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
      {"name": "الاسم ب.", "text": "شهادة واقعية 2-3 جمل", "rating": 5},
      {"name": "الاسم م.", "text": "شهادة واقعية 2-3 جمل", "rating": 5},
      {"name": "الاسم ع.", "text": "شهادة واقعية 2-3 جمل", "rating": 4}
    ]
  }
}`

    // ── Call Claude API ──────────────────────────────────────────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text()
      console.error('[generate-content] Anthropic API error:', anthropicRes.status, errBody)
      return NextResponse.json(
        { error: `Erreur API Claude (${anthropicRes.status}): ${errBody.slice(0, 200)}` },
        { status: 502 }
      )
    }

    const anthropicData = await anthropicRes.json()
    const rawText: string = anthropicData.content?.[0]?.text ?? ''

    // Strip markdown code fences if present
    const jsonText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()

    let parsed: { fr: Record<string, any>; ar: Record<string, any> }
    try {
      parsed = JSON.parse(jsonText)
    } catch (parseErr) {
      console.error('[generate-content] JSON parse failed. Raw text:', rawText.slice(0, 800))
      return NextResponse.json(
        { error: `Réponse IA invalide (JSON parse error). Raw: ${rawText.slice(0, 200)}` },
        { status: 502 }
      )
    }

    const { fr, ar } = parsed
    if (!fr || !ar) {
      console.error('[generate-content] Missing fr or ar in parsed response:', JSON.stringify(parsed).slice(0, 300))
      return NextResponse.json({ error: 'Réponse IA incomplète: champs fr/ar manquants' }, { status: 502 })
    }

    // ── Save to DB ───────────────────────────────────────────────────────────
    const frTestimonials: { name: string; text: string; rating: number }[] = fr.testimonials ?? []
    const arTestimonials: { name: string; text: string; rating: number }[] = ar.testimonials ?? []

    const contentFrClean = { ...fr, testimonials: undefined }
    const contentArClean = { ...ar, testimonials: undefined }

    const site = await prisma.cabinetSite.upsert({
      where: { cabinetId },
      create: { cabinetId, contentFr: contentFrClean, contentAr: contentArClean },
      update: { contentFr: contentFrClean, contentAr: contentArClean },
    })

    // Replace AI testimonials
    await prisma.testimonial.deleteMany({ where: { cabinetSiteId: site.id } })

    const maxLen = Math.max(frTestimonials.length, arTestimonials.length)
    for (let i = 0; i < maxLen; i++) {
      const f = frTestimonials[i]
      const a = arTestimonials[i]
      await prisma.testimonial.create({
        data: {
          cabinetSiteId: site.id,
          patientName: f?.name ?? a?.name ?? 'Patient',
          textFr: f?.text ?? '',
          textAr: a?.text ?? '',
          rating: f?.rating ?? a?.rating ?? 5,
        },
      })
    }

    const updatedSite = await prisma.cabinetSite.findUnique({
      where: { cabinetId },
      include: { testimonials: { orderBy: { createdAt: 'desc' } } },
    })

    return NextResponse.json(updatedSite)

  } catch (err) {
    console.error('[generate-content] Unexpected error:', err)
    return NextResponse.json(
      { error: `Erreur serveur: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
