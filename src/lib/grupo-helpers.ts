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

/**
 * Obtiene los días libres del grupo activo (0=domingo, 6=sábado).
 * Si no tiene grupo activo, retorna array vacío.
 */
export async function getDiasLibres(
  supabase: TypedSupabaseClient,
  grupoId?: string | null
): Promise<number[]> {
  const gid = grupoId ?? await getGrupoActivo(supabase)
  if (!gid) return []

  const config = await getConfigGrupo(supabase, gid)
  try {
    return JSON.parse(config['dias_libres'] || '[]')
  } catch {
    return []
  }
}

/**
 * Returns dates in the lookback range that have NO chapter assigned in any plan of the group.
 * These are "gap days" between plans where users couldn't complete anything.
 * Used by calculateStreak to skip these days without breaking the streak.
 *
 * @param supabase - Supabase client
 * @param todayStr - Today's date as 'YYYY-MM-DD'
 * @param grupoId - Group ID to scope plans
 * @param lookbackDays - How many days to look back (default: 60)
 */
export async function getDatesWithoutPlan(
  supabase: TypedSupabaseClient,
  todayStr: string,
  grupoId?: string | null,
  lookbackDays: number = 60
): Promise<string[]> {
  if (!grupoId) return []

  const today = new Date(todayStr + 'T12:00:00')
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - lookbackDays)

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const startStr = fmt(startDate)

  // Get all dates that HAVE a chapter assigned in any plan of this group
  const { data: chapters } = await supabase
    .from('capitulos_diarios')
    .select('fecha_lectura, planes_lectura!inner(grupo_id)')
    .eq('planes_lectura.grupo_id', grupoId)
    .gte('fecha_lectura', startStr)
    .lte('fecha_lectura', todayStr)

  const datesWithPlan = new Set(
    (chapters || []).map(c => c.fecha_lectura)
  )

  // Generate all dates in range and find the ones without chapters
  const excludedDates: string[] = []
  const current = new Date(startDate)
  while (current <= today) {
    const dateStr = fmt(current)
    if (!datesWithPlan.has(dateStr)) {
      excludedDates.push(dateStr)
    }
    current.setDate(current.getDate() + 1)
  }

  return excludedDates
}

