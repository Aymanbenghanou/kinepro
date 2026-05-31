/**
 * scripts/audit-enum-values.ts — READ-ONLY
 *
 * SELECT DISTINCT + count(*) sur les champs candidats à être convertis
 * en enums Prisma. À lancer AVANT toute migration `String → enum` pour
 * vérifier qu'aucune valeur DB orpheline n'invaliderait l'ALTER TYPE.
 *
 * Usage : npx tsx scripts/audit-enum-values.ts
 * Aucune écriture. Aucun side-effect.
 */
import { config } from 'dotenv'

config({ path: '.env.development.local', override: true })
config({ path: '.env' })

type Target = { table: string; column: string }

const TARGETS: Target[] = [
  { table: 'User',              column: 'role' },
  { table: 'RendezVous',        column: 'statut' },
  { table: 'Seance',            column: 'statut' },
  { table: 'Facture',           column: 'statut' },
  { table: 'Paiement',          column: 'modePaiement' },
  { table: 'Cabinet',           column: 'plan' },
  { table: 'Cabinet',           column: 'planStatus' },
  { table: 'Cabinet',           column: 'billingCycle' },
  { table: 'DemandeAbonnement', column: 'statut' },
]

async function main() {
  const { prisma } = await import('../src/lib/prisma')

  console.log('\n=== AUDIT ENUM VALUES (DISTINCT + count) ===\n')

  for (const t of TARGETS) {
    const rows = await prisma.$queryRawUnsafe<Array<{ value: string | null; count: number }>>(
      `SELECT "${t.column}" AS value, COUNT(*)::int AS count
         FROM "${t.table}"
         GROUP BY "${t.column}"
         ORDER BY count DESC, value ASC NULLS LAST`,
    )

    const label = `${t.table}.${t.column}`.padEnd(28, ' ')
    if (rows.length === 0) {
      console.log(`  ${label} : (table vide)`)
      continue
    }
    const parts = rows.map(r => {
      const v = r.value === null ? 'NULL' : `'${r.value}'`
      return `${v} (${Number(r.count)})`
    })
    console.log(`  ${label} : [${parts.join(', ')}]`)
  }

  console.log('')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('[audit-enum-values] Échec :', e)
  process.exit(1)
})
