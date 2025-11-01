'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionState } from '@/types/definitions'

export async function guardarSuscripcionPushAction(subscription: PushSubscription | null): Promise<ActionState> {
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
  const { error } = await supabase.from('suscripciones_push').upsert({
    usuario_id: user.id,
    // Convertimos a tipo genérico JSON serializable evitando any explícito
    subscription: subscription as unknown as Record<string, unknown>,
  }, { onConflict: 'usuario_id' })

  if (error) {
    console.error('Error al guardar suscripción push:', error)
    return { error: 'No se pudo guardar la suscripción.' }
  }

  return { message: '¡Notificaciones activadas exitosamente!' }
}
