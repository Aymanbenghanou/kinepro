import { z } from 'zod'

/**
 * Schemas zod pour les routes praticien/secrétaire (/api/praticiens/*).
 * Adaptés EXACTEMENT aux champs lus par les handlers.
 */

// Permissions : objet à 5 clés booléennes, strictement. Pas de clés en plus.
const permissionsSchema = z.object({
  agenda:           z.boolean(),
  patients:         z.boolean(),
  dossierMedical:   z.boolean(),
  programmesEtDocs: z.boolean(),
  factures:         z.boolean(),
}).strict()

// ─── POST /api/praticiens ────────────────────────────────────────────────────
// Branche par rôle :
//  - PRATICIEN  → specialite REQUISE, couleur OK, acces opt (peut être OFF).
//  - SECRETAIRE → specialite/couleur INTERDITES, acces obligatoirement true.
// Email/password requis dès que acces===true (le handler valide ensuite la
// règle email-unique et hash le password).

const basePraticienFields = {
  nom:         z.string().min(1).max(100),
  prenom:      z.string().min(1).max(100),
  telephone:   z.string().max(50).optional().nullable(),
  acces:       z.boolean().optional(),
  email:       z.string().email().max(200).optional(),
  password:    z.string().min(6).max(200).optional(),
  permissions: permissionsSchema.optional(),
}

const praticienBranch = z.object({
  role:       z.literal('PRATICIEN'),
  specialite: z.string().min(1).max(200),
  couleur:    z.string().min(1).max(20).optional(),
  ...basePraticienFields,
})

const secretaireBranch = z.object({
  role:       z.literal('SECRETAIRE'),
  // specialite et couleur interdites pour Secrétaire — strict undefined.
  specialite: z.undefined().optional(),
  couleur:    z.undefined().optional(),
  acces:      z.literal(true),    // toujours true pour SECRETAIRE
  ...{
    nom:         basePraticienFields.nom,
    prenom:      basePraticienFields.prenom,
    telephone:   basePraticienFields.telephone,
    email:       basePraticienFields.email,
    password:    basePraticienFields.password,
    permissions: basePraticienFields.permissions,
  },
})

export const createPraticienSchema = z.discriminatedUnion('role', [
  praticienBranch,
  secretaireBranch,
])

// ─── PATCH /api/praticiens/[id] ──────────────────────────────────────────────
// Le rôle, s'il est fourni, est rejeté par la logique existante s'il diffère
// de celui en base (`role_change_not_allowed` 400). On l'accepte ici en
// optionnel — la décision reste côté handler.
export const updatePraticienSchema = z.object({
  role:        z.enum(['PRATICIEN', 'SECRETAIRE']).optional(),
  nom:         z.string().min(1).max(100).optional(),
  prenom:      z.string().min(1).max(100).optional(),
  specialite:  z.string().max(200).optional().nullable(),
  telephone:   z.string().max(50).optional().nullable(),
  couleur:     z.string().min(1).max(20).optional(),
  actif:       z.boolean().optional(),
  permissions: permissionsSchema.optional(),
})

// ─── POST /api/praticiens/[id]/acces ─────────────────────────────────────────
// Création/réinitialisation d'un compte app pour un membre existant.
// email + password requis ; permissions optionnelle (garde-fou agenda=true
// appliqué par le handler pour un PRATICIEN).
export const accesPraticienSchema = z.object({
  email:       z.string().email().max(200),
  password:    z.string().min(6).max(200),
  permissions: permissionsSchema.optional(),
})
