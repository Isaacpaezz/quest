'use client'

import { useState, useEffect } from 'react'
import type { Json } from '@/types/database'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { guardarSuscripcionPushAction } from '@/app/(app)/perfil/actions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string | null {
  if (!buffer) return null
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function NotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    const supported = typeof window !== 'undefined'
      && 'Notification' in window
      && 'PushManager' in window
      && 'serviceWorker' in navigator
      && (window.isSecureContext || isLocalhost)
    setIsSupported(supported)

    async function checkSubscription() {
      try {
        if (!supported) return
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch {
        // Entorno no seguro o SW no listo; degradamos con gracia
        setIsSubscribed(false)
      } finally {
        setIsLoading(false)
      }
    }
    void checkSubscription()
  }, []);

  const handleToggleSubscription = async () => {
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    const supported = typeof window !== 'undefined'
      && 'Notification' in window
      && 'PushManager' in window
      && 'serviceWorker' in navigator
      && (window.isSecureContext || isLocalhost)
    if (!supported) {
      toast.error('Este navegador o contexto no soporta notificaciones push.', { description: 'Usa HTTPS o localhost y asegúrate de que el Service Worker esté disponible.' })
      return
    }
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      toast.error('Error de configuración del cliente.');
      return;
    }

    setIsLoading(true);
    const registration = await navigator.serviceWorker.ready;

    if (isSubscribed) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await guardarSuscripcionPushAction(null);
        toast.success('Notificaciones desactivadas.');
        setIsSubscribed(false);
      }
    } else {
      try {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
        });
        // Serializar a objeto plano compatible con Server Actions
        const payload = typeof subscription.toJSON === 'function'
          ? subscription.toJSON()
          : {
              endpoint: subscription.endpoint,
              expirationTime: subscription.expirationTime,
              keys: {
                p256dh: arrayBufferToBase64Url(subscription.getKey('p256dh')),
                auth: arrayBufferToBase64Url(subscription.getKey('auth')),
              },
            }
        const result = await guardarSuscripcionPushAction(payload as Json);
        if (result.error) {
          toast.error('Error', { description: result.error });
          await subscription.unsubscribe();
        } else {
          toast.success('¡Notificaciones activadas!');
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('Error al suscribirse:', error);
        toast.error('No se pudo activar las notificaciones.', { description: 'Asegúrate de conceder el permiso en tu navegador.' });
      }
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando estado de notificaciones...</p>;
  }
  
  return (
    <div>
      {!isSupported && !isLoading ? (
        <p className="text-sm text-muted-foreground">Las notificaciones push requieren un contexto seguro (HTTPS) o localhost, y soporte de Service Worker.</p>
      ) : (
        <>
          <p className="text-sm mb-2">{isSubscribed ? 'Las notificaciones push están activadas.' : 'Activa las notificaciones para mantenerte al día.'}</p>
          <Button onClick={handleToggleSubscription} disabled={isLoading}>
            {isSubscribed ? 'Desactivar Notificaciones' : 'Activar Notificaciones'}
          </Button>
        </>
      )}
    </div>
  );
}
