<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:kinepro-project-rules -->
# KinéPro — Project conventions for AI agents

Ce fichier centralise les règles spécifiques au projet KinéPro. Toute modification de code ou de schéma DOIT respecter ces conventions. Si une instruction utilisateur entre en conflit avec ces règles, demander confirmation avant de procéder.

## 1. Schema Prisma — workflow migrations strict

`prisma migrate dev` ÉCHOUE dans ce repo (les 4 migrations historiques ne créent pas toutes les tables — User, Subscription, Document, etc. ont été posées via db push pendant le développement initial). Utiliser le **workflow alternatif** validé :

1. Modifier `prisma/schema.prisma`.
2. Créer le dossier `prisma/migrations/<YYYYMMDDHHMMSS>_<nom_court>/`.
3. Générer le SQL :
   `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_<nom>/migration.sql`
4. **STOP — INSPECTER LE SQL avant d'exécuter quoi que ce soit.**
   `prisma migrate diff` génère du SQL **naïf**, souvent destructif. Chercher :
   - `DROP COLUMN` sur une colonne contenant des données → réécrire en `ALTER COLUMN TYPE ... USING`
   - `DROP TABLE` → toujours destructif
   - Modifications de DEFAULT sans pattern `DROP DEFAULT → ALTER TYPE → SET DEFAULT` (Postgres rejette sinon)
   - `DROP CONSTRAINT` + `ADD CONSTRAINT` différent → vérifier le ON DELETE
5. Si le SQL contient des opérations destructives, **réécrire manuellement** en préservant les données. Inclure le SQL d'origine ET le SQL final dans le rapport.
6. Exécuter : `npx prisma db execute --file prisma/migrations/<timestamp>_<nom>/migration.sql --schema prisma/schema.prisma`
7. Marquer comme appliquée : `npx prisma migrate resolve --applied <timestamp>_<nom>`
8. Régénérer le client : `npx prisma generate`.
9. Vérifier : `npx prisma migrate status` doit dire "Database schema is up to date".
10. Lancer un audit pertinent (count par valeur, distinct values, etc.) pour confirmer la préservation des données pré/post migration.

**Règle d'or : JAMAIS `prisma db execute` sans avoir lu et validé le SQL ligne par ligne.**

NE PAS utiliser `prisma db push` pour des changements de schéma — il bypass l'historique des migrations et casse la traçabilité. Si une exception est nécessaire (test local jetable), documenter explicitement pourquoi.

## 2. Configuration Prisma

- `prisma.config.ts` à la racine définit `url` et `directUrl` (Prisma 7+ convention). NE PAS déplacer ces valeurs dans `schema.prisma`.
- `src/lib/prisma.ts` est un singleton avec `pg.Pool max:1` + `PrismaPg` adapter. NE PAS le modifier ni le contourner. Toute route doit importer `prisma` depuis ce fichier.

## 3. Authentification et autorisation — toujours 3 niveaux

Toute route mutante (POST/PUT/PATCH/DELETE) DOIT passer les 3 gardes dans cet ordre :

