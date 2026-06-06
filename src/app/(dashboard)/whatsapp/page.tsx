import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import WhatsAppCenterClient from './WhatsAppCenterClient'

/**
 * Server shell — pré-charge les 4 listes du WhatsApp Center en SSR via
 * 4 requêtes Prisma en parallèle. Les selects/includes/take/orderBy sont
 * strictement identiques à GET /api/seances, /api/rendez-vous,
 * /api/feedback et /api/feedback/ready, afin que le client component
 * voie exactement la même shape que ce qu'il recevait via fetch().
 *
 * Tout le reste — envoi wa.me (WhatsAppButton), changement d'onglet,
 * URL param `?tab=ready`, refresh fetchAll() après mutation — reste
 * dans WhatsAppCenterClient ('use client').
 */
export default async function WhatsAppCenterPage() {
  const session = await auth()
  if (!session?.user?.cabinetId) redirect('/login')
  const { cabinetId } = session.user

  const [seances, rdvs, feedbacks, readySeances] = await Promise.all([
    prisma.seance.findMany({
      where: { cabinetId },
      include: {
        patient:   { select: { id: true, nom: true, prenom: true } },
        praticien: { select: { id: true, nom: true, prenom: true, couleur: true } },
      },
      orderBy: { date: 'desc' },
      take: 200,
    }),
    prisma.rendezVous.findMany({
      where: { cabinetId },
      include: {
        patient:   { select: { id: true, nom: true, prenom: true, telephone: true } },
        praticien: { select: { id: true, nom: true, prenom: true, couleur: true } },
      },
      orderBy: { date: 'asc' },
      take: 300,
    }),
    prisma.feedback.findMany({
      where: { cabinetId },
      include: { patient: { select: { id: true, nom: true, prenom: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    // /api/feedback/ready — pas de promotion automatique (cf. commit
    // d0bff81 qui supprime le délai 20 min). Simple SELECT ready.
    prisma.seance.findMany({
      where: { cabinetId, feedbackStatus: 'ready' },
      include: {
        patient:   { select: { id: true, nom: true, prenom: true, telephone: true } },
        praticien: { select: { nom: true, prenom: true } },
      },
      orderBy: { feedbackReadyAt: 'desc' },
    }),
  ])

  return (
    <WhatsAppCenterClient
      initialSeances={seances}
      initialRdvs={rdvs}
      initialFeedbacks={feedbacks}
      initialReadySeances={readySeances}
    />
  )
}
