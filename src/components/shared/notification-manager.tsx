'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { guardarSuscripcionPushAction } from '@/app/(app)/perfil/actions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function NotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkSubscription() {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          setIsSubscribed(!!subscription)
        }
      } finally {
        setIsLoading(false)
      }
    }
    void checkSubscription()
  }, [])

  const handleToggleSubscription = async () => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      toast.error('Error de configuración del cliente.')
      return
    }

    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready

      if (isSubscribed) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
          await guardarSuscripcionPushAction(null)
          toast.success('Notificaciones desactivadas.')
          setIsSubscribed(false)
        }
      } else {
        try {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
          })
          const result = await guardarSuscripcionPushAction(subscription)
          if (result.error) {
            toast.error('Error', { description: result.error })
            await subscription.unsubscribe()
          } else {
            toast.success('¡Notificaciones activadas!')
            setIsSubscribed(true)
          }
        } catch (error) {
          console.error('Error al suscribirse:', error)
          toast.error('No se pudo activar las notificaciones.', { description: 'Asegúrate de conceder el permiso en tu navegador.' })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando estado de notificaciones...</p>
  }
  
  return (
    <div>
      <p className="text-sm mb-2">{isSubscribed ? 'Las notificaciones push están activadas.' : 'Activa las notificaciones para mantenerte al día.'}</p>
      <Button onClick={handleToggleSubscription} disabled={isLoading}>
        {isSubscribed ? 'Desactivar Notificaciones' : 'Activar Notificaciones'}
      </Button>
    </div>
  )
}
