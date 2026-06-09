# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Project conventions (mandatory rules) live in `@AGENTS.md`** — migrations workflow, auth/permission chain, zod validation, rate limiting, plan/wall helpers, enum usage, deploy. Read it before any non-trivial change.

## Stack

- **Next.js 16.2.6 (App Router)** — *not* Next 14. Read `node_modules/next/dist/docs/01-app/...` if uncertain about an API (e.g. `revalidateTag` now takes 2 args, `updateTag` is the immediate-invalidation form; `unstable_cache` still exported).
- **React 19.2.4** (Server Components by default).
- **Prisma 7.8** + PostgreSQL via **Supabase pooler** (port 6543 PgBouncer for app, 5432 direct for migrations).
- **NextAuth v5** (JWT strategy, no DB sessions).
- **Tailwind v4** on `(dashboard)` desktop, **inline styles** on `(mobile)/m/*` (consistent across all mobile files).

## Common commands

```bash
npm run dev        # next dev (localhost:3000) — useless for end-to-end since deploy is Vercel
npm run build      # prisma generate && next build — runs full TS check; required before commit
npm run lint       # eslint
npm test           # vitest run (sparse coverage, src/lib/plan.test.ts is the main one)
npx tsc --noEmit   # fast type check (no emit, no Prisma generate)

# Prisma (see AGENTS.md §1 for the strict migration workflow — diff → inspect → execute → resolve)
npx prisma migrate status
npx prisma generate
npx prisma db execute --file prisma/migrations/<ts>_<name>/migration.sql
npx prisma migrate resolve --applied <ts>_<name>

# DB inspection script pattern (env-loaded singleton)
# cat > _q.mjs <<'EOF'
# const { prisma } = await import('/abs/path/src/lib/prisma.ts')
# console.log(await prisma.patient.count())
# process.exit(0)
# EOF
# npx tsx --env-file=.env.development.local _q.mjs
```

**Deploy** : `git push origin main` triggers Vercel auto-deploy (`vercel.json` buildCommand = `prisma generate && prisma migrate deploy && next build`). **Never** run `vercel deploy --prod` manually (race with CI).

## Route topology (App Router)

```
src/app/
  layout.tsx                   # root — mounts SessionProvider + AppConfigProvider (DB-backed support config)
  page.tsx                     # landing (server)
  login/, register removed     # no self-service — high-touch only
  (dashboard)/                 # desktop authed area
    layout.tsx                 # auth guard + trial wall (suspended/expired → /abonnement)
    dashboard, agenda, patients, seances, facturation, whatsapp,
    rapports, personnel, abonnement, parametres/{cabinet,types-seances,notifications}, compte
  (mobile)/m/*                 # mobile authed area (middleware UA-detects + redirects /xxx → /m/xxx)
    layout.tsx                 # same wall, redirects to /m/abonnement (NOT /abonnement)
    dashboard, agenda, patients/[id], seances, facturation, whatsapp, abonnement
  super-admin/                 # SUPER_ADMIN only (assertSuperAdmin)
    layout.tsx (sidebar: Vue d'ensemble, Cabinets, Paramètres)
    cabinets/, cabinets/new, cabinets/[id], parametres (DB-backed AppConfig)
  patient-public/[token], scan/[token], checkin/[cabinetToken]  # public (rate-limited)
  api/
    auth/[...nextauth]
    patients/*, facturation/*, seances/*, rendez-vous/*, exercise-programs/*
    super-admin/{cabinets,app-config,bank-accounts}/...
    plan/me                    # client useProAccess() consumes this
```

`middleware.ts` (deprecated naming in Next 16, kept) routes mobile UAs to `/m/*` and back. **Never** modify it without explicit permission (AGENTS.md §11).

## Auth & access layers (server)

Mutation handlers must chain (AGENTS.md §3):

```ts
const __wall = await assertNotWalled(); if (__wall) return __wall          // 402 if trial expired or suspended
const __perm = await requirePermission('patients'); if (__perm instanceof NextResponse) return __perm  // 403
// then auth() for session.user.cabinetId
```

For super-admin: `const sa = await assertSuperAdmin(); if (sa) return sa`. For cabinet-settings (no granular permission key): `assertOwner()`.

**Source of truth for plan**: `Cabinet.plan` + `Cabinet.planStatus` + `Cabinet.trialEndsAt` (AGENTS.md §7). `Subscription` model has been dropped. `EXISTING_CABINETS_CUTOFF = 2026-05-26` exempts pre-cutoff cabinets from the wall (rétrocompat).

**Client-side access** : `useCan('patients'|'factures'|...)` from `src/lib/use-permissions.ts`. Pro feature gate: `useProAccess()` from `src/lib/use-plan.ts` (returns `boolean|null`, error-permissive).

## Cross-cutting providers

