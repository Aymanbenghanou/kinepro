# KinéPro — Handoff (reprise de projet)

> À coller au début d'une nouvelle conversation Claude pour reprendre le projet sans contexte perdu. Tout ce qui suit est tiré du code réel et de la conversation précédente. Quand une info manque : « à confirmer ».

---

## 1. Projet & stack

- **Produit** : KinéPro — PMS SaaS pour kinés / cabinets de kinésithérapie au Maroc (MAD, fr-FR, mode kiné).
- **Stack** :
  - Next.js 14 (App Router, Turbopack — `AGENTS.md` précise « this is NOT the Next.js you know »)
  - Prisma 7.8.0 + PostgreSQL via Supabase (pooler port 6543, PgBouncer)
  - NextAuth (JWT) — `session.user` contient `cabinetId`, `prenom`, `nom`, `role`
  - Tailwind v4 (`@import "tailwindcss"`) côté desktop ; **mobile utilise des styles inline**
  - recharts 3.8.1 (desktop uniquement)
  - Cloudinary (upload non signé, preset `kinepro_docs`)
- **Déploiement** : Vercel — `kinepro-omega.vercel.app`
- **Architecture routes** :
  - `src/app/(dashboard)/...` → desktop, intouché par la refonte mobile
  - `src/app/(mobile)/m/...` → app mobile dédiée, route group séparé
  - `src/middleware.ts` redirige en fonction du User-Agent (mobile UA → `/m/*`, desktop sur `/m/*` → strip prefix). Super-admins exemptés.

---

## 2. Décisions produit verrouillées

1. **Mobile READ-ONLY**, **une seule exception** : upload de documents dans le dossier patient (`POST /api/patients/[id]/documents`). Voir commit `338738c` — 10 déclencheurs de mutation supprimés (FAB Nouveau patient, FAB Nouveau RDV, boutons Planifier/Exercices, actions Feedback/Programme, bouton Payer, bloc save-score, quick-actions dashboard, lien WhatsApp footer…).
2. **Aucune donnée mockée** dans un PMS médical. Quand une source manque, afficher `—` ou cacher la section. Règle absolue rappelée par l'utilisateur sur l'onglet Progrès.
3. **Desktop intouché** par toute évolution mobile. Pas de Tailwind classes mobile-first qui contaminent le desktop.
4. **Mobile = inline styles**, pas Tailwind. Cohérent dans tous les fichiers `(mobile)/`.
5. **Pas de `prisma migrate dev`** sur ce projet : la prod a drifté de l'historique. Utiliser `prisma db push --accept-data-loss`. Migrations SQL appliquées via `prisma db execute --file=...` puis `prisma migrate resolve --applied "<name>"`.
6. **Arabe RTL définitivement reverté** au commit `1226460` (revert dans `1a6a1cb`). La colonne `User.preferredLang` est conservée en base mais inutilisée (pour éviter perte de données au prochain `db push`).
7. **Plus de quick-actions grid** sur le dashboard mobile : la bottom-nav (Accueil/Agenda/Patients/Facturation/Plus) couvre déjà tout.

---

## 3. État d'avancement

### Terminé
- Route group `(mobile)` séparé (`86b3ff6`) avec layout, topbar, bottom-nav.
- `MobileBottomNav` : 5 tabs + sheet « Plus » (Séances, WhatsApp, Rapports, Personnel, Paramètres, Mon compte, Déconnexion). Sheet morph X-icon, lock scroll, Escape ferme.
- `/m/dashboard` : greeting, 2×2 stats (RDV jour, Patients actifs, Revenus mois, Reste à encaisser), agenda du jour (5 max), patients récents (5 max).
- `/m/patients` : recherche sticky 16px (anti-zoom iOS) + chips de filtre + cartes avatars 6 couleurs hash.
- `/m/patients/[id]` : 6 onglets (Infos, Séances, Factures, Progrès, Docs, QR) tous fonctionnels.
- `/m/agenda`, `/m/seances`, `/m/facturation`, `/m/whatsapp` : lecture seule.
- Mobile read-only enforced (`338738c`).
- Onglet Progrès :
  - 4 KPI 2×2 (Douleur initiale→actuelle, Progression % + X/Y séances, Mobilité + Δ pts, Satisfaction moy feedbacks)
  - Graphique « Évolution douleur » en barres CSS pures (`de82127`) — remplacement de recharts qui rendait vide (ResizeObserver à 0px au mount client)
  - Section Objectifs toujours visible avec empty-state + hint « À ajouter depuis le dossier patient (ordinateur) » (`942197d`)
