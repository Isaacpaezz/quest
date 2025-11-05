'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionState } from '@/types/definitions'
import type { Json } from '@/types/database'
import { pushService } from '@/lib/web-push'
import type { PushSubscription as WebPushSubscription } from 'web-push'

export async function guardarSuscripcionPushAction(subscription: Json | null): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado.' }
  }

  if (!subscription) {
    // Si la suscripción es nula, la eliminamos de la base de datos
    const { error } = await supabase.from('suscripciones_push').delete().eq('usuario_id', user.id)
    if (error) return { error: 'No se pudo desactivar las notificaciones.' }
    return { message: 'Notificaciones desactivadas.' }
  }

  // Usamos upsert para crear o actualizar la suscripción
  const payload = subscription as Json
  const { error } = await supabase.from('suscripciones_push').upsert({
    usuario_id: user.id,
    subscription: payload,
  }, { onConflict: 'usuario_id' })

  if (error) {
    console.error("Error al guardar suscripción push:", error)
    return { error: 'No se pudo guardar la suscripción.' }
  }

  return { message: '¡Notificaciones activadas exitosamente!' }
}

export async function enviarNotificacionPruebaAction(): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado.' }

  const { data: subRow, error: subErr } = await supabase
    .from('suscripciones_push')
    .select('subscription')
    .eq('usuario_id', user.id)
    .single()

  if (subErr || !subRow?.subscription) {
    return { error: 'No tienes una suscripción activa.' }
  }

  const payload = JSON.stringify({
    title: 'Test Push',
    body: 'Notificación de prueba enviada correctamente.'
  })

  try {
    await pushService.sendNotification(subRow.subscription as unknown as WebPushSubscription, payload)
    return { message: 'Notificación de prueba enviada.' }
  } catch (e) {
    console.error('Error enviando notificación de prueba:', e)
    return { error: 'No se pudo enviar la notificación.' }
  }
}