- **Session** : `SessionProvider` from `next-auth/react`, mounted at root layout.
- **AppConfig** : `AppConfigProvider` mounted at root, fed by `getAppConfig()` (cached 1h via `unstable_cache`, invalidated by `updateTag('app-config')` on PATCH). Client components read support WhatsApp via `useAppConfig()` + `buildContactCtaUrl()` from `src/lib/contact-cta.ts`. **Never** import `getAppConfig()` in a client component (it's `'server-only'`).

## Storage (Supabase)

Bucket `patient-documents`. Path scheme `{cabinetId}/{patientId}/{uuid}.{ext}`. Helpers in `src/lib/supabase.ts`:
- `removeObject(path)` single
- `removeObjects(paths[])` bulk best-effort (returns `{ deleted, errors }`, never throws)

Patient anonymisation (`DELETE /api/patients/[id]`) collects `Document.url`s **before** the DB transaction, then post-commit bulk-removes. Storage errors are logged, not rolled back.

## Patient anonymisation pattern

`DELETE /api/patients/[id]` is **not** a hard delete:
- Blocked if any `FactureStatut.paye` exists → 409 `patient_has_paid_factures`.
- Hard-deletes `RendezVous, Document, ExerciceProgram, WhatsAppLog, Feedback`.
- Keeps `Seance, Facture, Paiement` (medical/financial audit trail) linked to an **anonymised** Patient row: PII → null, `nom='Patient supprimé'`, `prenom=''`, `publicToken=null`, `deletedAt=now()`.
- All `prisma.patient.find*` reading queries must filter `deletedAt: null` to hide anonymised rows from lists/dashboards/reports.

## Mobile route group conventions

- Mobile is **read-only with one exception** : document upload from patient detail. All other mutations are stripped.
- Uses **inline styles** (no Tailwind classes in `(mobile)/m/*`).
- Patient detail tab pattern (`/m/patients/[id]`) is a client component fetching `/api/patients/${id}` with 6 tabs (Infos, Séances, Factures, Progrès, Docs, QR).

## Useful libraries (project-specific)

- `src/lib/plan.ts` — `DEFAULT_TRIAL_DAYS=15`, `getPlanState`, `hasProAccess`, `getTrialDaysLeft`. Cabinets created via `/api/super-admin/cabinets/create` get 15-day trial.
- `src/lib/permissions.ts` — keys: `agenda, patients, dossierMedical, programmesEtDocs, factures`.
- `src/lib/contact-cta.ts` — `buildContactCtaUrl(num?)` (pure), `formatPhoneFR()`, fallback to env vars.
- `src/lib/colors.ts` — `PRATICIEN_COULEURS` palette + `deterministicPraticienColor(seed)`.
- `src/lib/schemas/` — zod schemas by domain (auth, medical, billing, cabinet, staff, app-config, admin-cabinet).

## Pro-feature lock pattern (freemium)

`POST /api/exercise-programs`, `POST /api/ai/generate-exercise-program`, `POST /api/patients/[id]/documents` (+ upload-url, DELETE) require `assertPro()` after `assertNotWalled` and `requirePermission`. GET reads stay free (legacy preview).

Client UI uses `<ProLockOverlay feature="..." />` which covers a `position: relative` parent and reads `supportWhatsapp` from `useAppConfig()`. Mounted in `DocumentsTab` and `ExerciseProgramModal`.

## Owner = Praticien automation

`/api/super-admin/cabinets/create` creates a `Praticien` row in the same transaction and sets `User.praticienId` so the owner appears in every "Praticien" dropdown out of the box. `PATCH/DELETE /api/praticiens/[id]` rejects self-disable/self-delete (403 `cannot_self_disable` / `cannot_self_delete`).

## Things that bite

- **Migration tooling in Prisma 7** : `--from-config-datasource --to-schema <path> --script` (the old `--from-schema-datasource` was removed). DO NOT use `prisma migrate dev` — it fails on this repo's drift; use the alternative workflow in AGENTS.md §1.
- **`unstable_cache` profile arg** : in Next 16, `revalidateTag(tag, profile)` takes 2 args; use `updateTag(tag)` for the old 1-arg behavior.
- **The 5pm-7pm Supabase windows can return `P1001`** (DB unreachable). Retry, don't panic.
- **Mobile users redirected to `/abonnement` (desktop)** from `(mobile)/layout.tsx` historically caused UA-detection loops; this layout now redirects to `/m/abonnement`.
- **RLS policies are NOT in `schema.prisma`** — Prisma doesn't manage them. The current state is `deny_all` (USING false, WITH CHECK false) on all 15 public tables (migration `20260609224245_rls_deny_all`). Prisma still works because the `postgres` role has `BYPASSRLS=true`. **Do NOT overwrite these policies** in future SQL migrations unless you explicitly want to add a per-cabinet policy; PostgREST + anon key would re-leak immediately. If you add a new table to the schema, append a `DROP POLICY IF EXISTS / CREATE POLICY deny_all` block for it in a new SQL migration — `prisma migrate` alone won't enable RLS or create the deny policy.

## Scripts and one-shots

Archived one-shot scripts under `scripts/*.archived.ts` (convention). Not run by Vercel, not in build. Examples:
- `scripts/cleanup-test-cabinets.archived.ts` — multi-cabinet purge with FK ordering and Storage cleanup.
- `scripts/backfill-owner-praticien.archived.ts` — backfilled missing `Praticien` for existing owners.

If you write a new one-shot, archive it (`mv foo.ts foo.archived.ts`) after the run.