- `GET /api/patients/[id]` étend l'include avec `feedbacks` pour la KPI Satisfaction (`81c8609`).
- `NewPatientWizard.tsx` : placeholder + caption sur la textarea Objectifs expliquant la convention `✓ / → / ○` (`942197d`).

### Reste
- **Pas de `/m/rapports`** : le sheet Plus deep-link vers desktop. À confirmer si c'est l'état final voulu.
- **Pas de formulaire desktop pour éditer `objectifsTraitement` d'un patient existant**. Aujourd'hui seul `NewPatientWizard` permet de le renseigner (à la création). `PUT /api/patients/[id]` accepte déjà le champ — il manque juste l'UI. **Approbation utilisateur non donnée**, ticket parqué.
- **Pas de modèle structuré `Objectif`** : on parse du texte libre (ligne par ligne, préfixe = statut).
- **Pas de série Mobilité historique** séparée — uniquement `Seance.mobiliteScore` par séance.

---

## 4. Conventions de code à respecter

- **Server components mobile** (`/m/dashboard`, `/m/patients`, `/m/agenda`, `/m/seances`, `/m/facturation`, `/m/whatsapp`) :
  - `const session = await auth()` puis `if (!session?.user?.cabinetId) redirect('/login')`
  - Requêtes Prisma directes, pas de `fetch` interne.
- **Client components mobile** (`/m/patients/[id]/page.tsx`) :
  - `'use client'`
  - `fetch('/api/patients/${id}')` puis `useState` + `useMemo` pour dériver KPI.
- **Inline styles partout** côté mobile. Pas de classes Tailwind dans `(mobile)/`.
- **Anti-overflow numérique** : tout chiffre ou prix doit avoir `whiteSpace: 'nowrap'`, `overflow: 'hidden'`, `textOverflow: 'ellipsis'`. Espaces dans les montants → ` ` (non-breaking).
- **Grilles 2 colonnes** : `gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'` — le `minmax(0, 1fr)` est obligatoire pour autoriser l'ellipsis.
- **Polices ≥ 16px** sur les inputs (sinon iOS zoome).
- **Pas de recharts sur mobile**. Pour les graphes simples : barres CSS flex + hauteur en %.
- **Helpers monétaires** : `formatMoney` et `formatTime` depuis `@/lib/utils`.
- **Commit messages** : courts, en français, préfixés (`feat(mobile):`, `fix(mobile):`, `refactor:`…).

---

## 5. Schéma de données pertinent

Extraits utiles (`prisma/schema.prisma`) — confirmés présents :

- `Patient` : `id, nom, prenom, dateNaissance?, sexe?, telephone?, email?, adresse?, ville?, cin?, pathologie?, antecedents?, allergies?, medicaments?, medecinReferent?, medecinTelephone?, mutuelle?, numeroPolice?, tarifSeance Float?, modePaiement?, nbSeancesPrescrites Int?, frequence?, praticienAssigneId?, objectifsTraitement String?, actif Boolean, cabinetId, createdAt`
- `Seance` : `id, date, typeSeance, statut, douleurScore Int?, mobiliteScore Int?, forceScore Int?, scorePatient Int?, feedbackStatus String?, feedbackToken String? @unique, feedbackReadyAt DateTime?, patientId, praticienId, cabinetId`
- `Feedback` : `id, score Int, commentaire String?, typeMessage String @default("post_seance"), patientId, seanceId String?, createdAt`
- `Facture` : `id, montant Float, montantPaye Float @default(0), statut String, dateEmise, …`
- `Paiement`, `BankAccount`, `ExerciceProgram`, `Document`, `Cabinet`, `Praticien`, `CabinetSite`, `Testimonial`, `Subscription` — présents.
- `User.preferredLang String @default("fr")` — **conservé mais inutilisé** (vestige Arabe).

Convention de parsing des objectifs (texte libre `Patient.objectifsTraitement`, une ligne = un objectif) :
- préfixe `✓` ou `[x]` → done
- préfixe `→` ou `[~]` → in progress
- sinon → todo

