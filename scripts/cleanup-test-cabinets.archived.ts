/**
 * Script jetable : suppression des 3 cabinets de test pour ne garder que
 * Cabinet Amrani + le super-admin admin@kinepro.ma.
 *
 * Run : npx tsx scripts/cleanup-test-cabinets.ts
 *
 * - Audit avant/après (counts par modèle pour chaque cabinet ciblé).
 * - Garde-fous : abort si Amrani figure dans la liste ou si une cible a > 10
 *   patients (signe qu'on s'attaque au mauvais cabinet).
 * - Suppression DB topologique manuelle (pas d'onDelete:Cascade configuré sur
 *   Cabinet → enfants).
 * - Cleanup best-effort des fichiers orphelins du bucket "patient-documents".
 * - Idempotent : si une cible est déjà absente, le script l'indique et continue.
 */
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { STORAGE_BUCKET } from '@/lib/storage'

const TARGET_EMAILS = [
  'ayman@kine.com',
  'aymanbenghanoupro@gmail.com',
  'aymanbenghanoupro@gmail.con',  // typo réelle en DB pour le même cabinet "Ayman" (Casablanca)
  'benali@test.com',
] as const

const AMRANI_EMAIL = 'amrani@test.com'
const SUPER_ADMIN_EMAIL = 'admin@kinepro.ma'

interface CabinetSnapshot {
  email: string
  ownerName?: string
  cabinetId?: string
  cabinetNom?: string
  ville?: string | null
  users?: number
  patients?: number
  praticiens?: number
  rendezVous?: number
  seances?: number
  factures?: number
  paiements?: number
  seanceTypes?: number
  documents?: number
  documentUrls?: string[]
  whatsappLogs?: number
  feedbacks?: number
  exerciseProgrammes?: number
  status?: 'found' | 'already_absent' | 'aborted'
}

async function audit(email: string): Promise<CabinetSnapshot> {
  const owner = await prisma.user.findUnique({
    where: { email },
    select: { id: true, cabinetId: true, nom: true, prenom: true },
  })
  if (!owner?.cabinetId) return { email, status: 'already_absent' }

  const cabinetId = owner.cabinetId
  const cab = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { id: true, nom: true, ville: true },
  })
  if (!cab) return { email, status: 'already_absent' }

  const [
    users, patients, praticiens, rendezVous, seances, factures,
    paiements, seanceTypes, whatsappLogs, feedbacks, programs, docs,
  ] = await Promise.all([
    prisma.user.count({ where: { cabinetId } }),
    prisma.patient.count({ where: { cabinetId } }),
    prisma.praticien.count({ where: { cabinetId } }),
    prisma.rendezVous.count({ where: { cabinetId } }),
    prisma.seance.count({ where: { cabinetId } }),
    prisma.facture.count({ where: { cabinetId } }),
    prisma.paiement.count({ where: { facture: { cabinetId } } }),
    prisma.seanceType.count({ where: { cabinetId } }),
    prisma.whatsAppLog.count({ where: { cabinetId } }),
    prisma.feedback.count({ where: { patient: { cabinetId } } }),
    prisma.exerciceProgram.count({ where: { patient: { cabinetId } } }),
    prisma.document.findMany({
      where: { cabinetId },
      select: { id: true, url: true },
    }),
  ])

  return {
    email,
    ownerName: `${owner.prenom} ${owner.nom}`,
    cabinetId,
    cabinetNom: cab.nom,
    ville: cab.ville,
    users, patients, praticiens, rendezVous, seances, factures, paiements,
    seanceTypes, whatsappLogs, feedbacks, exerciseProgrammes: programs,
    documents: docs.length,
    documentUrls: docs.map(d => d.url),
    status: 'found',
  }
}

/**
 * Suppression topologique manuelle de tous les enfants d'un cabinet, puis du
 * cabinet lui-même. Ordre : feuilles → racine.
 */
