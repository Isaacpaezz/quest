'use server'

import { z } from 'zod'
import { LIBROS_BIBLIA } from '@/lib/bible-data'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ActionState } from '@/types/definitions'
import { requireAdmin } from '@/lib/admin-helpers'
import { getConfigGrupo } from '@/lib/grupo-helpers'
import { getDayOfWeekInTimezone } from '@/lib/streak'
import { DEFAULT_TIMEZONE } from '@/lib/utils'

const PlanSchema = z.object({
  nombre_libro: z.string().min(1, 'Debes seleccionar un libro.'),
  minutos_oracion: z.coerce.number().min(1, 'Los minutos deben ser mayor a 0.'),
})

/**
 * Genera un plan de lectura y lo agrega a la cola del grupo.
 * La fecha de inicio se calcula automáticamente:
 * - Si hay un plan activo/próximo → día después de su fecha_fin
 * - Si no hay planes → mañana
 * Los días libres del grupo se omiten en la generación de capítulos.
 */
export async function generarPlanAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = PlanSchema.safeParse({
    nombre_libro: formData.get('nombre_libro'),
    minutos_oracion: formData.get('minutos_oracion'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { nombre_libro, minutos_oracion } = validatedFields.data
  const libro = LIBROS_BIBLIA.find(b => b.nombre === nombre_libro)

  if (!libro) {
    return { errors: { nombre_libro: ['Libro no válido.'] } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { errors: { _form: ['No autenticado.'] } }

  // Obtener grupo activo del admin
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('grupo_activo_id')
    .eq('id', user.id)
    .single()

  const grupoId = perfil?.grupo_activo_id
  if (!grupoId) return { errors: { _form: ['No tienes un grupo activo.'] } }

  // Verify admin role
  try {
    await requireAdmin(supabase, grupoId)
  } catch (error) {
    return { errors: { _form: [error instanceof Error ? error.message : 'No tienes permiso para realizar esta acción.'] } }
  }

  // Obtener días libres del grupo (JS convention: 0=domingo, 6=sábado)
  const { data: diasLibresConfig } = await supabase
    .from('configuracion_app')
    .select('valor')
    .eq('clave', 'dias_libres')
    .eq('grupo_id', grupoId)
    .single()

  const diasLibres: number[] = diasLibresConfig?.valor
    ? JSON.parse(diasLibresConfig.valor)
    : []

  // Guard: if all 7 days are free, no chapters can ever be scheduled
  if (diasLibres.length >= 7) {
    return { errors: { _form: ['No se puede generar un plan si todos los días están configurados como días libres. Desmarca al menos un día en la configuración del grupo.'] } }
  }

  // Calcular fecha de inicio automática (cola inteligente)
  const { data: ultimoPlan } = await supabase
    .from('planes_lectura')
    .select('fecha_fin')
    .eq('grupo_id', grupoId)
    .in('estado', ['activo', 'proximo'])
    .order('fecha_fin', { ascending: false })
    .limit(1)
    .single()

  // Get group timezone for date-aware calculations
  const config = await getConfigGrupo(supabase, grupoId)
  const timezone: string = config['timezone'] || DEFAULT_TIMEZONE

  // Helper: parse 'YYYY-MM-DD' (or ISO timestamp) into noon-UTC Date
  const parseDateUTC = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  }

  // Helper: format a noon-UTC Date as 'YYYY-MM-DD'
  const formatDateUTC = (d: Date): string => {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dy = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${dy}`
  }

  // Helper: get calendar date parts in a specific timezone via Intl.DateTimeFormat
  const getDatePartsInTimezone = (date: Date, tz: string) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const parts = formatter.formatToParts(date)
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? '1')
    return { year: get('year'), month: get('month'), day: get('day') }
  }

  let startDate: Date
  if (ultimoPlan?.fecha_fin) {
    // Día después del último plan activo/próximo
    // fecha_fin is a calendar date in the group's timezone stored as 'YYYY-MM-DD'
    startDate = parseDateUTC(ultimoPlan.fecha_fin)
    startDate.setUTCDate(startDate.getUTCDate() + 1)
  } else {
    // No hay planes → mañana (in the group's timezone)
    const todayParts = getDatePartsInTimezone(new Date(), timezone)
    startDate = new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day, 12, 0, 0))
    startDate.setUTCDate(startDate.getUTCDate() + 1)
  }

  // Generar capítulos diarios omitiendo días libres
  // All dates stored as noon-UTC to avoid DST/boundary issues (same pattern as streak.ts)
  const capitulosDiarios = []
  const currentDate = new Date(startDate.getTime())

  for (let i = 1; i <= libro.capitulos; i++) {
    // Skip free days — timezone-aware day-of-week via Intl.DateTimeFormat
    // Safety counter prevents infinite loop (max 365 iterations)
    let skipIterations = 0
    while (diasLibres.includes(getDayOfWeekInTimezone(currentDate, timezone))) {
      if (++skipIterations > 365) {
        return { errors: { _form: ['Error interno: se excedió el límite de días libres consecutivos. Revisa la configuración de días libres del grupo.'] } }
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }

    capitulosDiarios.push({
      fecha_lectura: formatDateUTC(currentDate),
      referencia_capitulo: `${libro.nombre} ${i}`,
    })
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  }

  const fecha_inicio = capitulosDiarios[0].fecha_lectura
  const fecha_fin = capitulosDiarios[capitulosDiarios.length - 1].fecha_lectura

  // Determinar estado: si no hay plan activo, este se vuelve "proximo"
  const { error } = await supabase.rpc('crear_plan_con_capitulos', {
    nombre_libro_param: nombre_libro,
    fecha_inicio_param: new Date(fecha_inicio).toISOString(),
    fecha_fin_param: new Date(fecha_fin).toISOString(),
    minutos_oracion_requeridos_param: minutos_oracion,
    capitulos_param: capitulosDiarios,
    grupo_id_param: grupoId,
  })

  if (error) {
    console.error('Error al crear el plan:', error)
    return { errors: { _form: ['Hubo un error al guardar el plan. Inténtalo de nuevo.'] } }
  }

  revalidatePath('/admin/planes')
  return { message: `¡Plan para ${nombre_libro} agregado a la cola! Inicia el ${new Date(fecha_inicio).toLocaleDateString('es-ES')}.` }
}

/**
 * Elimina un plan que no esté activo.
 */
export async function eliminarPlanAction(planId: number): Promise<ActionState> {
  const supabase = await createClient()

  // Get user's active group for admin check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('grupo_activo_id')
    .eq('id', user.id)
    .single()

  const grupoId = perfil?.grupo_activo_id
  if (!grupoId) return { error: 'No tienes un grupo activo.' }

  // Verify admin role
  try {
    await requireAdmin(supabase, grupoId)
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No tienes permiso para realizar esta acción.' }
  }

  // Verificar que el plan no esté activo
  const { data: plan } = await supabase
    .from('planes_lectura')
    .select('estado, grupo_id')
    .eq('id', planId)
    .single()

  if (!plan) return { error: 'Plan no encontrado.' }
  if (plan.estado === 'activo') return { error: 'No puedes eliminar un plan activo.' }

  // Verify plan belongs to user's group
  if (plan.grupo_id !== grupoId) {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  // Eliminar capítulos primero, luego el plan
  await supabase.from('capitulos_diarios').delete().eq('plan_id', planId)
  const { error } = await supabase.from('planes_lectura').delete().eq('id', planId)

  if (error) {
    console.error('Error al eliminar plan:', error)
    return { error: 'No se pudo eliminar el plan.' }
  }

  revalidatePath('/admin/planes')
  return { message: 'Plan eliminado exitosamente.' }
}

/**
 * Programa un plan inactivo como el siguiente (proximo).
 */
export async function programarPlanSiguienteAction(planId: number): Promise<ActionState> {
  const supabase = await createClient()

  // Get user's active group for admin check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('grupo_activo_id')
    .eq('id', user.id)
    .single()

  const grupoId = perfil?.grupo_activo_id
  if (!grupoId) return { error: 'No tienes un grupo activo.' }

  // Verify admin role
  try {
    await requireAdmin(supabase, grupoId)
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No tienes permiso para realizar esta acción.' }
  }

  // Verify plan belongs to user's group
  const { data: plan } = await supabase
    .from('planes_lectura')
    .select('grupo_id')
    .eq('id', planId)
    .single()

  if (!plan) return { error: 'Plan no encontrado.' }
  if (plan.grupo_id !== grupoId) {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  const { error } = await supabase.rpc('programar_plan_siguiente', {
    plan_id_a_programar: planId,
  })

  if (error) {
    console.error('Error al programar el plan:', error)
    return { error: 'No se pudo programar el plan. Inténtalo de nuevo.' }
  }

  revalidatePath('/admin/planes')
  return { message: 'Plan programado como el siguiente exitosamente.' }
}
