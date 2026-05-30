'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FeedActivity } from '../types'
import { formatDateInTimezone } from '@/lib/utils'

interface UseRealtimeFeedOptions {
  memberIds: string[]
  timezone: string
  grupoId?: string | null
}

/**
 * Hook que suscribe al feed a cambios en tiempo real via Supabase Realtime.
 * Cuando un miembro del grupo completa lectura/oración, la actividad aparece
 * instantáneamente sin recargar la página.
 */
export function useRealtimeFeed(
  initialGroupedActivities: Record<string, FeedActivity[]>,
  options: UseRealtimeFeedOptions
) {
  const [groupedActivities, setGroupedActivities] = useState(initialGroupedActivities)
  const [newCount, setNewCount] = useState(0)

  // Flatten to track total count for dedup
  const memberSet = new Set(options.memberIds)

  const addActivity = useCallback((newActivity: FeedActivity) => {
    setGroupedActivities(prev => {
      const activityDate = new Date(newActivity.creado_en)
      const dateKey = formatDateInTimezone(activityDate, options.timezone)

      const updated = { ...prev }
      if (!updated[dateKey]) {
        updated[dateKey] = []
      }

      // Dedup: check if this activity already exists
      const exists = updated[dateKey].some(a => a.id === newActivity.id)
      if (exists) return prev

      // Prepend new activity to the date group
      updated[dateKey] = [newActivity, ...updated[dateKey]]

      // Sort date keys so most recent is first
      const sorted: Record<string, FeedActivity[]> = {}
      Object.keys(updated)
        .sort((a, b) => b.localeCompare(a))
        .forEach(key => { sorted[key] = updated[key] })

      return sorted
    })

    setNewCount(c => c + 1)
  }, [options.timezone])

  const updateActivity = useCallback((id: number, updates: Partial<FeedActivity>) => {
    setGroupedActivities(prev => {
      const updated = { ...prev }
      for (const dateKey of Object.keys(updated)) {
        const idx = updated[dateKey].findIndex(a => a.id === id)
        if (idx !== -1) {
          updated[dateKey] = [...updated[dateKey]]
          updated[dateKey][idx] = { ...updated[dateKey][idx], ...updates }
          return updated
        }
      }
      return prev
    })
  }, [])

  const removeActivity = useCallback((id: number) => {
    setGroupedActivities(prev => {
      let changed = false
      const updated: Record<string, FeedActivity[]> = {}

      for (const dateKey of Object.keys(prev)) {
        const filtered = prev[dateKey].filter(a => a.id !== id)
        if (filtered.length !== prev[dateKey].length) changed = true
        if (filtered.length > 0) updated[dateKey] = filtered
      }

      return changed ? updated : prev
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('feed-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'actividad_comunidad',
          ...(options.grupoId ? { filter: `grupo_id=eq.${options.grupoId}` } : {}),
        },
        async (payload) => {
          const newRow = payload.new as Record<string, unknown>

          // Only process if it's from a group member
          if (!memberSet.has(newRow.usuario_id as string)) return

          // Fetch the profile name for this user
          const { data: perfil } = await supabase
            .from('perfiles')
            .select('nombre_usuario')
            .eq('id', newRow.usuario_id as string)
            .single()

          const activity: FeedActivity = {
            id: newRow.id as number,
            creado_en: newRow.creado_en as string,
            tipo_actividad: newRow.tipo_actividad as FeedActivity['tipo_actividad'],
            referencia_contenido: (newRow.referencia_contenido as string) || null,
            resumen_actividad: (newRow.resumen_actividad as string) || null,
            likes_count: 0,
            comentarios_count: 0,
            usuario_id: newRow.usuario_id as string,
            perfiles: perfil ? { nombre_usuario: perfil.nombre_usuario } : null,
          }

          addActivity(activity)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'actividad_comunidad',
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>
          const id = updated.id as number

          // If the row no longer belongs to this group (e.g. petition made
          // private/archived), remove it from already-open feed clients so
          // stale private metadata is not displayed until reload.
          if (options.grupoId && updated.grupo_id !== options.grupoId) {
            removeActivity(id)
            return
          }

          updateActivity(id, {
            tipo_actividad: updated.tipo_actividad as FeedActivity['tipo_actividad'],
            referencia_contenido: (updated.referencia_contenido as string) || null,
            resumen_actividad: (updated.resumen_actividad as string) || null,
            likes_count: (updated.likes_count as number) ?? 0,
            comentarios_count: (updated.comentarios_count as number) ?? 0,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.grupoId]) // Re-subscribe if grupoId changes

  return { groupedActivities, newCount }
}
