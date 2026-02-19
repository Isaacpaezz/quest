'use server'

import { createClient } from '@/lib/supabase/server'
import { getTodayInVenezuela } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

type OracionInput = {
  segundosAcumulados: number
  capituloId: number
  oracionCompletada: boolean
}

export async function guardarProgresoOracionAction(input: OracionInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const today = getTodayInVenezuela()

  const { error } = await supabase
    .from('progreso_usuario')
    .upsert({
      usuario_id: user.id,
      fecha_progreso: today,
      segundos_oracion_acumulados: input.segundosAcumulados,
      oracion_completada: input.oracionCompletada,
      ...(input.oracionCompletada ? { oracion_completada_en: new Date().toISOString() } : {}),
    }, {
      onConflict: 'usuario_id,fecha_progreso',
    })

  if (error) return { error: error.message }

  // Award XP if prayer just completed
  if (input.oracionCompletada) {
    try {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('xp')
        .eq('id', user.id)
        .single()

      const currentXp = perfil?.xp ?? 0
      await supabase
        .from('perfiles')
        .update({ xp: currentXp + 50 })
        .eq('id', user.id)

      // Log community activity
      await supabase.from('actividad_comunidad').insert({
        usuario_id: user.id,
        tipo_actividad: 'oracion_completada',
        descripcion: `Completó su oración diaria`,
      })
    } catch (err) {
      console.error('Error otorgando XP por oración:', err)
    }
  }

  revalidatePath('/home')
  return { success: true }
}
