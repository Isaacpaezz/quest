'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ActionState } from '@/types/definitions'
import { SECTION_KEYS, validateSectionConfig } from '@/lib/prayer-sections'

const SettingsSchema = z.object({
  modo_penalizacion: z.enum(['dinero', 'puntos']),
  monto_penalizacion: z.coerce.number().positive('El monto debe ser un número positivo.'),
  tasa_canjeo: z.coerce.number().positive('La tasa debe ser un número positivo.'),
  costo_recuperacion_puntos: z.coerce.number().min(0),
  costo_recuperacion_dinero: z.coerce.number().min(0),
  max_recuperaciones_mes: z.coerce.number().int().min(0),
  metodo_recuperacion: z.string(), // JSON array of strings
  timezone: z.string().min(1, 'La zona horaria es requerida.'),
  dias_libres: z.string(), // JSON array of day numbers
  // XP config
  xp_lectura: z.coerce.number().min(0),
  xp_oracion: z.coerce.number().min(0),
  xp_oracion_bonus: z.coerce.number().min(0),
  xp_oracion_bonus_minutos: z.coerce.number().min(1),
  xp_devocional_completo: z.coerce.number().min(0),
  xp_reto_completado: z.coerce.number().min(0),
  xp_racha_multiplicador: z.coerce.number().min(0),
  xp_racha_cap: z.coerce.number().min(0),
  oracion_secciones: z.string(), // JSON string of SectionConfig percentages
})

export async function actualizarConfiguracionAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('grupo_activo_id')
    .eq('id', user.id)
    .single()

  const grupoId = perfil?.grupo_activo_id
  if (!grupoId) return { error: 'No tienes un grupo activo.' }

  // Verify admin role via miembros_grupo
  const { data: miembro } = await supabase
    .from('miembros_grupo')
    .select('rol')
    .eq('usuario_id', user.id)
    .eq('grupo_id', grupoId)
    .single()

  if (miembro?.rol !== 'admin') {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  const validatedFields = SettingsSchema.safeParse({
    modo_penalizacion: formData.get('modo_penalizacion'),
    monto_penalizacion: formData.get('monto_penalizacion'),
    tasa_canjeo: formData.get('tasa_canjeo'),
    costo_recuperacion_puntos: formData.get('costo_recuperacion_puntos'),
    costo_recuperacion_dinero: formData.get('costo_recuperacion_dinero'),
    max_recuperaciones_mes: formData.get('max_recuperaciones_mes'),
    metodo_recuperacion: formData.get('metodo_recuperacion'),
    timezone: formData.get('timezone'),
    dias_libres: formData.get('dias_libres'),
    xp_lectura: formData.get('xp_lectura'),
    xp_oracion: formData.get('xp_oracion'),
    xp_oracion_bonus: formData.get('xp_oracion_bonus'),
    xp_oracion_bonus_minutos: formData.get('xp_oracion_bonus_minutos'),
    xp_devocional_completo: formData.get('xp_devocional_completo'),
    xp_reto_completado: formData.get('xp_reto_completado'),
    xp_racha_multiplicador: formData.get('xp_racha_multiplicador'),
    xp_racha_cap: formData.get('xp_racha_cap'),
    oracion_secciones: formData.get('oracion_secciones'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const data = validatedFields.data

  // Deep-validate oracion_secciones: must parse and sum to exactly 100
  const seccionesValidation = validateSectionConfig(
    (() => { try { return JSON.parse(data.oracion_secciones) } catch { return {} } })()
  )
  if (!seccionesValidation.valid) {
    return { error: `Secciones de oración inválidas: ${seccionesValidation.error}` }
  }

  // Upsert all settings for this group
  const settings = [
    { clave: 'modo_penalizacion', valor: data.modo_penalizacion, grupo_id: grupoId },
    { clave: 'monto_penalizacion', valor: data.monto_penalizacion.toString(), grupo_id: grupoId },
    { clave: 'tasa_canjeo', valor: data.tasa_canjeo.toString(), grupo_id: grupoId },
    { clave: 'costo_recuperacion_puntos', valor: data.costo_recuperacion_puntos.toString(), grupo_id: grupoId },
    { clave: 'costo_recuperacion_dinero', valor: data.costo_recuperacion_dinero.toString(), grupo_id: grupoId },
    { clave: 'max_recuperaciones_mes', valor: data.max_recuperaciones_mes.toString(), grupo_id: grupoId },
    { clave: 'metodo_recuperacion', valor: data.metodo_recuperacion, grupo_id: grupoId },
    { clave: 'timezone', valor: data.timezone, grupo_id: grupoId },
    { clave: 'dias_libres', valor: data.dias_libres, grupo_id: grupoId },
    // XP config
    { clave: 'xp_lectura', valor: data.xp_lectura.toString(), grupo_id: grupoId },
    { clave: 'xp_oracion', valor: data.xp_oracion.toString(), grupo_id: grupoId },
    { clave: 'xp_oracion_bonus', valor: data.xp_oracion_bonus.toString(), grupo_id: grupoId },
    { clave: 'xp_oracion_bonus_minutos', valor: data.xp_oracion_bonus_minutos.toString(), grupo_id: grupoId },
    { clave: 'xp_devocional_completo', valor: data.xp_devocional_completo.toString(), grupo_id: grupoId },
    { clave: 'xp_reto_completado', valor: data.xp_reto_completado.toString(), grupo_id: grupoId },
    { clave: 'xp_racha_multiplicador', valor: data.xp_racha_multiplicador.toString(), grupo_id: grupoId },
    { clave: 'xp_racha_cap', valor: data.xp_racha_cap.toString(), grupo_id: grupoId },
    { clave: 'oracion_secciones', valor: data.oracion_secciones, grupo_id: grupoId },
  ]

  const { error } = await supabase
    .from('configuracion_app')
    .upsert(settings, { onConflict: 'clave,grupo_id' })

  if (error) {
    console.error('Error al actualizar configuración:', error)
    return { error: 'Hubo un error al guardar la configuración.' }
  }

  revalidatePath('/admin/configuracion')
  return { message: 'Configuración guardada exitosamente.' }
}
