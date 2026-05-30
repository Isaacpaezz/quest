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

// ─── Intercession Actions ─────────────────────────────────────────────────────

/**
 * orarPorPeticionAction
 * Registra que el usuario oró por una petición.
 * - INSERT en oraciones_por_peticion (UNIQUE constraint previene duplicados)
 * - Trigger incrementa oraciones_count automáticamente
 * - Otorga XP de intercesión (con cap diario)
 * - Envía push notification al autor de la petición
 * - Crea entrada en actividad_comunidad si la petición es respondida
 */
export async function orarPorPeticionAction(peticionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Verify petition exists and is active
    const { data: peticion } = await supabase
      .from('peticiones_oracion')
      .select('id, usuario_id, titulo, estado, grupo_id, visibilidad')
      .eq('id', peticionId)
      .single()

    if (!peticion || peticion.estado !== 'activa') {
      return { success: false, error: 'Petición no encontrada o no activa' }
    }

    // Check if user already prayed (lifetime uniqueness)
    const { data: existing } = await supabase
      .from('oraciones_por_peticion')
      .select('id')
      .eq('peticion_id', peticionId)
      .eq('usuario_id', user.id)
      .single()

    if (existing) {
      return { success: false, error: 'Ya oraste por esta petición' }
    }

    // Insert intercession record (trigger increments oraciones_count)
    const { error: insertError } = await supabase
      .from('oraciones_por_peticion')
      .insert({
        peticion_id: peticionId,
        usuario_id: user.id,
      })

    if (insertError) {
      // Unique constraint violation = duplicate prayer
      if (insertError.code === '23505') {
        return { success: false, error: 'Ya oraste por esta petición' }
      }
      console.error('Error registrando intercesión:', insertError)
      return { success: false, error: 'Error al registrar la oración' }
    }

    // Grant XP (only for praying for others' petitions)
    const isSelfIntercession = peticion.usuario_id === user.id
    if (!isSelfIntercession) {
      try {
        const { getXpConfig, grantXp } = await import('@/lib/xp-helpers')
        const xpConfig = await getXpConfig(supabase, user.id)
        await grantXp(
          supabase,
          user.id,
          xpConfig.intercesion,
          'intercesion',
          peticionId,
          peticion.grupo_id || undefined
        )
      } catch (xpErr) {
        // Don't fail the prayer if XP fails
        console.error('Error otorgando XP por intercesión:', xpErr)
      }
    }

    // Send push notification to petition author
    if (!isSelfIntercession && peticion.grupo_id) {
      try {
        // Get the pray-er's name
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('nombre_usuario')
          .eq('id', user.id)
          .single()

        const nombre = perfil?.nombre_usuario || 'Alguien'

        // Send notification only to petition author
        const { notifyGroupMembers } = await import('@/lib/push-helpers')
        await notifyGroupMembers(
          peticion.grupo_id,
          {
            title: 'Oraron por tu petición',
            body: `${nombre} oró por tu petición: ${peticion.titulo}`,
          },
          user.id
        )
      } catch (notifErr) {
        // Don't fail the prayer if notification fails
        console.error('Error enviando notificación de intercesión:', notifErr)
      }
    }

    revalidatePath('/peticiones')
    revalidatePath(`/peticiones/${peticionId}`)
    revalidatePath('/feed')

    return { success: true }
  } catch (error) {
    console.error('Error en orarPorPeticionAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * hasUserPrayedAction
 * Verifica si el usuario ya oró por una petición específica.
 */
export async function hasUserPrayedAction(peticionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, prayed: false }
    }

    const { data } = await supabase
      .from('oraciones_por_peticion')
      .select('id')
      .eq('peticion_id', peticionId)
      .eq('usuario_id', user.id)
      .single()

    return { success: true, prayed: !!data }
  } catch {
    return { success: true, prayed: false }
  }
}

/**
 * getCommunityWallAction
 * Obtiene peticiones visibles para el grupo del usuario.
 * Orden: urgentes primero, luego más recientes, luego menos oradas.
 */
