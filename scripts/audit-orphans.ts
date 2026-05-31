/**
 * scripts/audit-orphans.ts — READ-ONLY
 *
 * Compte les rows orphelines (cabinetId IS NULL) sur les 11 tables tenant.
 *
 * Historique :
 * - Utilisé avant l'étape A2 pour confirmer qu'il était sûr de passer
 *   cabinetId en NOT NULL (0 orphan constaté).
 * - Depuis A2, la nullabilité est interdite côté DB (CHECK NOT NULL) :
 *   les counts ne peuvent plus dépasser 0. Le script reste comme garde-fou
 *   diagnostic en cas de futur changement de schéma.
 *
 * Utilise du SQL brut pour rester robuste à l'évolution des types Prisma
 * (qui refusent maintenant `where: { cabinetId: null }` au niveau du client
 * typé, le champ n'étant plus nullable).
 *
 * Usage : npx tsx scripts/audit-orphans.ts
 * Aucune écriture en base. Pas de side-effect.
 */
import { config } from 'dotenv'

config({ path: '.env.development.local', override: true })
config({ path: '.env' })

const TENANT_TABLES = [
  'Patient', 'Praticien', 'Seance', 'Facture', 'Paiement',
  'Feedback', 'Document', 'WhatsAppLog', 'SeanceType',
  'RendezVous', 'ExerciceProgram',
] as const

async function main() {
  const { prisma } = await import('../src/lib/prisma')

  console.log('\n=== AUDIT ORPHANS (cabinetId IS NULL) ===\n')

  const results: { label: string; count: number; samples: string[] }[] = []

  for (const table of TENANT_TABLES) {
    const countRows = await prisma.$queryRawUnsafe<Array<{ count: number | bigint }>>(
      `SELECT COUNT(*)::int AS count FROM "${table}" WHERE "cabinetId" IS NULL`,
    )
    const count = Number(countRows[0]?.count ?? 0)
    let samples: string[] = []
    if (count > 0) {
      const sampleRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT "id" FROM "${table}" WHERE "cabinetId" IS NULL LIMIT 5`,
      )
      samples = sampleRows.map(r => r.id)
    }
    results.push({ label: table, count, samples })
  }

  const maxLabel = Math.max(...results.map(r => r.label.length))
  for (const r of results) {
    const pad = r.label.padEnd(maxLabel, ' ')
    console.log(`  ${pad} : ${r.count} orphan(s)`)
    if (r.samples.length > 0) {
      console.log(`  ${' '.repeat(maxLabel)}   sample ids: ${r.samples.join(', ')}`)
    }
  }

  const total = results.reduce((acc, r) => acc + r.count, 0)
  console.log(`\n  TOTAL : ${total} orphan(s) sur ${TENANT_TABLES.length} tables tenant.\n`)
  console.log(total === 0
    ? '  ✓ DB propre — contrainte NOT NULL respectée.'
    : '  ⚠ Anomalie : la contrainte NOT NULL devrait empêcher les orphans. Investiguer.')
  console.log('')

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('[audit-orphans] Échec :', e)
  process.exit(1)
})
