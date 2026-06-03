/**
 * Script jetable : crée un Praticien record pour tout CABINET_OWNER existant
 * dont `User.praticienId` est NULL, puis lie le User au Praticien créé.
 *
 * Run : npx tsx scripts/backfill-owner-praticien.ts
 *
 * - Idempotent : si tous les owners ont déjà un praticienId, le script ne
 *   crée rien et exit avec un récap.
 * - Transactionnel par owner : Praticien.create + User.update wrappés dans
 *   un $transaction. Une erreur n'affecte pas les owners déjà migrés.
 * - Couleur déterministe par owner.id (cohérent avec un éventuel re-run).
 */
import { prisma } from '@/lib/prisma'
import { deterministicPraticienColor } from '@/lib/colors'

async function main() {
  console.log('━━━ BACKFILL CABINET_OWNER → PRATICIEN ━━━\n')

  const owners = await prisma.user.findMany({
    where: { role: 'CABINET_OWNER', praticienId: null, cabinetId: { not: null } },
    select: { id: true, email: true, prenom: true, nom: true, cabinetId: true },
  })

  if (owners.length === 0) {
    console.log('Aucun CABINET_OWNER à migrer (tous ont déjà un praticienId).')
    process.exit(0)
  }

  console.log(`${owners.length} owner(s) à migrer :\n`)
  for (const o of owners) console.log(`  · ${o.email} → ${o.prenom} ${o.nom} (cabinetId=${o.cabinetId})`)
  console.log('')

  const results: { email: string; praticienId: string }[] = []
  for (const o of owners) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const prat = await tx.praticien.create({
          data: {
            cabinetId: o.cabinetId!,
            nom:       o.nom,
            prenom:    o.prenom,
            couleur:   deterministicPraticienColor(o.id),
            actif:     true,
          },
        })
        await tx.user.update({
          where: { id: o.id },
          data:  { praticienId: prat.id },
        })
        return prat
      })
      results.push({ email: o.email!, praticienId: created.id })
      console.log(`  ✓ ${o.email} → praticien=${created.id} (${created.couleur})`)
    } catch (e) {
      console.error(`  ✗ ${o.email} → ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  console.log(`\n━━━ Backfilled ${results.length}/${owners.length} owner(s) with Praticien records.`)

  // Vérif post-backfill
  const remaining = await prisma.user.count({
    where: { role: 'CABINET_OWNER', praticienId: null, cabinetId: { not: null } },
  })
  if (remaining === 0) {
    console.log('✓ Plus aucun owner sans Praticien record.')
    process.exit(0)
  } else {
    console.warn(`⚠ ${remaining} owner(s) restent sans praticienId — voir erreurs ci-dessus.`)
    process.exit(1)
  }
}

main().catch(e => {
  console.error('FATAL :', e instanceof Error ? e.message : e)
  process.exit(1)
})