export async function getCommunityWallAction() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado', peticiones: [] }
    }

    // Get user's active group
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('grupo_activo_id')
      .eq('id', user.id)
      .single()

    if (!perfil?.grupo_activo_id) {
      return { success: true, peticiones: [] }
    }

    // Fetch group-visible active petitions
    const { data: peticiones, error } = await supabase
      .from('peticiones_oracion')
      .select('*, perfiles:usuario_id(nombre_usuario)')
      .eq('grupo_id', perfil.grupo_activo_id)
      .eq('visibilidad', 'group')
      .eq('estado', 'activa')
      .order('categoria', { ascending: false }) // urgente sorts first alphabetically? No...
      .order('creado_en', { ascending: false })

    if (error) {
      console.error('Error obteniendo muro comunitario:', error)
      return { success: false, error: 'Error al cargar peticiones', peticiones: [] }
    }

    // Sort: urgente first, then by oraciones_count ascending (least prayed), then by date
    const sorted = (peticiones || []).sort((a, b) => {
      // Urgente category first
      const aUrgente = a.categoria === 'urgente' ? 0 : 1
      const bUrgente = b.categoria === 'urgente' ? 0 : 1
      if (aUrgente !== bUrgente) return aUrgente - bUrgente

      // Then least prayed-for first
      if (a.oraciones_count !== b.oraciones_count) {
        return a.oraciones_count - b.oraciones_count
      }

      // Then most recent first
      return new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
    })

    // Check which petitions the current user has prayed for
    const peticionIds = sorted.map(p => p.id)
    const { data: userPrayers } = await supabase
      .from('oraciones_por_peticion')
      .select('peticion_id')
      .eq('usuario_id', user.id)
      .in('peticion_id', peticionIds)

    const prayedSet = new Set((userPrayers || []).map(p => p.peticion_id))

    // Add author info and prayer status
    const enriched = sorted.map(p => {
      const perfiles = p.perfiles as { nombre_usuario: string } | { nombre_usuario: string }[] | null
      const authorName = Array.isArray(perfiles)
        ? perfiles[0]?.nombre_usuario || 'Usuario'
        : perfiles?.nombre_usuario || 'Usuario'

      return {
        ...p,
        author_name: authorName,
        ya_oro: prayedSet.has(p.id),
      }
    })

    return { success: true, peticiones: enriched }
  } catch (error) {
    console.error('Error en getCommunityWallAction:', error)
    return { success: false, error: 'Error inesperado', peticiones: [] }
  }
}

// ─── Update Actions ──────────────────────────────────────────────────────────

const crearActualizacionSchema = z.object({
  tipo: z.enum(['progreso', 'resuelto', 'testimonio']),
  texto: z
    .string()
    .min(1, 'El texto es requerido')
    .max(300, 'El texto no puede exceder 300 caracteres'),
  testimonio_texto: z
    .string()
    .max(1000, 'El testimonio no puede exceder 1000 caracteres')
    .optional()
    .nullable(),
  testimonio_publico: z.boolean().default(false),
})

/**
 * crearActualizacionPeticionAction
 * Crea una actualización en la timeline de una petición.
 * Si tipo es 'resuelto', marca la petición como respondida.
 */
