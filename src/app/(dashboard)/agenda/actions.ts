'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export type MoveResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Déplace un RDV (glisser-déposer agenda) : change uniquement son jour/heure.
 * - La durée d'origine est conservée (le modèle RendezVous n'a pas de champ `end`,
 *   seul `date` est mis à jour ; la fin reste calculée comme date + duree).
 * - `newStartISO` provient de `info.event.start.toISOString()` côté client : c'est
 *   déjà un instant UTC correct, on le stocke tel quel (aucune conversion manuelle).
 * - Sécurité multi-tenant : on vérifie que le RDV appartient bien au cabinet de
 *   l'utilisateur connecté ; l'id envoyé par le client n'est jamais cru sur parole.
 *
 * NB: aucun modèle de rappel (SentReminder/Rappel) n'existe dans ce projet — les
 * messages WhatsApp sont loggés ad-hoc via WhatsAppLog sans lien RDV — donc il n'y
 * a rien à supprimer ici lors d'un déplacement.
 */
export async function moveAppointment(
  appointmentId: string,
  newStartISO: string
): Promise<MoveResult> {
  try {
    const session = await auth()
    if (!session?.user?.cabinetId) {
      return { ok: false, error: 'Non autorisé' }
    }
    const { cabinetId } = session.user

    if (!appointmentId || !newStartISO) {
      return { ok: false, error: 'Paramètres manquants' }
    }

    const newStart = new Date(newStartISO)
    if (isNaN(newStart.getTime())) {
      return { ok: false, error: 'Date invalide' }
    }

    // Vérif d'appartenance au cabinet (multi-tenant, non négociable)
    const existing = await prisma.rendezVous.findFirst({
      where: { id: appointmentId, cabinetId },
      select: { id: true, statut: true },
    })
    if (!existing) {
      return { ok: false, error: 'RDV introuvable' }
    }

    // Filet de sécurité serveur : les RDV figés ne se déplacent pas.
    const frozen = ['annule', 'annulee', 'realisee', 'termine', 'honore', 'absent', 'no_show']
    if (existing.statut && frozen.includes(existing.statut.toLowerCase())) {
      return { ok: false, error: 'Ce RDV ne peut pas être déplacé (statut figé)' }
    }

    // Seule la date change ; la durée (`duree`) reste inchangée.
    await prisma.rendezVous.update({
      where: { id: appointmentId },
      data: { date: newStart },
    })

    revalidatePath('/agenda')
    return { ok: true }
  } catch (error) {
    console.error('[moveAppointment]', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Erreur serveur' }
  }
}
