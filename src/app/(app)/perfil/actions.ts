'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionState } from '@/types/definitions'
import type { Json } from '@/types/database'

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
