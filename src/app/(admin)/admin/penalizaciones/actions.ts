'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function marcarComoPagadaAction(penalizacionId: number) {
  const supabase = await createClient()
  
  // Verificación de rol de administrador por seguridad
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('perfiles').select('rol').eq('id', user!.id).single()
  if (profile?.rol !== 'admin') {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  const { error } = await supabase.rpc('marcar_penalizacion_pagada', {
    penalizacion_id_param: penalizacionId,
  })

  if (error) {
    console.error('Error al marcar penalización como pagada:', error)
    return { error: 'Hubo un error en la base de datos.' }
  }

  revalidatePath('/admin/penalizaciones')
  revalidatePath('/comunidad') // Revalidar también la página de comunidad
  return { message: 'Penalización marcada como pagada.' }
}
