import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Verifies the user is authenticated AND has admin role in the specified group.
 * Returns the userId on success. Throws descriptive errors on failure.
 *
 * Usage: call at the top of admin server actions.
 */
export async function requireAdmin(
  supabase: SupabaseClient<Database>,
  grupoId: string
): Promise<{ userId: string }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('No autenticado.')
  }

  const { data: miembro, error: miembroError } = await supabase
    .from('miembros_grupo')
    .select('rol')
    .eq('usuario_id', user.id)
    .eq('grupo_id', grupoId)
    .single()

  if (miembroError || !miembro) {
    throw new Error('No tienes permiso para realizar esta acción.')
  }

  if (miembro.rol !== 'admin') {
    throw new Error('No tienes permiso para realizar esta acción.')
  }

  return { userId: user.id }
}
