'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const SettingsSchema = z.object({
  monto_penalizacion: z.coerce.number().positive('El monto debe ser un número positivo.'),
})

export async function actualizarConfiguracionAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('perfiles').select('rol').eq('id', user!.id).single()
  if (profile?.rol !== 'admin') {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  const validatedFields = SettingsSchema.safeParse({
    monto_penalizacion: formData.get('monto_penalizacion'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { monto_penalizacion } = validatedFields.data

  const { error } = await supabase
    .from('configuracion_app')
    .update({ valor: monto_penalizacion.toString() })
    .eq('clave', 'monto_penalizacion')

  if (error) {
    console.error('Error al actualizar configuración:', error)
    return { error: 'Hubo un error al guardar la configuración.' }
  }

  revalidatePath('/admin/configuracion')
  return { message: 'Configuración guardada exitosamente.' }
}
