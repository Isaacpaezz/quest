import type { Tables } from '@/types/database'

/**
 * Activity row with joined profile (from Supabase select with perfiles relation).
 * Used by FeedClient, ActivityItem, and ActivityCard components.
 */
export type FeedActivity = Pick<
  Tables<'actividad_comunidad'>,
  | 'id'
  | 'creado_en'
  | 'tipo_actividad'
  | 'referencia_contenido'
  | 'resumen_actividad'
  | 'likes_count'
  | 'comentarios_count'
  | 'usuario_id'
> & {
  perfiles: { nombre_usuario: string } | { nombre_usuario: string }[] | null
}
