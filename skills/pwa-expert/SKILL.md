---
name: pwa-expert
description: >
  Progressive Web App configuration for Quest. Service workers, push notifications, offline.
  Trigger: Al trabajar con PWA features, push notifications, o funcionalidad offline.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Working with PWA features"
    - "Push notifications"
    - "Offline functionality"
---

# PWA Expert — Quest

## Setup Actual

- **Plugin:** `@ducanh2912/next-pwa`
- **Service Worker:** Auto-generado en `public/sw.js`
- **Extra SW:** `public/sw-extra.js` (push notification handlers)
- **Manifest:** `public/manifest.json`
- **Build:** `next build --webpack && node scripts/patch-sw.mjs`

---

## Push Notifications

### Suscripción (Client)
```typescript
const reg = await navigator.serviceWorker.ready;
const subscription = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY
});
// Guardar en supabase: suscripciones_push
```

### Envío (Server)
```typescript
import webPush from 'web-push';

webPush.setVapidDetails(
  'mailto:admin@quest.app',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

await webPush.sendNotification(subscription, JSON.stringify({
  title: '🔥 Tu racha está en peligro',
  body: 'Completa tu lectura hoy para no perderla',
  icon: '/icons/icon-192.png'
}));
```

---

## Offline Strategy

| Recurso | Estrategia | Cache |
|---------|-----------|-------|
| HTML pages | Network-first | Runtime |
| CSS/JS | Cache-first | Precache |
| API calls | Network-first + queue | Runtime |
| Images | Cache-first | Runtime |
| Lecturas | Cache-first (descargadas) | Custom |

### Offline Queue
```typescript
// Acciones realizadas offline se guardan en IndexedDB
// Al recuperar conexión → sync batch con Supabase
navigator.serviceWorker.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncOfflineProgress());
  }
});
```

---

## Manifest

```json
{
  "name": "Quest - Crecimiento Espiritual",
  "short_name": "Quest",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#4F46E5",
  "background_color": "#F8FAFC",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Notas Capacitor

- PWA features coexisten con Capacitor
- En nativo: usar `@capacitor/push-notifications` en lugar de web push
- En nativo: offline mode usa Capacitor Storage, no IndexedDB
- Service worker NO se usa en Capacitor (nativo maneja el cache)
