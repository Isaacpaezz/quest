'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ActionState } from '@/types/definitions'

/**
 * Cambiar rol de un miembro (admin ↔ miembro)
 */
export async function cambiarRolAction(miembroId: string, nuevoRol: string): Promise<ActionState> {
  if (nuevoRol !== 'admin' && nuevoRol !== 'miembro') {
    return { error: 'Rol no válido.' }
  }

  const supabase = await createClient()
  
  const { error } = await supabase
    .from('miembros_grupo')
    .update({ rol: nuevoRol })
    .eq('id', miembroId)

  if (error) {
    console.error('Error al cambiar rol:', error)
    return { error: 'No se pudo cambiar el rol.' }
  }

  revalidatePath('/admin/miembros')
  return { message: `Rol actualizado a ${nuevoRol}.` }
}

/**
 * Eliminar un miembro del grupo
 */
export async function eliminarMiembroAction(miembroId: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  // No permitir eliminarse a sí mismo
  const { data: miembro } = await supabase
    .from('miembros_grupo')
    .select('usuario_id')
    .eq('id', miembroId)
    .single()

  if (miembro?.usuario_id === user.id) {
    return { error: 'No puedes eliminarte a ti mismo del grupo.' }
  }

  const { error } = await supabase
    .from('miembros_grupo')
    .delete()
    .eq('id', miembroId)

  if (error) {
    console.error('Error al eliminar miembro:', error)
    return { error: 'No se pudo eliminar el miembro.' }
  }

  revalidatePath('/admin/miembros')
  return { message: 'Miembro eliminado del grupo.' }
}
