import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

// Initialise VAPID seulement si les clés sont présentes. Sinon
// setVapidDetails lève « No subject set in vapidDetails.subject » au
// chargement du module et fait planter `next build`.
const { VAPID_EMAIL, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env
if (VAPID_EMAIL && NEXT_PUBLIC_VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export interface PushPayload {
  title:              string
  body:               string
  icon?:              string
  badge?:             string
  tag?:               string
  requireInteraction?: boolean
  data?: {
    url: string
  }
  actions?: Array<{
    action: string
    title:  string
  }>
}

/**
 * Send a push notification to all subscribed users of a cabinet.
 * Automatically cleans up expired subscriptions (410 Gone).
 */
export async function sendPushToCabinet(cabinetId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({
    where: { cabinetId },
  })

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            ...payload,
            icon:  payload.icon  ?? '/icons/icon-192x192.png',
            badge: payload.badge ?? '/icons/badge-72x72.png',
          })
        )
      } catch (err: any) {
        // 410 = subscription expired / unsubscribed → clean up
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
        throw err
      }
    })
  )

  const sent   = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  return { sent, failed }
}

/**
 * Send a push notification to a specific user (all their subscribed devices).
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            ...payload,
            icon:  payload.icon  ?? '/icons/icon-192x192.png',
            badge: payload.badge ?? '/icons/badge-72x72.png',
          })
        )
      } catch (err: any) {
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
      }
    })
  )
}
