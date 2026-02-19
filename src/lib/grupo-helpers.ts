import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { DEFAULT_TIMEZONE } from '@/lib/utils'

type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Obtiene el grupo activo del usuario autenticado.
 * Retorna el grupo_activo_id o null si está en modo solo.
 */
export async function getGrupoActivo(supabase: TypedSupabaseClient): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('grupo_activo_id')
    .eq('id', user.id)
    .single()

  return perfil?.grupo_activo_id || null
}

/**
 * Obtiene los IDs de los miembros de un grupo.
 */
export async function getMiembrosGrupo(
  supabase: TypedSupabaseClient,
  grupoId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('miembros_grupo')
    .select('usuario_id')
    .eq('grupo_id', grupoId)

  return data?.map(m => m.usuario_id).filter((id): id is string => id !== null) || []
}

/**
 * Obtiene la configuración de un grupo como objeto clave-valor.
 */
export async function getConfigGrupo(
  supabase: TypedSupabaseClient,
  grupoId: string
): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('configuracion_app')
    .select('clave, valor')
    .eq('grupo_id', grupoId)

  return Object.fromEntries((data || []).map(c => [c.clave, c.valor]))
}

/**
 * Obtiene los miembros del grupo activo del usuario.
 * Si no tiene grupo activo (modo solo), retorna solo el ID del usuario.
 */
export async function getMiembrosGrupoActivo(
  supabase: TypedSupabaseClient
): Promise<{ grupoId: string | null; miembros: string[] }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { grupoId: null, miembros: [] }

  const grupoId = await getGrupoActivo(supabase)

  if (!grupoId) {
    // Modo solo: solo el usuario
    return { grupoId: null, miembros: [user.id] }
  }

  const miembros = await getMiembrosGrupo(supabase, grupoId)
  return { grupoId, miembros }
}

/**
 * Obtiene la timezone del grupo activo del usuario.
 * Si no tiene grupo activo (modo solo), retorna DEFAULT_TIMEZONE.
 */
export async function getTimezone(supabase: TypedSupabaseClient): Promise<string> {
  const grupoId = await getGrupoActivo(supabase)
  if (!grupoId) return DEFAULT_TIMEZONE

  const config = await getConfigGrupo(supabase, grupoId)
  return config['timezone'] || DEFAULT_TIMEZONE
}
