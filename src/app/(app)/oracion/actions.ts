'use server'

import { createClient } from '@/lib/supabase/server'
import { getToday } from '@/lib/utils'
import { getTimezone } from '@/lib/grupo-helpers'
import { grantXp } from '@/lib/xp-helpers'
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

  const tz = await getTimezone(supabase)
  const today = getToday(tz)

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

  // Award XP if prayer just completed — uses RPC with per-group support
  if (input.oracionCompletada) {
    try {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('grupo_activo_id')
        .eq('id', user.id)
        .single()

      const grupoId = perfil?.grupo_activo_id ?? undefined
      await grantXp(supabase, user.id, 50, 'oracion_completada', String(input.capituloId), grupoId)
    } catch (err) {
      console.error('Error otorgando XP por oración:', err)
    }
  }

  revalidatePath('/home')
  return { success: true }
}
