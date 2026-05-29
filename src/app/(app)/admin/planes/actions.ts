'use server'

import { z } from 'zod'
import { LIBROS_BIBLIA } from '@/lib/bible-data'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ActionState } from '@/types/definitions'
import { requireAdmin } from '@/lib/admin-helpers'

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

  // Calcular fecha de inicio automática (cola inteligente)
  const { data: ultimoPlan } = await supabase
    .from('planes_lectura')
    .select('fecha_fin')
    .eq('grupo_id', grupoId)
    .in('estado', ['activo', 'proximo'])
    .order('fecha_fin', { ascending: false })
    .limit(1)
    .single()

  let startDate: Date
  if (ultimoPlan?.fecha_fin) {
    // Día después del último plan activo/próximo
    startDate = new Date(ultimoPlan.fecha_fin)
    startDate.setUTCDate(startDate.getUTCDate() + 1)
  } else {
    // No hay planes → mañana
    startDate = new Date()
    startDate.setUTCDate(startDate.getUTCDate() + 1)
    // Normalizar a medianoche UTC
    startDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()))
  }

  // Generar capítulos diarios omitiendo días libres
  const capitulosDiarios = []
  const currentDate = new Date(startDate)

  for (let i = 1; i <= libro.capitulos; i++) {
    // Skip free days
    while (diasLibres.includes(currentDate.getUTCDay())) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }

    capitulosDiarios.push({
      fecha_lectura: currentDate.toISOString().split('T')[0],
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
