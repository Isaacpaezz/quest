'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ActionState } from '@/types/definitions'

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
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const data = validatedFields.data

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
