import 'server-only'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

/**
 * Helper de durcissement tenant pour les routes `/api/<resource>/[id]`.
 *
 * Encapsule le triptyque répété 30+ fois dans le code :
 *   1. lire la session NextAuth, refuser 401 si pas de cabinetId,
 *   2. faire `findFirst({ where: { id, cabinetId, ...extraWhere } })`
 *      avec le select/include passé par l'appelant,
 *   3. retourner 404 si la ressource n'appartient pas au cabinet.
 *
 * Aucune régression possible : sortie strictement équivalente au pattern
 * manuel (même findFirst, mêmes codes 401/404, mêmes payloads d'erreur).
 *
 * Usage typique dans un handler :
 *
 *   const seance = await getOwnedOr404(prisma.seance, id, {
 *     include: { patient: { select: { id: true, nom: true } } },
 *     notFoundMessage: 'Séance non trouvée',
 *   })
 *   if (seance instanceof NextResponse) return seance
 *   // ici, `seance` est la ressource du cabinet courant.
 *
 * Pourquoi `instanceof NextResponse` plutôt qu'une union { ok, value } /
 * { error } : reste cohérent avec le pattern existant des autres guards
 * du projet (`requirePermission`, `assertNotWalled`, `assertOwner`) qui
 * renvoient tous une `NextResponse` directement court-circuitable.
 *
 * À utiliser PAR DÉFAUT pour toute nouvelle route `/api/<x>/[id]`. Les
 * routes historiques (seances/[id], patients/[id], facturation/[id],
 * rendez-vous/[id], etc.) gardent leur implémentation manuelle qui est
 * déjà sûre — elles seront migrées au fil de l'eau, pas en masse.
 */
export async function getOwnedOr404<T>(
  model: {
    findFirst: (args: {
      where: Record<string, unknown>
      select?: Record<string, unknown>
      include?: Record<string, unknown>
    }) => Promise<T | null>
  },
  id: string,
  options?: {
    extraWhere?: Record<string, unknown>
    select?: Record<string, unknown>
    include?: Record<string, unknown>
    notFoundMessage?: string
  },
): Promise<T | NextResponse> {
  const session = await auth()
  if (!session?.user?.cabinetId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const where: Record<string, unknown> = {
    id,
    cabinetId: session.user.cabinetId,
    ...(options?.extraWhere ?? {}),
  }
  const args: {
    where: Record<string, unknown>
    select?: Record<string, unknown>
    include?: Record<string, unknown>
  } = { where }
  if (options?.select)  args.select  = options.select
  if (options?.include) args.include = options.include

  const found = await model.findFirst(args)
  if (!found) {
    return NextResponse.json(
      { error: options?.notFoundMessage ?? 'Ressource introuvable' },
      { status: 404 },
    )
  }
  return found
}
