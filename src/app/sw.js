// Custom Service Worker (injectManifest): precache + push + notificationclick
// Workbox precache/runtime imports (handled by next-pwa build)
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

// Ensure new SW takes control ASAP
self.skipWaiting()
clientsClaim()

// Precache files injected at build time
// self.__WB_MANIFEST will be replaced by next-pwa/workbox
// eslint-disable-next-line no-undef
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

// Web Push listener
self.addEventListener('push', function (event) {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (err) {
    data = { title: 'Quest', body: 'Nueva actividad en la comunidad.' }
  }
  const title = data.title || 'Quest'
  const options = {
    body: data.body || '',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    data,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Focus existing tab or open a new one on click
self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/comunidad'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    })
  )
})
