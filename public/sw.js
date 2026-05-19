// KinéPro Service Worker — handles push notifications and caching

const CACHE_NAME = 'kinepro-v1'
const APP_URL    = self.location.origin

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  // Activate immediately without waiting
  self.skipWaiting()
})

// ─── Activate ────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ─── Fetch (network-first, cache fallback) ────────────────────────────────────

self.addEventListener('fetch', (event) => {
  // Only handle GET requests; skip API, WS, chrome-extension
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.startsWith('chrome-extension')
  ) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful HTML / static asset responses
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

// ─── Push ─────────────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'KinéPro', body: event.data.text() }
  }

  const options = {
    body:    data.body    || '',
    icon:    data.icon    || '/icons/icon-192x192.png',
    badge:   data.badge   || '/icons/badge-72x72.png',
    image:   data.image   || undefined,
    tag:     data.tag     || 'kinepro-notification',
    data:    data.data    || { url: '/dashboard' },
    vibrate: [100, 50, 100],
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'KinéPro', options)
  )
})

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const data   = event.notification.data || {}
  let url      = APP_URL + (data.url || '/dashboard')

  // Per-action routing
  if (action === 'open_whatsapp') url = APP_URL + '/whatsapp?tab=ready'
  if (action === 'open_agenda')   url = APP_URL + '/agenda'
  if (action === 'open_sub')      url = APP_URL + '/abonnement'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if already open
      for (const client of clientList) {
        if (client.url.startsWith(APP_URL) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

// ─── Push subscription change ─────────────────────────────────────────────────

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription?.options ?? { userVisibleOnly: true })
      .then((newSubscription) =>
        fetch('/api/push/subscribe', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(newSubscription),
        })
      )
  )
})
