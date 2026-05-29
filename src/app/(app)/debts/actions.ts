'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ActionState } from '@/types/definitions'

// Canjear puntos XP por dinero (para reducir deuda)
export async function canjearPuntosAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const puntos = Number(formData.get('puntos'))
  if (!puntos || puntos < 1) return { error: 'Cantidad de puntos inválida' }

  // Obtener grupo activo para deducir XP del grupo
  const { data: perfil } = await supabase.from('perfiles').select('grupo_activo_id').eq('id', user.id).single()
  const grupoId = perfil?.grupo_activo_id ?? undefined

  // Obtener tasa_canjeo de configuración (filter by group)
  const { data: configData } = await supabase
    .from('configuracion_app')
    .select('valor')
    .eq('clave', 'tasa_canjeo')
    .eq('grupo_id', grupoId)
    .single()

  const tasaCanjeo = configData ? Number(configData.valor) : 100

  // Llamar función RPC con grupo_id
  const { data, error } = await supabase.rpc('canjear_puntos', {
    p_usuario_id: user.id,
    p_puntos: puntos,
    p_tasa_canjeo: tasaCanjeo,
    p_grupo_id: grupoId,
  })

  if (error) return { error: `Error al canjear: ${error.message}` }

  const resultado = data?.[0]
  revalidatePath('/debts')
  revalidatePath('/perfil')
  return {
    message: `¡Canjeaste ${puntos} XP! Se descontaron $${resultado?.monto_descontado?.toFixed(2) || '0'} de tu deuda.`
  }
}

// Recuperar racha gastando XP (del grupo activo)
export async function recuperarRachaAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const rachaPrevia = Number(formData.get('racha_previa')) || 0

  // Obtener grupo activo
  const { data: perfil } = await supabase.from('perfiles').select('grupo_activo_id, xp').eq('id', user.id).single()
  const grupoId = perfil?.grupo_activo_id ?? undefined

  // Obtener costo de recuperación desde config (filter by group)
  const { data: configData } = await supabase
    .from('configuracion_app')
    .select('valor')
    .eq('clave', 'costo_recuperar_racha_xp')
    .eq('grupo_id', grupoId)
    .single()

  const costoXp = configData ? Number(configData.valor) : 200

  // Verificar suficiente XP (from group if in group, else global)
  let xpDisponible = perfil?.xp || 0
  if (grupoId) {
    const { data: miembro } = await supabase
      .from('miembros_grupo')
      .select('xp')
      .eq('usuario_id', user.id)
      .eq('grupo_id', grupoId)
      .single()
    xpDisponible = miembro?.xp || 0
  }

  if (xpDisponible < costoXp) {
    return { error: `Necesitas al menos ${costoXp} XP para recuperar tu racha.` }
  }

  // Descontar XP del global (optimistic locking to prevent race conditions)
  const { data: updatedPerfil } = await supabase
    .from('perfiles')
    .update({ xp: (perfil?.xp || 0) - costoXp })
    .eq('id', user.id)
    .eq('xp', perfil?.xp || 0)
    .select()

  if (!updatedPerfil?.length) {
    return { error: 'Hubo un conflicto al actualizar XP. Intenta de nuevo.' }
  }

  // Descontar XP del grupo si aplica (optimistic locking)
  if (grupoId) {
    const { data: updatedMiembro } = await supabase
      .from('miembros_grupo')
      .update({ xp: xpDisponible - costoXp })
      .eq('usuario_id', user.id)
      .eq('grupo_id', grupoId)
      .eq('xp', xpDisponible)
      .select()

    if (!updatedMiembro?.length) {
      // Rollback perfiles XP deduction
      await supabase
        .from('perfiles')
        .update({ xp: perfil?.xp || 0 })
        .eq('id', user.id)
      return { error: 'Hubo un conflicto al actualizar XP del grupo. Intenta de nuevo.' }
    }
  }

  // Registrar recuperación
  const { error } = await supabase.from('recuperaciones_racha').insert({
    usuario_id: user.id,
    racha_recuperada: rachaPrevia,
    metodo: 'xp',
    costo_puntos: costoXp,
  })

  if (error) return { error: `Error: ${error.message}` }

  revalidatePath('/debts')
  revalidatePath('/home')
  return { message: `¡Racha recuperada! Se usaron ${costoXp} XP.` }
}
