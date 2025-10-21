'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ActionState } from '@/types/definitions'

export async function aplicarPagoAction(usuarioId: string, monto: number): Promise<ActionState> {
  const supabase = await createClient()
  
  // Verificación de rol de administrador por seguridad
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: profile } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (profile?.rol !== 'admin') {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  if (monto <= 0) return { error: 'El monto debe ser positivo.' }

  const { error } = await supabase.rpc('aplicar_pago_a_usuario', {
    usuario_id_param: usuarioId,
    monto_pago_param: monto,
  })

  if (error) {
    console.error('Error al aplicar pago:', error)
    return { error: 'Hubo un error en la base de datos.' }
  }

  revalidatePath('/admin/penalizaciones')
  revalidatePath('/comunidad')
  return { message: 'Pago aplicado exitosamente.' }
}