async function deleteCabinetCascade(cabinetId: string) {
  // 1. Casser la FK circulaire Cabinet.ownerId → User
  await prisma.cabinet.update({ where: { id: cabinetId }, data: { ownerId: null } })

  // 2. Paiement (FK → Facture)
  const paiements = await prisma.paiement.deleteMany({
    where: { facture: { cabinetId } },
  })

  // 3. Document (FK → Patient + Cabinet)
  const documents = await prisma.document.deleteMany({ where: { cabinetId } })

  // 4. Feedback (FK → Patient + éventuellement Seance)
  const feedbacks = await prisma.feedback.deleteMany({
    where: { patient: { cabinetId } },
  })

  // 5. ExerciceProgram (FK → Patient)
  const programs = await prisma.exerciceProgram.deleteMany({
    where: { patient: { cabinetId } },
  })

  // 6. Seance (FK → Patient, Praticien, Cabinet, RendezVous?)
  const seances = await prisma.seance.deleteMany({ where: { cabinetId } })

  // 7. RendezVous (FK → Patient, Praticien, Cabinet, SeanceType)
  const rdv = await prisma.rendezVous.deleteMany({ where: { cabinetId } })

  // 8. Facture (FK → Patient, Cabinet)
  const factures = await prisma.facture.deleteMany({ where: { cabinetId } })

  // 9. WhatsAppLog (FK → Cabinet, Patient?)
  const whatsapp = await prisma.whatsAppLog.deleteMany({ where: { cabinetId } })

  // 10. Patient (FK → Cabinet)
  const patients = await prisma.patient.deleteMany({ where: { cabinetId } })

  // 11. Praticien (FK → Cabinet, User?)
  const praticiens = await prisma.praticien.deleteMany({ where: { cabinetId } })

  // 12. SeanceType (FK → Cabinet)
  const seanceTypes = await prisma.seanceType.deleteMany({ where: { cabinetId } })

  // 13. PushSubscription des users du cabinet (FK → User)
  const users = await prisma.user.findMany({ where: { cabinetId }, select: { id: true } })
  const pushes = await prisma.pushSubscription.deleteMany({
    where: { userId: { in: users.map(u => u.id) } },
  })

  // 14. User (FK → Cabinet)
  const usersDel = await prisma.user.deleteMany({ where: { cabinetId } })

  // 15. Cabinet
  await prisma.cabinet.delete({ where: { id: cabinetId } })

  return {
    paiements: paiements.count,
    documents: documents.count,
    feedbacks: feedbacks.count,
    programs: programs.count,
    seances: seances.count,
    rendezVous: rdv.count,
    factures: factures.count,
    whatsappLogs: whatsapp.count,
    patients: patients.count,
    praticiens: praticiens.count,
    seanceTypes: seanceTypes.count,
    pushSubscriptions: pushes.count,
    users: usersDel.count,
  }
}

async function deleteStorageFiles(urls: string[]): Promise<{ deleted: string[]; errors: { path: string; error: string }[] }> {
  const deleted: string[] = []
  const errors: { path: string; error: string }[] = []
  if (urls.length === 0) return { deleted, errors }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { deleted, errors: urls.map(p => ({ path: p, error: 'Supabase env vars manquantes' })) }
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Les `url` stockées en DB peuvent être soit un path relatif au bucket, soit
  // une URL signée complète. On extrait la partie après `<bucket>/`.
  const paths = urls.map(u => {
    const idx = u.indexOf(`${STORAGE_BUCKET}/`)
    return idx >= 0 ? u.slice(idx + STORAGE_BUCKET.length + 1).split('?')[0] : u
  })

  // L'API Supabase Storage `remove([paths])` gère le bulk delete en un appel.
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths)
  if (error) {
    errors.push({ path: paths.join(', '), error: error.message })
  } else {
    for (const f of data ?? []) deleted.push(f.name)
  }
  return { deleted, errors }
}

