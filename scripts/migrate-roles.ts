/**
 * Migration de la data existante vers le nouveau système de rôles.
 * Exécuté SUR PROD à chaque build Vercel (étape buildCommand). Idempotent :
 * - Users déjà en PRATICIEN / SECRETAIRE / SUPER_ADMIN → skip.
 * - CABINET_OWNER → laissé tel quel (permissions ignorées par hasPermission).
 * - EMPLOYEE avec Praticien spécialité "Secrétaire"/"Secretaire" →
 *   role=SECRETAIRE, permissions=PRESETS.SECRETAIRE, Praticien supprimé
 *   (fallback : actif=false si FK bloquent).
 * - EMPLOYEE avec autre Praticien → role=PRATICIEN, permissions=PRESETS.PRATICIEN.
 * - EMPLOYEE sans Praticien → DELETE (avec nettoyage pushSubscriptions).
 */
import { config } from 'dotenv'
import { PRESETS } from '../src/lib/permissions'

config({ path: '.env.development.local', override: true })
config({ path: '.env' })

async function main() {
  const { prisma } = await import('../src/lib/prisma')

  let toPraticien = 0
  let toSecretaire = 0
  let deletedUsers = 0
  let ownerSkipped = 0
  let alreadyMigrated = 0
  let prDeleted = 0
  let prSoftDisabled = 0

  const users = await prisma.user.findMany({
    select: {
      id: true,
      role: true,
      praticienId: true,
      praticien: { select: { id: true, specialite: true } },
    },
  })

  for (const u of users) {
    const role = u.role
    if (role === 'SUPER_ADMIN' || role === 'PRATICIEN' || role === 'SECRETAIRE') {
      alreadyMigrated++
      continue
    }
    if (role === 'CABINET_OWNER') {
      ownerSkipped++
      continue
    }
    if (role !== 'EMPLOYEE') continue

    if (u.praticien) {
      const spec = (u.praticien.specialite ?? '').trim().toLowerCase()
      if (spec === 'secrétaire' || spec === 'secretaire') {
        const pratId = u.praticien.id
        // Bascule le user en SECRETAIRE + détache puis tente de supprimer le praticien.
        await prisma.user.update({
          where: { id: u.id },
          data: { role: 'SECRETAIRE', permissions: PRESETS.SECRETAIRE, praticienId: null },
        })
        try {
          await prisma.praticien.delete({ where: { id: pratId } })
          prDeleted++
        } catch (e) {
          // FK bloquent (RDV/séances existantes) → on désactive plutôt que d'échouer le build.
          await prisma.praticien.update({ where: { id: pratId }, data: { actif: false } })
          prSoftDisabled++
          console.warn(`[migrate-roles] Praticien ${pratId} non supprimable (FK), désactivé.`)
        }
        toSecretaire++
      } else {
        await prisma.user.update({
          where: { id: u.id },
          data: { role: 'PRATICIEN', permissions: PRESETS.PRATICIEN },
        })
        toPraticien++
      }
    } else {
      // EMPLOYEE sans Praticien → nettoyage + suppression user.
      await prisma.pushSubscription.deleteMany({ where: { userId: u.id } })
      await prisma.user.delete({ where: { id: u.id } })
      deletedUsers++
    }
  }

  console.log('[migrate-roles] récap :', {
    toPraticien,
    toSecretaire,
    deletedUsers,
    ownerSkipped,
    alreadyMigrated,
    praticiensDeleted: prDeleted,
    praticiensSoftDisabled: prSoftDisabled,
  })

  await prisma.$disconnect()
}

main().catch(e => {
  console.error('[migrate-roles] FATAL', e instanceof Error ? e.message : e)
  process.exit(1)
})
