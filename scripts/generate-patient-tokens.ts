import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { randomBytes } from 'crypto'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from project root
config({ path: resolve(__dirname, '../.env') })
config({ path: resolve(__dirname, '../.env.local'), override: true })

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: { rejectUnauthorized: false },
  })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter } as any)

  try {
    const patients = await prisma.patient.findMany({
      where: { publicToken: null },
      select: { id: true, prenom: true, nom: true },
    })

    console.log(`Found ${patients.length} patients without a publicToken.`)
    if (patients.length === 0) {
      console.log('Nothing to do — all patients already have tokens. ✅')
      return
    }

    let done = 0
    for (const patient of patients) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: { publicToken: randomBytes(16).toString('hex') },
      })
      done++
      process.stdout.write(`\r  ${done}/${patients.length} — ${patient.prenom} ${patient.nom}          `)
    }

    console.log(`\nDone! Generated tokens for ${done} patients. ✅`)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
