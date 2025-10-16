'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ReadingProgressSchema = z.object({
  resumen: z.string().min(10, 'El resumen debe tener al menos 10 caracteres.'),
  capituloId: z.coerce.number(),
})

const OracionProgressSchema = z.object({
  segundosAcumulados: z.coerce.number().min(0),
  capituloId: z.coerce.number(),
  oracionCompletada: z.boolean(),
});

export async function registrarProgresoLecturaAction(prevState: any, formData: FormData) {
  // --- INICIO DE LA CORRECCIÓN ---
  // Se crea el cliente de Supabase de la forma correcta para una Server Action
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
  // --- FIN DE LA CORRECCIÓN ---

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debes iniciar sesión para registrar tu progreso.' }
  }

  const validatedFields = ReadingProgressSchema.safeParse({
    resumen: formData.get('resumen'),
    capituloId: formData.get('capituloId'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }
  
  const { resumen, capituloId } = validatedFields.data
  const fechaHoy = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('progreso_usuario').upsert({
    usuario_id: user.id,
    fecha_progreso: fechaHoy,
    capitulo_id: capituloId,
    resumen_lectura: resumen,
    lectura_completada: true,
  }, {
    onConflict: 'usuario_id,fecha_progreso'
  })

  if (error) {
    console.error('Error al guardar el progreso de lectura:', error)
    return { error: 'Hubo un error en la base de datos. Inténtalo de nuevo.' }
  }

  revalidatePath('/sustento-diario')
  return { message: '¡Tu resumen ha sido guardado exitosamente!' }
}

export async function actualizarProgresoOracionAction(datos: { segundosAcumulados: number, capituloId: number, oracionCompletada: boolean }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const validatedFields = OracionProgressSchema.safeParse(datos);
  if (!validatedFields.success) return { error: 'Datos inválidos.' };
  
  const { segundosAcumulados, capituloId, oracionCompletada } = validatedFields.data;
  const fechaHoy = new Date().toISOString().split('T')[0];

  const { error } = await supabase.from('progreso_usuario').upsert({
    usuario_id: user.id,
    fecha_progreso: fechaHoy,
    capitulo_id: capituloId,
    segundos_oracion_acumulados: segundosAcumulados,
    oracion_completada: oracionCompletada,
  }, { onConflict: 'usuario_id,fecha_progreso' });

  if (error) {
    console.error('Error al guardar progreso de oración:', error);
    return { error: 'Error en la base de datos.' };
  }

  revalidatePath('/sustento-diario');
  return { message: 'Progreso guardado.' };
}