---

## 6. Travail en cours détaillé

Derniers commits significatifs (ordre antichronologique, à confirmer via `git log`) :
- `942197d` — fix(mobile): onglet Progrès, section Objectifs toujours affichée + hint convention préfixes desktop
- `de82127` — fix(mobile): Évolution douleur, barres CSS pures (remplacement recharts vide)
- `81c8609` — feat(api): `feedbacks` ajouté à l'include de `GET /api/patients/[id]`
- `338738c` — refactor(mobile): read-only enforced, suppression de 10 triggers de mutation
- `86b3ff6` — feat(mobile): route group séparé `(mobile)/m/*`
- `1a6a1cb` — revert : retour à `1226460` (Arabe RTL annulé)

**Ticket parqué (pas démarré)** : formulaire desktop d'édition d'`objectifsTraitement` pour patients existants. L'API `PUT /api/patients/[id]` accepte déjà le champ (ligne 91 de `src/app/api/patients/[id]/route.ts`). À faire dans `src/app/(dashboard)/patients/[id]/...` — emplacement exact **à confirmer**.

---

## 7. Snippets de référence essentiels

### Middleware (détection UA + redirections)
```ts
// src/middleware.ts (extrait)
const { device } = userAgent(req)
const isMobile = device.type === 'mobile'
// mobile sur route desktop → /m/*  |  desktop sur /m/* → strip prefix
// super-admin exempté
```

### Layout mobile
```tsx
// src/app/(mobile)/layout.tsx
const session = await auth()
if (!session?.user?.cabinetId) redirect('/login')
return (
  <div style={{ overflowX: 'hidden', paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}>
    {children}
    <MobileBottomNav />
  </div>
)
```

### Pattern onglet client `/m/patients/[id]`
```tsx
'use client'
const TABS = ['Infos', 'Séances', 'Factures', 'Progrès', 'Docs', 'QR'] as const
const [activeTab, setActiveTab] = useState<TabId>('Infos')
const fetchPatient = useCallback(async () => {
  const r = await fetch(`/api/patients/${id}`)
  const d = await r.json()
  if (!d.error) setPatient(d)
}, [id])
```

### Progression % (copie byte-for-byte du desktop `ProgressionTab.tsx:130`)
```ts
const initialDouleur = douleurArr[0] ?? null
const lastDouleur = douleurArr[douleurArr.length - 1] ?? null
const progressPct = initialDouleur != null && lastDouleur != null && initialDouleur > 0
  ? Math.max(0, Math.round(((initialDouleur - lastDouleur) / initialDouleur) * 100))
  : null
```

### Barres CSS pures (remplacement recharts mobile)
```tsx
<div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110, borderBottom: '0.5px solid #F1F5F9' }}>
  {douleurChart.map((entry, i) => {
    const heightPct = Math.max(8, (entry.douleur / 10) * 100)
    const color = entry.douleur >= 7 ? '#EF4444' : entry.douleur >= 4 ? '#F59E0B' : '#22C55E'
    return (
      <div key={i} title={`${entry.label} : ${entry.douleur}/10`}
        style={{ flex: 1, height: `${heightPct}%`, background: color, borderRadius: '4px 4px 0 0' }} />
    )
  })}
</div>
```

### Parsing objectifs
```ts
function parseObjectif(line: string): { label: string; status: 'done' | 'wip' | 'todo' } {
  const t = line.trim()
  if (/^(✓|\[x\])/i.test(t)) return { label: t.replace(/^(✓|\[x\])\s*/i, ''), status: 'done' }
  if (/^(→|\[~\])/.test(t))   return { label: t.replace(/^(→|\[~\])\s*/, ''),  status: 'wip'  }
  return { label: t.replace(/^(○|\[ \])\s*/, ''), status: 'todo' }
}
```

### Anti line-break sur prix
```tsx
<span style={{ whiteSpace: 'nowrap', fontSize: 'clamp(24px, 7vw, 32px)' }}>
  {price.replace(/ /g, ' ')}
</span>
```

---

**Règle d'or pour la suite** : desktop intouché, mobile read-only sauf upload doc, pas de mock, `prisma db push` only.
