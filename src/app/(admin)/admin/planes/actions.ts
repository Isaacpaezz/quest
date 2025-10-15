'use server'

import { z } from 'zod'
import { LIBROS_BIBLIA } from '@/lib/bible-data'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const PlanSchema = z.object({
  nombre_libro: z.string().min(1, 'Debes seleccionar un libro.'),
  fecha_inicio: z.string().min(1, 'Debes seleccionar una fecha de inicio.'),
  minutos_oracion: z.coerce.number().min(1, 'Los minutos deben ser mayor a 0.'),
})

export async function generarPlanAction(prevState: any, formData: FormData) {
  const validatedFields = PlanSchema.safeParse({
    nombre_libro: formData.get('nombre_libro'),
    fecha_inicio: formData.get('fecha_inicio'),
    minutos_oracion: formData.get('minutos_oracion'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { nombre_libro, fecha_inicio, minutos_oracion } = validatedFields.data
  const libro = LIBROS_BIBLIA.find(b => b.nombre === nombre_libro)

  if (!libro) {
    return { errors: { nombre_libro: ['Libro no válido.'] } }
  }

  let currentDate = new Date(fecha_inicio)
  const capitulosDiarios = []
  // Normalizar fecha a UTC para evitar problemas de zona horaria
  currentDate = new Date(currentDate.valueOf() + currentDate.getTimezoneOffset() * 60 * 1000)

  for (let i = 1; i <= libro.capitulos; i++) {
    // Si la fecha de inicio es domingo, empezamos el lunes
    if (i === 1 && currentDate.getUTCDay() === 0) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }
    // Omitir domingos
    if (currentDate.getUTCDay() === 0) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }
    
    capitulosDiarios.push({
      fecha_lectura: currentDate.toISOString().split('T')[0],
      referencia_capitulo: `${libro.nombre} ${i}`,
    })
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  }

  const fecha_fin = capitulosDiarios[capitulosDiarios.length - 1].fecha_lectura
  
  const supabase = await createClient()
  const { error } = await supabase.rpc('crear_plan_con_capitulos', {
    nombre_libro_param: nombre_libro,
    fecha_inicio_param: new Date(fecha_inicio).toISOString(),
    fecha_fin_param: new Date(fecha_fin).toISOString(),
    minutos_oracion_requeridos_param: minutos_oracion,
    capitulos_param: capitulosDiarios,
  })

  if (error) {
    console.error('Error al crear el plan:', error)
    return { errors: { _form: ['Hubo un error al guardar el plan. Por favor, inténtalo de nuevo.'] } }
  }

  revalidatePath('/admin/planes')
  return { message: `¡Plan para ${nombre_libro} creado y guardado exitosamente!` }
}

export async function programarPlanSiguienteAction(planId: number) {
  const supabase = await createClient()
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
