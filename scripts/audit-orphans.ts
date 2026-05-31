/**
 * scripts/audit-orphans.ts — READ-ONLY
 *
 * Compte les rows orphelines (cabinetId IS NULL) sur les 11 modèles tenant.
 * À exécuter avant l'étape A2 (passage de cabinetId en NOT NULL) pour décider
 * quoi faire des orphans existants (réassigner / supprimer / patcher au cas
 * par cas selon la nature).
 *
 * Usage : npx tsx scripts/audit-orphans.ts
 * Aucune écriture en base. Pas de side-effect.
 */
import { config } from 'dotenv'

config({ path: '.env.development.local', override: true })
config({ path: '.env' })

type Counter = {
  label: string
  count: () => Promise<number>
  sampleIds: () => Promise<string[]>
}

async function main() {
  const { prisma } = await import('../src/lib/prisma')

  const TENANTS: Counter[] = [
    {
      label: 'Patient',
      count: () => prisma.patient.count({ where: { cabinetId: null } }),
      sampleIds: () => prisma.patient.findMany({
        where: { cabinetId: null }, select: { id: true }, take: 5,
      }).then(r => r.map(x => x.id)),
    },
    {
      label: 'Praticien',
      count: () => prisma.praticien.count({ where: { cabinetId: null } }),
      sampleIds: () => prisma.praticien.findMany({
        where: { cabinetId: null }, select: { id: true }, take: 5,
      }).then(r => r.map(x => x.id)),
    },
    {
      label: 'Seance',
      count: () => prisma.seance.count({ where: { cabinetId: null } }),
      sampleIds: () => prisma.seance.findMany({
        where: { cabinetId: null }, select: { id: true }, take: 5,
      }).then(r => r.map(x => x.id)),
    },
    {
      label: 'Facture',
      count: () => prisma.facture.count({ where: { cabinetId: null } }),
      sampleIds: () => prisma.facture.findMany({
        where: { cabinetId: null }, select: { id: true }, take: 5,
      }).then(r => r.map(x => x.id)),
    },
    {
      label: 'Paiement',
      count: () => prisma.paiement.count({ where: { cabinetId: null } }),
      sampleIds: () => prisma.paiement.findMany({
        where: { cabinetId: null }, select: { id: true }, take: 5,
      }).then(r => r.map(x => x.id)),
    },
    {
      label: 'Feedback',
      count: () => prisma.feedback.count({ where: { cabinetId: null } }),
      sampleIds: () => prisma.feedback.findMany({
        where: { cabinetId: null }, select: { id: true }, take: 5,
      }).then(r => r.map(x => x.id)),
    },
    {
      label: 'Document',
      count: () => prisma.document.count({ where: { cabinetId: null } }),
      sampleIds: () => prisma.document.findMany({
        where: { cabinetId: null }, select: { id: true }, take: 5,
      }).then(r => r.map(x => x.id)),
    },
    {
      label: 'WhatsAppLog',
      count: () => prisma.whatsAppLog.count({ where: { cabinetId: null } }),
      sampleIds: () => prisma.whatsAppLog.findMany({
        where: { cabinetId: null }, select: { id: true }, take: 5,
      }).then(r => r.map(x => x.id)),
    },
    {
      label: 'SeanceType',
      count: () => prisma.seanceType.count({ where: { cabinetId: null } }),
      sampleIds: () => prisma.seanceType.findMany({
        where: { cabinetId: null }, select: { id: true }, take: 5,
      }).then(r => r.map(x => x.id)),
    },
    {
      label: 'RendezVous',
      count: () => prisma.rendezVous.count({ where: { cabinetId: null } }),
      sampleIds: () => prisma.rendezVous.findMany({
        where: { cabinetId: null }, select: { id: true }, take: 5,
      }).then(r => r.map(x => x.id)),
    },
    {
      label: 'ExerciceProgram',
      count: () => prisma.exerciceProgram.count({ where: { cabinetId: null } }),
      sampleIds: () => prisma.exerciceProgram.findMany({
        where: { cabinetId: null }, select: { id: true }, take: 5,
      }).then(r => r.map(x => x.id)),
    },
  ]

  console.log('\n=== AUDIT ORPHANS (cabinetId IS NULL) ===\n')

  const results: { label: string; count: number; samples: string[] }[] = []
  for (const t of TENANTS) {
    const n = await t.count()
    const samples = n > 0 ? await t.sampleIds() : []
    results.push({ label: t.label, count: n, samples })
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
  console.log(`\n  TOTAL : ${total} orphan(s) sur ${TENANTS.length} modèles tenant.\n`)
  console.log(total === 0
    ? '  ✓ DB propre — prête pour A2 (cabinetId NOT NULL).'
    : '  ⚠ Décider du sort des orphans avant A2 (réassigner / supprimer / patcher).')
  console.log('')

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('[audit-orphans] Échec :', e)
  process.exit(1)
})
