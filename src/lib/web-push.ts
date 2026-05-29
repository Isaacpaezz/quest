import webPush from 'web-push'

// Dejaremos las claves vacías por ahora, las llenaremos desde las variables de entorno.
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
const vapidContactEmail = process.env.VAPID_CONTACT_EMAIL || 'mailto:admin@quest-app.com'

if (!vapidPublicKey || !vapidPrivateKey) {
  // En desarrollo, esto no es un error fatal, pero en producción sí lo será.
  console.warn('Advertencia: Las claves VAPID no están definidas. Las notificaciones push no funcionarán.')
} else {
  if (!process.env.VAPID_CONTACT_EMAIL && process.env.NODE_ENV === 'production') {
    console.warn('Advertencia: VAPID_CONTACT_EMAIL no está configurado. Usando email por defecto. Configura la variable de entorno VAPID_CONTACT_EMAIL para producción.')
  }
  webPush.setVapidDetails(
    vapidContactEmail,
    vapidPublicKey,
    vapidPrivateKey
  )
}

export const pushService = webPush
