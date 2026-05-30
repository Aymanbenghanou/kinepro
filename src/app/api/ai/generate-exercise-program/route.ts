/**
 * POST /api/ai/generate-exercise-program
 * Calls Claude API to generate a personalized exercise program (JSON).
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { requirePermission } from '@/lib/permissions-server'
import { assertPro } from '@/lib/plan-server'
import { validateBody } from '@/lib/validate'
import { aiExerciseProgramSchema } from '@/lib/schemas/medical'
import type { z } from 'zod'

type Input = z.infer<typeof aiExerciseProgramSchema>

function buildFrenchPrompt(i: Input): string {
  return `Tu es un kinésithérapeute expert. Génère un programme d'exercices personnalisé.

Patient: ${i.patientPrenom}
Pathologie: ${i.pathologie}
Séance: ${i.seanceNumero}/${i.seanceTotal}
Niveau douleur actuel: ${i.niveauDouleur}/10
Objectif: ${i.objectif}
Contraintes: ${i.contraintes || 'Aucune'}
Durée totale: ${i.duree} minutes
Fréquence: ${i.frequence}

Génère un programme structuré en JSON UNIQUEMENT (pas de markdown, pas de backticks). Commence directement par { et termine par }:
{
  "titre": "Titre court du programme",
  "introduction": "Message d'encouragement personnalisé pour le patient (2 phrases)",
  "exercices": [
    {
      "numero": 1,
      "nom": "Nom de l'exercice",
      "description": "Description claire et simple pour le patient",
      "duree": "30 secondes ou 10 répétitions",
      "serie": "3 séries",
      "position": "Position de départ",
      "conseil": "Conseil important pour bien faire l'exercice",
      "attention": "Point d'attention ou contre-indication"
    }
  ],
  "conseils_generaux": ["conseil 1", "conseil 2", "conseil 3"],
  "message_fin": "Message de motivation pour le patient",
  "prochaine_seance": "Ce sur quoi on travaillera à la prochaine séance"
}

Crée entre 4 et 6 exercices adaptés à la pathologie, durée et niveau de douleur.`
}

function buildArabicPrompt(i: Input): string {
  return `أنت أخصائي علاج طبيعي خبير. قم بإنشاء برنامج تمارين شخصي.

المريض: ${i.patientPrenom}
الحالة: ${i.pathologie}
الجلسة: ${i.seanceNumero}/${i.seanceTotal}
مستوى الألم الحالي: ${i.niveauDouleur}/10
الهدف: ${i.objectif}
قيود خاصة: ${i.contraintes || 'لا توجد'}
المدة الإجمالية: ${i.duree} دقائق
التكرار: ${i.frequence}

أنشئ برنامجاً منظماً بصيغة JSON فقط (بدون markdown ولا backticks). ابدأ مباشرة بـ { وانتهِ بـ }:
{
  "titre": "عنوان قصير للبرنامج",
  "introduction": "رسالة تشجيع شخصية للمريض (جملتان)",
  "exercices": [
    {
      "numero": 1,
      "nom": "اسم التمرين",
      "description": "وصف واضح وبسيط للمريض",
      "duree": "30 ثانية أو 10 تكرارات",
      "serie": "3 مجموعات",
      "position": "وضعية البداية",
      "conseil": "نصيحة مهمة لأداء التمرين بشكل صحيح",
      "attention": "نقطة انتباه أو موانع"
    }
  ],
  "conseils_generaux": ["نصيحة 1", "نصيحة 2", "نصيحة 3"],
  "message_fin": "رسالة تحفيز للمريض",
  "prochaine_seance": "ما الذي سنعمل عليه في الجلسة القادمة"
}

أنشئ بين 4 و 6 تمارين مناسبة للحالة، المدة، ومستوى الألم.`
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.cabinetId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Verrou Pro : programmes d'exercices IA réservés aux cabinets Pro (et exemptés / en essai).
  const __perm = await requirePermission('programmesEtDocs'); if (__perm instanceof NextResponse) return __perm;

  const proGate = await assertPro(); if (proGate) return proGate

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Clé API Claude non configurée. Ajoutez ANTHROPIC_API_KEY dans les variables d'environnement." },
      { status: 503 },
    )
  }

  try {
    const v = await validateBody(req, aiExerciseProgramSchema)
    if ('error' in v) return v.error
    const body = v.data

    const prompt = body.langue === 'ar' ? buildArabicPrompt(body) : buildFrenchPrompt(body)

    const r = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!r.ok) {
      const errBody = await r.text()
      console.error('[generate-exercise-program] Anthropic error', r.status, errBody)
      return NextResponse.json({ error: `Erreur API Claude (${r.status})` }, { status: 502 })
    }

    const data = await r.json()
    const raw: string = data.content?.[0]?.text ?? ''
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let parsed: any
    try { parsed = JSON.parse(jsonText) } catch (e) {
      console.error('[generate-exercise-program] JSON parse failed:', raw.slice(0, 400))
      return NextResponse.json({ error: 'Réponse IA invalide (JSON parse error)' }, { status: 502 })
    }

    if (!parsed.exercices || !Array.isArray(parsed.exercices)) {
      return NextResponse.json({ error: 'Programme généré incomplet' }, { status: 502 })
    }

    return NextResponse.json(parsed)
  } catch (e) {
    console.error('[generate-exercise-program]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, { status: 500 })
  }
}
