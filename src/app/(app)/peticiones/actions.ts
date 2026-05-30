'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const crearPeticionSchema = z.object({
  titulo: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(120, 'El título no puede exceder 120 caracteres'),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  categoria: z.enum(['salud', 'familia', 'trabajo', 'espiritual', 'urgente', 'otro']),
  visibilidad: z.enum(['private', 'group']).default('group'),
})

const actualizarPeticionSchema = z.object({
  titulo: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(120, 'El título no puede exceder 120 caracteres')
    .optional(),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  categoria: z.enum(['salud', 'familia', 'trabajo', 'espiritual', 'urgente', 'otro']).optional(),
  visibilidad: z.enum(['private', 'group']).optional(),
})

// ─── Server Actions ──────────────────────────────────────────────────────────

/**
 * crearPeticionAction
 * Crea una nueva petición de oración.
 * Si visibilidad es 'group', el trigger set_peticion_grupo_id asigna el grupo automáticamente.
 * Si es 'group', también crea una entrada en actividad_comunidad para el feed.
 */
export async function crearPeticionAction(
  data: z.infer<typeof crearPeticionSchema>
) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Validate input
    const parsed = crearPeticionSchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return { success: false, error: firstError?.message ?? 'Datos inválidos' }
    }

    const { titulo, descripcion, categoria, visibilidad } = parsed.data

    // Check: if visibilidad is 'group', user must have an active group
    if (visibilidad === 'group') {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('grupo_activo_id')
        .eq('id', user.id)
        .single()

      if (!perfil?.grupo_activo_id) {
        return {
          success: false,
          error: 'Necesitás un grupo activo para compartir peticiones',
        }
      }
    }

    // Insert petition
    const { data: peticion, error: insertError } = await supabase
      .from('peticiones_oracion')
      .insert({
        usuario_id: user.id,
        titulo,
        descripcion: descripcion || null,
        categoria,
        visibilidad,
      })
      .select('id, grupo_id')
      .single()

    if (insertError) {
      console.error('Error creando petición:', insertError)
      return { success: false, error: 'Error al crear la petición' }
    }

    // If shared with group, create feed entry
    if (visibilidad === 'group' && peticion.grupo_id) {
      await supabase.from('actividad_comunidad').insert({
        usuario_id: user.id,
        tipo_actividad: 'peticion_compartida',
        referencia_contenido: peticion.id,
        resumen_actividad: titulo,
        grupo_id: peticion.grupo_id,
      })
    }

    revalidatePath('/peticiones')
    revalidatePath('/peticiones/mis-peticiones')
    revalidatePath('/feed')

    return { success: true, peticionId: peticion.id }
  } catch (error) {
    console.error('Error en crearPeticionAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * actualizarPeticionAction
 * Actualiza una petición existente (solo el creador).
 */
export async function actualizarPeticionAction(
  peticionId: string,
  data: z.infer<typeof actualizarPeticionSchema>
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    const parsed = actualizarPeticionSchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return { success: false, error: firstError?.message ?? 'Datos inválidos' }
    }

    // Verify ownership
    const { data: peticion } = await supabase
      .from('peticiones_oracion')
      .select('usuario_id')
      .eq('id', peticionId)
      .single()

    if (!peticion || peticion.usuario_id !== user.id) {
      return { success: false, error: 'No tenés permiso para editar esta petición' }
    }

    const updateData: Record<string, unknown> = {
      actualizado_en: new Date().toISOString(),
    }

    if (parsed.data.titulo !== undefined) updateData.titulo = parsed.data.titulo
    if (parsed.data.descripcion !== undefined) updateData.descripcion = parsed.data.descripcion
    if (parsed.data.categoria !== undefined) updateData.categoria = parsed.data.categoria
    if (parsed.data.visibilidad !== undefined) updateData.visibilidad = parsed.data.visibilidad

    const { error: updateError } = await supabase
      .from('peticiones_oracion')
      .update(updateData)
      .eq('id', peticionId)

    if (updateError) {
      console.error('Error actualizando petición:', updateError)
      return { success: false, error: 'Error al actualizar la petición' }
    }

    revalidatePath('/peticiones')
    revalidatePath('/peticiones/mis-peticiones')
    revalidatePath(`/peticiones/${peticionId}`)

    return { success: true }
  } catch (error) {
    console.error('Error en actualizarPeticionAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * eliminarPeticionAction
 * Soft-delete: cambia estado a 'archivada' (no borra datos).
 */
export async function eliminarPeticionAction(peticionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Verify ownership
    const { data: peticion } = await supabase
      .from('peticiones_oracion')
      .select('usuario_id, estado')
      .eq('id', peticionId)
      .single()

    if (!peticion || peticion.usuario_id !== user.id) {
      return { success: false, error: 'No tenés permiso para eliminar esta petición' }
    }

    if (peticion.estado === 'archivada') {
      return { success: false, error: 'La petición ya fue archivada' }
    }

    // Soft delete: mark as archived
    const { error: updateError } = await supabase
      .from('peticiones_oracion')
      .update({
        estado: 'archivada',
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', peticionId)

    if (updateError) {
      console.error('Error archivando petición:', updateError)
      return { success: false, error: 'Error al eliminar la petición' }
    }

    revalidatePath('/peticiones')
    revalidatePath('/peticiones/mis-peticiones')

    return { success: true }
  } catch (error) {
    console.error('Error en eliminarPeticionAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * getMyPetitionsAction
 * Obtiene las peticiones del usuario autenticado, con filtro opcional por estado.
 */
export async function getMyPetitionsAction(filtro?: {
  estado?: 'activa' | 'respondida' | 'archivada'
}) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado', peticiones: [] }
    }

    let query = supabase
      .from('peticiones_oracion')
      .select('*')
      .eq('usuario_id', user.id)
      .order('estado', { ascending: true }) // activa first
      .order('creado_en', { ascending: false })

    if (filtro?.estado) {
      query = query.eq('estado', filtro.estado)
    }

    const { data: peticiones, error } = await query

    if (error) {
      console.error('Error obteniendo peticiones:', error)
      return { success: false, error: 'Error al cargar peticiones', peticiones: [] }
    }

    return { success: true, peticiones: peticiones || [] }
  } catch (error) {
    console.error('Error en getMyPetitionsAction:', error)
    return { success: false, error: 'Error inesperado', peticiones: [] }
  }
}

/**
 * getPetitionAction
 * Obtiene una petición por ID (solo si el usuario tiene acceso).
 */
export async function getPetitionAction(peticionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado', peticion: null }
    }

    const { data: peticion, error } = await supabase
      .from('peticiones_oracion')
      .select('*')
      .eq('id', peticionId)
      .single()

    if (error || !peticion) {
      return { success: false, error: 'Petición no encontrada', peticion: null }
    }

    // Check access: owner or group member
    const isOwner = peticion.usuario_id === user.id

    if (!isOwner && peticion.visibilidad === 'group' && peticion.grupo_id) {
      const { data: membership } = await supabase
        .from('miembros_grupo')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('grupo_id', peticion.grupo_id)
        .single()

      if (!membership) {
        return { success: false, error: 'No tenés acceso a esta petición', peticion: null }
      }
    } else if (!isOwner && peticion.visibilidad === 'private') {
      return { success: false, error: 'No tenés acceso a esta petición', peticion: null }
    }

    return { success: true, peticion }
  } catch (error) {
    console.error('Error en getPetitionAction:', error)
    return { success: false, error: 'Error inesperado', peticion: null }
  }
}
