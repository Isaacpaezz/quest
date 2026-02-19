'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ActionState } from '@/types/definitions'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )
}

// Canjear puntos XP por dinero (para reducir deuda)
export async function canjearPuntosAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const puntos = Number(formData.get('puntos'))
  if (!puntos || puntos < 1) return { error: 'Cantidad de puntos inválida' }

  // Obtener tasa_canjeo de configuración
  const { data: configData } = await supabase
    .from('configuracion_app')
    .select('valor')
    .eq('clave', 'tasa_canjeo')
    .single()

  const tasaCanjeo = configData ? Number(configData.valor) : 100

  // Llamar función RPC
  const { data, error } = await supabase.rpc('canjear_puntos', {
    p_usuario_id: user.id,
    p_puntos: puntos,
    p_tasa_canjeo: tasaCanjeo,
  })

  if (error) return { error: `Error al canjear: ${error.message}` }

  const resultado = data?.[0]
  revalidatePath('/debts')
  revalidatePath('/perfil')
  return {
    message: `¡Canjeaste ${puntos} XP! Se descontaron $${resultado?.monto_descontado?.toFixed(2) || '0'} de tu deuda.`
  }
}

// Recuperar racha gastando XP
export async function recuperarRachaAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const rachaPrevia = Number(formData.get('racha_previa')) || 0

  // Obtener costo de recuperación desde config
  const { data: configData } = await supabase
    .from('configuracion_app')
    .select('valor')
    .eq('clave', 'costo_recuperar_racha_xp')
    .single()

  const costoXp = configData ? Number(configData.valor) : 200

  // Verificar suficiente XP
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('xp')
    .eq('id', user.id)
    .single()

  if (!perfil || (perfil.xp || 0) < costoXp) {
    return { error: `Necesitas al menos ${costoXp} XP para recuperar tu racha.` }
  }

  // Descontar XP
  await supabase
    .from('perfiles')
    .update({ xp: (perfil.xp || 0) - costoXp })
    .eq('id', user.id)

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
