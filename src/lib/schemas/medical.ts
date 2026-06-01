import { z } from 'zod'
import { RdvStatut, SeanceStatut } from '@prisma/client'

/**
 * Schemas zod pour les routes médicales :
 *   /api/patients, /api/rendez-vous, /api/seances, /api/ai/generate-exercise-program.
 * Adaptés EXACTEMENT aux champs lus par les handlers actuels.
 */

// ─── Patients ────────────────────────────────────────────────────────────────

// POST /api/patients — nom + prenom requis ; reste optionnel/nullable.
// Les dates et nombres sont reçus en string (le handler parse).
export const createPatientSchema = z.object({
  nom:                 z.string().min(1).max(100),
  prenom:              z.string().min(1).max(100),
  dateNaissance:       z.string().min(1).max(50).optional().nullable(),
  sexe:                z.string().max(20).optional().nullable(),
  telephone:           z.string().max(50).optional().nullable(),
  email:               z.string().email().max(200).optional().nullable(),
  adresse:             z.string().max(500).optional().nullable(),
  ville:               z.string().max(100).optional().nullable(),
  cin:                 z.string().max(50).optional().nullable(),
  pathologie:          z.string().max(2000).optional().nullable(),
  antecedents:         z.string().max(2000).optional().nullable(),
  allergies:           z.string().max(1000).optional().nullable(),
  medicaments:         z.string().max(1000).optional().nullable(),
  medecinReferent:     z.string().max(200).optional().nullable(),
  medecinTelephone:    z.string().max(50).optional().nullable(),
  mutuelle:            z.string().max(200).optional().nullable(),
  numeroPolice:        z.string().max(100).optional().nullable(),
  // tarifSeance et nbSeancesPrescrites : le handler accepte string et parseFloat/parseInt.
  // On accepte number ou string ici, le handler gère le casting.
  tarifSeance:         z.union([z.number(), z.string()]).optional().nullable(),
  modePaiement:        z.string().max(50).optional().nullable(),
  nbSeancesPrescrites: z.union([z.number(), z.string()]).optional().nullable(),
  frequence:           z.string().max(100).optional().nullable(),
  praticienAssigneId:  z.string().min(1).optional().nullable(),
  typesSeances:        z.string().max(500).optional().nullable(),
  objectifsTraitement: z.string().max(2000).optional().nullable(),
  dateDebutSouhaite:   z.string().min(1).max(50).optional().nullable(),
})

// PUT /api/patients/[id] — partial du create, plus le flag actif.
// Note : la route actuelle écrase tous les champs non fournis à null
// (`body.X || null`). Ce schema ne corrige PAS ce comportement, il valide
// uniquement la forme.
export const updatePatientSchema = createPatientSchema.partial().extend({
  actif: z.boolean().optional(),
})

// ─── Rendez-vous ────────────────────────────────────────────────────────────

// POST /api/rendez-vous — date + patientId + praticienId + typeSeance requis.
// Pour PRATICIEN, le handler override praticienId côté serveur (étape 4) ;
// on accepte la valeur ici, la logique métier décidera.
export const createRdvSchema = z.object({
  date:        z.string().min(1).max(50),     // ISO ou parsable par new Date()
  duree:       z.number().int().positive().max(600).optional(),
  typeSeance:  z.string().min(1).max(200),
  salle:       z.string().max(100).optional().nullable(),
  notes:       z.string().max(2000).optional().nullable(),
  statut:      z.nativeEnum(RdvStatut).optional(),
  patientId:   z.string().min(1),
  praticienId: z.string().min(1),
  patientNotes: z.string().max(2000).optional().nullable(),
  source:      z.enum(['cabinet', 'online', 'phone']).optional(),
})

// PUT /api/rendez-vous/[id] — partial. La logique étape 4 force praticienId
// au sessionPraticienId pour un PRATICIEN — ce schema ne change rien à ce
// comportement, il accepte juste le champ en entrée.
export const updateRdvSchema = createRdvSchema.partial()

// ─── Séances ────────────────────────────────────────────────────────────────

// POST /api/seances — date + patientId + praticienId + typeSeance requis.
export const createSeanceSchema = z.object({
  date:        z.string().min(1).max(50),
  duree:       z.number().int().positive().max(600).optional(),
  typeSeance:  z.string().min(1).max(200),
  notes:       z.string().max(5000).optional().nullable(),
  statut:      z.nativeEnum(SeanceStatut).optional(),
  patientId:   z.string().min(1),
  praticienId: z.string().min(1),
})

// Échelles cliniques : entier 0..10. Réutilisé par updateSeance + terminerSeance.
const score0to10 = z.number().int().min(0).max(10)

// PATCH /api/seances/[id]/terminer — passe une séance "planifiee" en "realisee"
// avec saisie optionnelle des notes médicales. observations → notesInternes
// côté handler (la séance n'a pas de champ "observations" dédié).
export const terminerSeanceSchema = z.object({
  douleurScore:     score0to10.optional().nullable(),
  mobiliteScore:    score0to10.optional().nullable(),
  forceScore:       score0to10.optional().nullable(),
  notesProgression: z.string().max(5000).optional().nullable(),
  observations:     z.string().max(5000).optional().nullable(),
})

// PATCH /api/seances/[id] — uniquement les champs cliniques + statut + notes.
// Scores : 0..10 (échelle douleur/mobilité/force) ; scorePatient idem.
export const updateSeanceSchema = z.object({
  statut:           z.nativeEnum(SeanceStatut).optional(),
  scorePatient:     score0to10.optional().nullable(),
  notesInternes:    z.string().max(5000).optional().nullable(),
  feedbackEnvoye:   z.boolean().optional(),
  notes:            z.string().max(5000).optional().nullable(),
  douleurScore:     score0to10.optional().nullable(),
  mobiliteScore:    score0to10.optional().nullable(),
  forceScore:       score0to10.optional().nullable(),
  notesProgression: z.string().max(5000).optional().nullable(),
})

// ─── IA programme d'exercices ───────────────────────────────────────────────

// POST /api/ai/generate-exercise-program — borne la taille des textes libres
// pour éviter d'envoyer des prompts géants à Anthropic.
export const aiExerciseProgramSchema = z.object({
  patientPrenom: z.string().min(1).max(100),
  pathologie:    z.string().min(1).max(2000),
  seanceNumero:  z.number().int().positive().max(1000),
  seanceTotal:   z.number().int().positive().max(1000),
  niveauDouleur: z.number().int().min(0).max(10),
  objectif:      z.string().min(1).max(2000),
  contraintes:   z.string().max(2000).optional().nullable(),
  duree:         z.number().int().positive().max(240),  // minutes
  frequence:     z.string().min(1).max(200),
  langue:        z.enum(['fr', 'ar']),
})