export async function crearActualizacionPeticionAction(
  peticionId: string,
  data: z.infer<typeof crearActualizacionSchema>
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    const parsed = crearActualizacionSchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return { success: false, error: firstError?.message ?? 'Datos inválidos' }
    }

    // Verify ownership
    const { data: peticion } = await supabase
      .from('peticiones_oracion')
      .select('id, usuario_id, estado, grupo_id, titulo')
      .eq('id', peticionId)
      .single()

    if (!peticion || peticion.usuario_id !== user.id) {
      return { success: false, error: 'No tenés permiso para actualizar esta petición' }
    }

    if (peticion.estado !== 'activa') {
      return { success: false, error: 'Solo se pueden actualizar peticiones activas' }
    }

    const { tipo, texto, testimonio_texto, testimonio_publico } = parsed.data

    // Insert update record
    const { error: insertError } = await supabase
      .from('actualizaciones_peticion')
      .insert({
        peticion_id: peticionId,
        usuario_id: user.id,
        tipo,
        texto,
        testimonio_texto: testimonio_texto || null,
        testimonio_publico: testimonio_publico ?? false,
      })

    if (insertError) {
      console.error('Error creando actualización:', insertError)
      return { success: false, error: 'Error al crear la actualización' }
    }

    // If resolved, update petition state
    if (tipo === 'resuelto') {
      const { error: updateError } = await supabase
        .from('peticiones_oracion')
        .update({
          estado: 'respondida',
          respondida_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', peticionId)

      if (updateError) {
        console.error('Error marcando petición como respondida:', updateError)
      }

      // Create feed entry if testimony is public
      if (testimonio_publico && peticion.grupo_id) {
        await supabase.from('actividad_comunidad').insert({
          usuario_id: user.id,
          tipo_actividad: 'peticion_respondida',
          referencia_contenido: peticionId,
          resumen_actividad: testimonio_texto || texto,
          grupo_id: peticion.grupo_id,
        })
      }

      // Notify intercessors that the petition was answered
      if (peticion.grupo_id) {
        try {
          const { data: intercessors } = await supabase
            .from('oraciones_por_peticion')
            .select('usuario_id')
            .eq('peticion_id', peticionId)
            .neq('usuario_id', user.id)

          if (intercessors?.length) {
            const { notifyGroupMembers } = await import('@/lib/push-helpers')
            await notifyGroupMembers(
              peticion.grupo_id,
              {
                title: '¡Petición respondida! 🙏',
                body: `Una petición por la que oraste fue respondida: ${peticion.titulo}`,
              },
              user.id
            )
          }
        } catch (notifErr) {
          console.error('Error notificando respuesta de petición:', notifErr)
        }
      }

      // Grant testimony XP if applicable
      if (testimonio_texto) {
        try {
          const { getXpConfig, grantXp } = await import('@/lib/xp-helpers')
          const xpConfig = await getXpConfig(supabase, user.id)
          await grantXp(
            supabase,
            user.id,
            xpConfig.testimonio,
            'testimonio',
            peticionId,
            peticion.grupo_id || undefined
          )
        } catch (xpErr) {
          console.error('Error otorgando XP por testimonio:', xpErr)
        }
      }
    }

    revalidatePath('/peticiones')
    revalidatePath(`/peticiones/${peticionId}`)
    revalidatePath('/feed')

    return { success: true }
  } catch (error) {
    console.error('Error en crearActualizacionPeticionAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * getPetitionUpdatesAction
 * Obtiene la timeline de actualizaciones de una petición.
 */
export async function getPetitionUpdatesAction(peticionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado', updates: [] }
    }

    const { data: updates, error } = await supabase
      .from('actualizaciones_peticion')
      .select('*')
      .eq('peticion_id', peticionId)
      .order('creado_en', { ascending: true })

    if (error) {
      console.error('Error obteniendo actualizaciones:', error)
      return { success: false, error: 'Error al cargar actualizaciones', updates: [] }
    }

    return { success: true, updates: updates || [] }
  } catch (error) {
    console.error('Error en getPetitionUpdatesAction:', error)
    return { success: false, error: 'Error inesperado', updates: [] }
  }
}

// ─── Petition Detail ─────────────────────────────────────────────────────────

/**
 * getPetitionDetailAction
 * Obtiene una petición con su timeline de actualizaciones.
 */
export async function getPetitionDetailAction(peticionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado', peticion: null, updates: [] }
    }

    // Fetch petition with author info
    const { data: peticion, error: peticionError } = await supabase
      .from('peticiones_oracion')
      .select('*, perfiles:usuario_id(nombre_usuario)')
      .eq('id', peticionId)
      .single()

    if (peticionError || !peticion) {
      return { success: false, error: 'Petición no encontrada', peticion: null, updates: [] }
    }

    // Access check: owner or group member
    const isOwner = peticion.usuario_id === user.id

    if (!isOwner && peticion.visibilidad === 'group' && peticion.grupo_id) {
      const { data: membership } = await supabase
        .from('miembros_grupo')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('grupo_id', peticion.grupo_id)
        .single()

      if (!membership) {
        return { success: false, error: 'No tenés acceso a esta petición', peticion: null, updates: [] }
      }
    } else if (!isOwner && peticion.visibilidad === 'private') {
      return { success: false, error: 'No tenés acceso a esta petición', peticion: null, updates: [] }
    }

    // Fetch updates
    const { data: updates } = await supabase
      .from('actualizaciones_peticion')
      .select('*')
      .eq('peticion_id', peticionId)
      .order('creado_en', { ascending: true })

    // Check if current user has prayed
    const { data: userPrayer } = await supabase
      .from('oraciones_por_peticion')
      .select('id')
      .eq('peticion_id', peticionId)
      .eq('usuario_id', user.id)
      .single()

    // Get author name
    const perfiles = peticion.perfiles as { nombre_usuario: string } | { nombre_usuario: string }[] | null
    const authorName = Array.isArray(perfiles)
      ? perfiles[0]?.nombre_usuario || 'Usuario'
      : perfiles?.nombre_usuario || 'Usuario'

    return {
      success: true,
      peticion: {
        ...peticion,
        author_name: authorName,
        is_owner: isOwner,
        ya_oro: !!userPrayer,
      },
      updates: updates || [],
    }
  } catch (error) {
    console.error('Error en getPetitionDetailAction:', error)
    return { success: false, error: 'Error inesperado', peticion: null, updates: [] }
  }
}

// ─── Existing Actions ────────────────────────────────────────────────────────

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