1. `auth()` (session NextAuth) → 401 si pas de session
2. `assertNotWalled(cabinetId)` (mur d'essai) → 402 si plan expiré
3. `requirePermission('clé')` ou `assertOwner()` → 403 si permission manquante

Pour les routes super-admin : utiliser `assertSuperAdmin()` de `src/lib/super-admin-guard.ts` (NE PAS recréer un check inline).

Permissions disponibles (clés exactes) : `agenda`, `patients`, `dossierMedical`, `programmesEtDocs`, `factures`. Les paramètres cabinet sont toujours OWNER-only (pas de permission custom).

Rôles (utiliser l'enum Prisma `UserRole`) : `CABINET_OWNER`, `PRATICIEN`, `SECRETAIRE`, `SUPER_ADMIN`.

## 4. Validation des inputs — zod obligatoire

Toute route mutante DOIT valider son body avec un schema zod. Pattern :

```
import { validateBody } from '@/lib/validate'
import { createPatientSchema } from '@/lib/schemas/medical'

const v = await validateBody(req, createPatientSchema)
if ('error' in v) return v.error
const body = v.data  // typé strictement
```

Schemas centralisés dans `src/lib/schemas/` par domaine (auth, billing, medical, staff, cabinet). Pour les enums : utiliser `z.nativeEnum(EnumName)` plutôt que `z.enum([...])`.

## 5. Rate limiting — routes publiques

Toute route publique (non authentifiée) DOIT être protégée par un limiter Upstash. Pattern :

```
import { checkRateLimit, publicLimiter } from '@/lib/rate-limit'

const rl = await checkRateLimit(req, publicLimiter)
if (rl) return rl
```

Limiters disponibles : `authLimiter` (5/10min, pour register/password), `publicLimiter` (20/1min, pour booking/feedback/checkin), `strictLimiter` (3/1h, réservé). NE PAS appliquer sur les routes authentifiées (déjà gardées par session) ni sur `/api/super-admin/**`, `/api/cron/**`, `/api/push/**`, `/api/admin/**`.

## 6. Mises à jour partielles — diff-only

Pour toute route `PUT`/`PATCH` qui met à jour une entité existante : NE JAMAIS construire `data: { field: body.field || null }` pour chaque champ. Ce pattern écrase silencieusement les champs absents. Toujours utiliser :

```
const updates: Prisma.XUpdateInput = {}
for (const key of Object.keys(body)) {
  updates[key] = body[key]  // null explicite = effacement volontaire
}
```

Un champ absent du body = champ DB intact. Un champ explicitement `null` = effacement.

## 7. Plan / mur d'essai

- Source de vérité : `Cabinet.plan` + `Cabinet.planStatus` + `Cabinet.trialEndsAt`.
- `Subscription` est un modèle vestigial (écrit à la création, jamais relu). NE PAS l'utiliser pour la logique d'accès.
- `EXISTING_CABINETS_CUTOFF = 2026-05-26T00:00:00Z` dans `src/lib/plan.ts` : exempte les cabinets créés avant cette date du mur d'essai. Conservée pour rétrocompatibilité.
- Helpers : `getPlanState`, `hasProAccess`, `assertNotWalled`, `assertPro`.

## 8. Enums Prisma — toujours via l'enum, jamais le littéral

Depuis la migration A3, tous les champs sémantiquement énumérés sont des enums Prisma. NE JAMAIS écrire `statut: 'realisee'` — toujours `statut: SeanceStatut.realisee`. Import depuis `@prisma/client`.

Enums actuels : `UserRole`, `RdvStatut` (singulier : confirme/en_attente/annule/realise), `SeanceStatut` (féminin : realisee/planifiee/annulee/no_show), `FactureStatut`, `ModePaiement`, `CabinetPlan`, `CabinetPlanStatus`, `BillingCycle`, `DemandeStatut`.

NOTE : `RdvStatut` et `SeanceStatut` ont un mismatch singulier/féminin volontaire (décision produit, hors scope d'uniformisation).

## 9. Build et déploiement

- `vercel.json` buildCommand : `prisma generate && prisma migrate deploy && next build`.
- NE PAS modifier le buildCommand sans nécessité explicite.
- NE JAMAIS faire `vercel deploy --prod` manuellement — toujours `git push origin main`, qui déclenche le déploiement automatique. Sinon race condition entre Vercel CI et push.
- Avant tout commit : `npm run build` localement. Si fail, NE PAS commit.

## 10. Workflow par défaut d'une feature/fix

1. Lire ce fichier en entier.
2. Comprendre le scope exact demandé. Si ambigu, demander.
3. Implémenter en respectant TOUTES les conventions ci-dessus.
4. `npm run build` ; si fail, STOP et signaler.
5. Si build OK : `git add . && git commit -m "..." && git push origin main`.
6. Produire un rapport final structuré listant les fichiers modifiés et les choix non évidents (incohérences détectées, valeurs orphelines en DB, etc.).

## 11. Ce qu'il NE FAUT JAMAIS faire sans confirmation explicite

- Modifier `prisma.config.ts`, `src/lib/prisma.ts`, le datasource ou le middleware.
- Supprimer ou écraser les migrations historiques.
- Faire `prisma db push` sur des champs de données.
- Désactiver un guard d'authentification ou de permission.
- Commiter `.env.development.local`, `.env.local`, ou tout fichier contenant des secrets.
- Logger des secrets, tokens, ou mots de passe (même en cas de debug — utiliser des placeholders).
<!-- END:kinepro-project-rules -->
