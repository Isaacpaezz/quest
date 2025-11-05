import webPush from 'web-push'

// Dejaremos las claves vacías por ahora, las llenaremos desde las variables de entorno.
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''

if (!vapidPublicKey || !vapidPrivateKey) {
  // En desarrollo, esto no es un error fatal, pero en producción sí lo será.
  console.warn('Advertencia: Las claves VAPID no están definidas. Las notificaciones push no funcionarán.')
} else {
  // Asegúrate de reemplazar 'mailto:your-email@example.com' con tu email real.
  webPush.setVapidDetails(
    'mailto:tu-email@dominio.com',
    vapidPublicKey,
    vapidPrivateKey
  )
}

export const pushService = webPush
