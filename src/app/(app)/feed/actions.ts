'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Toggle Like Action
 * Agrega o elimina un like de una actividad
 */
export async function toggleLikeAction(activityId: number, currentStatus: boolean) {
  try {
    const supabase = await createClient()
    
    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    if (currentStatus) {
      // Usuario ya tiene like -> ELIMINAR
      const { error } = await supabase
        .from('comunidad_likes')
        .delete()
        .eq('actividad_id', activityId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error eliminando like:', error)
        return { success: false, error: 'Error al eliminar like' }
      }
    } else {
      // Usuario no tiene like -> AGREGAR
      const { error } = await supabase
        .from('comunidad_likes')
        .insert({
          actividad_id: activityId,
          user_id: user.id
        })

      if (error) {
        console.error('Error agregando like:', error)
        return { success: false, error: 'Error al agregar like' }
      }
    }

    // Revalidar el feed para mostrar los cambios
    revalidatePath('/feed')
    
    return { success: true }
  } catch (error) {
    console.error('Error en toggleLikeAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Post Comment Action
 * Publica un nuevo comentario en una actividad
 */
export async function postCommentAction(activityId: number, content: string) {
  try {
    const supabase = await createClient()
    
    // Validar contenido
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return { success: false, error: 'El comentario no puede estar vacío' }
    }

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Insertar comentario
    const { data: comment, error } = await supabase
      .from('comunidad_comentarios')
      .insert({
        actividad_id: activityId,
        user_id: user.id,
        contenido: trimmedContent
      })
      .select(`
        id,
        contenido,
        created_at,
        perfiles:user_id (
          id,
          nombre_usuario
        )
      `)
      .single()

    if (error) {
      console.error('Error publicando comentario:', error)
      return { success: false, error: 'Error al publicar comentario' }
    }

    // Revalidar el feed
    revalidatePath('/feed')
    
    return { 
      success: true, 
      comment: {
        id: comment.id,
        contenido: comment.contenido,
        created_at: comment.created_at,
        user: (() => {
          const perfiles = (comment as Record<string, unknown>)['perfiles']
          if (!perfiles) return { id: '', nombre_usuario: '' }
          if (Array.isArray(perfiles)) {
            const first = perfiles[0] as Record<string, unknown> | undefined
            return { id: (first?.['id'] as string | undefined) ?? '', nombre_usuario: (first?.['nombre_usuario'] as string | undefined) ?? '' }
          }
          const p = perfiles as Record<string, unknown>
          return { id: (p['id'] as string | undefined) ?? '', nombre_usuario: (p['nombre_usuario'] as string | undefined) ?? '' }
        })()
      }
    }
  } catch (error) {
    console.error('Error en postCommentAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Get Comments Action
 * Obtiene todos los comentarios de una actividad
 */
export async function getCommentsAction(activityId: number) {
  try {
    const supabase = await createClient()

    const { data: comments, error } = await supabase
      .from('comunidad_comentarios')
      .select(`
        id,
        contenido,
        created_at,
        perfiles:user_id (
          id,
          nombre_usuario
        )
      `)
      .eq('actividad_id', activityId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo comentarios:', error)
      return { success: false, error: 'Error al cargar comentarios', comments: [] }
    }

    // Transformar datos para el frontend
    const formattedComments = comments.map(comment => {
      const perfiles = (comment as Record<string, unknown>)['perfiles']
      let userId: string | undefined
      let nombreUsuario: string | undefined
      if (perfiles) {
        if (Array.isArray(perfiles)) {
          const first = perfiles[0] as Record<string, unknown> | undefined
          userId = first?.['id'] as string | undefined
          nombreUsuario = first?.['nombre_usuario'] as string | undefined
        } else {
          const p = perfiles as Record<string, unknown>
          userId = p['id'] as string | undefined
          nombreUsuario = p['nombre_usuario'] as string | undefined
        }
      }

      return {
        id: comment.id,
        contenido: comment.contenido,
        created_at: comment.created_at,
        user: {
          id: userId ?? '',
          nombre_usuario: nombreUsuario ?? ''
        }
      }
    })

    return { 
      success: true, 
      comments: formattedComments 
    }
  } catch (error) {
    console.error('Error en getCommentsAction:', error)
    return { success: false, error: 'Error inesperado', comments: [] }
  }
}

/**
 * Delete Comment Action
 * Elimina un comentario (solo el autor o dueño de la actividad)
 */
export async function deleteCommentAction(commentId: string) {
  try {
    const supabase = await createClient()
    
    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Eliminar comentario (RLS policy se encarga de validar permisos)
    const { error } = await supabase
      .from('comunidad_comentarios')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error eliminando comentario:', error)
      return { success: false, error: 'Error al eliminar comentario' }
    }

    // Revalidar el feed
    revalidatePath('/feed')
    
    return { success: true }
  } catch (error) {
    console.error('Error en deleteCommentAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
