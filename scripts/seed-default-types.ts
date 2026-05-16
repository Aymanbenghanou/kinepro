/**
 * One-time migration: seed 10 default SeanceType records for every
 * cabinet that currently has 0 session types.
 *
 * Run: npx tsx scripts/seed-default-types.ts
 */
import 'dotenv/config'
import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

config({ path: '.env.development.local', override: true })
config({ path: '.env' })

const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

const DEFAULT_SEANCE_TYPES = [
  { nom: 'Rééducation fonctionnelle',   description: 'Rééducation générale et fonctionnelle',             dureeDefaut: 45, tarifDefaut: 300, couleur: '#2563EB' },
  { nom: 'Post-opératoire',             description: 'Suivi et rééducation post-chirurgie',                dureeDefaut: 60, tarifDefaut: 400, couleur: '#7C3AED' },
  { nom: 'Massage thérapeutique',       description: 'Massage à visée thérapeutique',                      dureeDefaut: 30, tarifDefaut: 250, couleur: '#0D9488' },
  { nom: 'Électrothérapie',             description: 'Traitement par courants électriques',                dureeDefaut: 30, tarifDefaut: 200, couleur: '#D97706' },
  { nom: 'Balnéothérapie',              description: "Thérapie par l'eau",                                 dureeDefaut: 45, tarifDefaut: 350, couleur: '#0EA5E9' },
  { nom: 'Mobilisation articulaire',    description: 'Techniques de mobilisation des articulations',       dureeDefaut: 45, tarifDefaut: 300, couleur: '#16A34A' },
  { nom: 'Renforcement musculaire',     description: 'Exercices de renforcement',                          dureeDefaut: 60, tarifDefaut: 300, couleur: '#DC2626' },
  { nom: 'Bilan initial',               description: 'Évaluation et bilan du patient',                     dureeDefaut: 60, tarifDefaut: 400, couleur: '#1E3A5F' },
  { nom: 'Kinésithérapie respiratoire', description: 'Rééducation respiratoire',                           dureeDefaut: 30, tarifDefaut: 250, couleur: '#9333EA' },
  { nom: 'Rééducation neurologique',    description: 'Rééducation des pathologies neurologiques',          dureeDefaut: 60, tarifDefaut: 450, couleur: '#C2410C' },
]

async function main() {
  const cabinets = await prisma.cabinet.findMany({ select: { id: true, nom: true } })
  console.log(`Found ${cabinets.length} cabinet(s).`)

  let seeded = 0
  let skipped = 0

  for (const cabinet of cabinets) {
    const count = await prisma.seanceType.count({ where: { cabinetId: cabinet.id } })
    if (count === 0) {
      await prisma.seanceType.createMany({
        data: DEFAULT_SEANCE_TYPES.map(t => ({
          ...t,
          cabinetId: cabinet.id,
          isDefault: true,
          actif: true,
        })),
      })
      console.log(`  ✓ Seeded 10 types for: ${cabinet.nom} (${cabinet.id})`)
      seeded++
    } else {
      console.log(`  — Skipped: ${cabinet.nom} (already has ${count} types)`)
      skipped++
    }
  }

  console.log(`\nDone. Seeded: ${seeded} cabinet(s), skipped: ${skipped}.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
