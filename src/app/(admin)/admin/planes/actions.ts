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

  for (let i = 1; i <= libro.capitulos; i++) {
    // Si la fecha de inicio es domingo, empezamos el lunes
    if (i === 1 && currentDate.getUTCDay() === 0) {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    // Omitir domingos
    if (currentDate.getUTCDay() === 0) {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    capitulosDiarios.push({
      fecha_lectura: currentDate.toISOString().split('T')[0],
      referencia_capitulo: `${libro.nombre} ${i}`,
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const fecha_fin = capitulosDiarios[capitulosDiarios.length - 1].fecha_lectura
  
  // Lógica de Supabase (simulada por ahora, pero la estructura es esta)
  // const supabase = createClient()
  // const { error } = await supabase.rpc('crear_plan_con_capitulos', { ... })

  console.log('--- Plan a Crear ---')
  console.log({ nombre_libro, fecha_inicio, fecha_fin, minutos_oracion })
  console.log(`${capitulosDiarios.length} capítulos generados.`)

  revalidatePath('/admin/planes')
  return { message: `¡Plan para ${nombre_libro} generado exitosamente!` }
}