async function main() {
  console.log('━━━ CLEANUP TEST CABINETS ━━━\n')

  // Garde-fou #1 : Amrani ne doit JAMAIS être dans la liste cible.
  if ((TARGET_EMAILS as readonly string[]).includes(AMRANI_EMAIL)) {
    console.error('ABORT — Amrani figure dans la liste cible.')
    process.exit(1)
  }

  // Pré-état : total cabinets + super-admin présent
  const totalBefore = await prisma.cabinet.count()
  const superAdmin = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
    select: { id: true, role: true, cabinetId: true },
  })
  console.log(`Pré-état : ${totalBefore} cabinet(s), super-admin ${superAdmin ? 'présent' : 'ABSENT'}\n`)

  // ── ÉTAPE 1 : Audit ─────────────────────────────────────────────────────
  console.log('━━━ AUDIT ─────────────────────────────────────────────────\n')
  const snapshots: CabinetSnapshot[] = []
  for (const email of TARGET_EMAILS) {
    const s = await audit(email)
    snapshots.push(s)
    if (s.status === 'already_absent') {
      console.log(`  · ${email} → déjà absent (idempotent ✓)\n`)
      continue
    }
    console.log(`  · ${email} → ${s.cabinetNom} (${s.ville ?? '—'}) [${s.cabinetId}]`)
    console.log(`      owner=${s.ownerName}, users=${s.users}, patients=${s.patients}, ` +
                `praticiens=${s.praticiens}, rdv=${s.rendezVous}, seances=${s.seances}, ` +
                `factures=${s.factures}, paiements=${s.paiements}, types=${s.seanceTypes}, ` +
                `docs=${s.documents}, wa=${s.whatsappLogs}, feedbacks=${s.feedbacks}, ` +
                `programmes=${s.exerciseProgrammes}`)
    if (s.documentUrls && s.documentUrls.length > 0) {
      console.log(`      doc paths : ${s.documentUrls.join(', ')}`)
    }
    console.log('')
  }

  // Garde-fou #2 : aucune cible ne doit ressembler à Amrani (> 10 patients ou
  // email amrani).
  for (const s of snapshots) {
    if (s.status !== 'found') continue
    if (s.email === AMRANI_EMAIL || (s.patients ?? 0) > 10) {
      console.error(`\nABORT — ${s.email} ressemble au cabinet Amrani (patients=${s.patients}). NE PAS SUPPRIMER.`)
      process.exit(1)
    }
  }

  const toDelete = snapshots.filter(s => s.status === 'found')
  if (toDelete.length === 0) {
    console.log('Rien à supprimer (tous les cabinets cibles déjà absents).')
    process.exit(0)
  }

  // ── ÉTAPE 2 : Suppression DB ────────────────────────────────────────────
  console.log('━━━ SUPPRESSION DB ────────────────────────────────────────\n')
  const allDocUrls: string[] = []
  for (const s of toDelete) {
    console.log(`  → ${s.email} (${s.cabinetNom})…`)
    try {
      const c = await deleteCabinetCascade(s.cabinetId!)
      console.log(`     OK : paiements=${c.paiements}, documents=${c.documents}, ` +
                  `feedbacks=${c.feedbacks}, programs=${c.programs}, seances=${c.seances}, ` +
                  `rdv=${c.rendezVous}, factures=${c.factures}, wa=${c.whatsappLogs}, ` +
                  `patients=${c.patients}, praticiens=${c.praticiens}, types=${c.seanceTypes}, ` +
                  `push=${c.pushSubscriptions}, users=${c.users}, cabinet=1\n`)
      allDocUrls.push(...(s.documentUrls ?? []))
    } catch (e) {
      console.error(`     ERREUR : ${e instanceof Error ? e.message : String(e)}`)
      throw e
    }
  }

  // ── ÉTAPE 3 : Cleanup Supabase Storage ──────────────────────────────────
  console.log('━━━ CLEANUP STORAGE (best-effort) ─────────────────────────\n')
  if (allDocUrls.length === 0) {
    console.log('  Aucun document à nettoyer.\n')
  } else {
    console.log(`  Suppression bulk de ${allDocUrls.length} fichier(s) du bucket "${STORAGE_BUCKET}"…`)
    const { deleted, errors } = await deleteStorageFiles(allDocUrls)
    console.log(`  Supprimés : ${deleted.length}`)
    for (const d of deleted) console.log(`    ✓ ${d}`)
    if (errors.length > 0) {
      console.log(`  Erreurs (non bloquantes) : ${errors.length}`)
      for (const e of errors) console.log(`    ✗ ${e.path} → ${e.error}`)
    }
    console.log('')
  }

  // ── ÉTAPE 4 : Vérif post-suppression ────────────────────────────────────
  console.log('━━━ POST-ÉTAT ─────────────────────────────────────────────\n')
  const totalAfter = await prisma.cabinet.count()
  const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } })
  const allCabinets = await prisma.cabinet.findMany({
    select: { id: true, nom: true, owner: { select: { email: true } } },
  })
  console.log(`  cabinets restants : ${totalAfter}`)
  for (const c of allCabinets) {
    console.log(`    · ${c.nom} (owner=${c.owner?.email ?? '—'})`)
  }
  console.log(`  super-admins : ${superAdminCount}`)
  console.log('')

  const ok = totalAfter === 1 && superAdminCount === 1
  console.log(ok ? '✓ Cleanup réussi (1 cabinet + 1 super-admin attendus).' : '⚠ Post-état inattendu.')
  process.exit(ok ? 0 : 1)
}

main().catch(e => {
  console.error('\nFATAL :', e instanceof Error ? e.message : e)
  process.exit(1)
})
