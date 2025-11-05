/// <reference lib="webworker" />

// Nota: El precache lo gestiona next-pwa con el SW generado en /public/sw.js.
// Aquí solo añadimos el manejador de 'push'.

const sw = self as unknown as ServiceWorkerGlobalScope

self.addEventListener('push', (e: Event) => {
  const event = e as unknown as PushEvent
  if (!event.data) return
  const data = event.data.json()
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png', // Icono para la barra de notificaciones en Android
  } as NotificationOptions

  event.waitUntil(sw.registration.showNotification(data.title, options))
})

