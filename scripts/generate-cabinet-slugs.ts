/**
 * One-time script: generate slugs for all existing cabinets that don't have one.
 * "Cabinet Amrani - Tanger" → "cabinet-amrani-tanger"
 *
 * Run: npx tsx scripts/generate-cabinet-slugs.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env') })
config({ path: resolve(__dirname, '../.env.local'), override: true })

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: { rejectUnauthorized: false },
  })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter } as any)

  try {
    const cabinets = await prisma.cabinet.findMany({
      where: { slug: null },
      select: { id: true, nom: true },
    })

    console.log(`Found ${cabinets.length} cabinets without a slug.`)
    if (cabinets.length === 0) { console.log('All cabinets already have slugs. ✅'); return }

    // Collect existing slugs to detect collisions
    const existingSlugs = new Set(
      (await prisma.cabinet.findMany({ where: { slug: { not: null } }, select: { slug: true } }))
        .map(c => c.slug!)
    )

    let done = 0
    for (const cab of cabinets) {
      let base  = slugify(cab.nom) || 'cabinet'
      let slug  = base
      let tries = 0
      while (existingSlugs.has(slug)) {
        tries++
        slug = `${base}-${tries}`
      }
      existingSlugs.add(slug)

      await prisma.cabinet.update({ where: { id: cab.id }, data: { slug } })
      done++
      console.log(`  ${done}/${cabinets.length}  ${cab.nom}  →  ${slug}`)
    }

    console.log(`\nDone! Generated slugs for ${done} cabinets. ✅`)
    console.log('\nNOTE: bookingEnabled is still false for all cabinets.')
    console.log('Each owner must enable it in Paramètres → Réservation en ligne.')
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
