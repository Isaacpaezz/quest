'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

type Peticion = Tables<'peticiones_oracion'>

export interface CommunityPeticion extends Peticion {
  author_name: string
  ya_oro: boolean
}

interface UseRealtimePeticionesOptions {
  grupoId: string
}

/**
 * Hook que suscribe el muro comunitario a nuevas peticiones en tiempo real.
 */
export function useRealtimePeticiones(
  initialPeticiones: CommunityPeticion[],
  options: UseRealtimePeticionesOptions
) {
  const [peticiones, setPeticiones] = useState(initialPeticiones)

  const addPeticion = useCallback((newPeticion: CommunityPeticion) => {
    setPeticiones(prev => {
      // Dedup
      if (prev.some(p => p.id === newPeticion.id)) return prev

      // Insert with sorting: urgente first, then least prayed, then most recent
      const updated = [newPeticion, ...prev]
      return updated.sort((a, b) => {
        const aUrgente = a.categoria === 'urgente' ? 0 : 1
        const bUrgente = b.categoria === 'urgente' ? 0 : 1
        if (aUrgente !== bUrgente) return aUrgente - bUrgente
        if (a.oraciones_count !== b.oraciones_count) return a.oraciones_count - b.oraciones_count
        return new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
      })
    })
  }, [])

  const updatePeticion = useCallback((id: string, updates: Partial<CommunityPeticion>) => {
    setPeticiones(prev =>
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    )
  }, [])

  const removePeticion = useCallback((id: string) => {
    setPeticiones(prev => prev.filter(p => p.id !== id))
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('peticiones-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'peticiones_oracion',
          filter: `grupo_id=eq.${options.grupoId}`,
        },
        async (payload) => {
          const newRow = payload.new as Peticion

          // Only show group-visible active petitions
          if (newRow.visibilidad !== 'group' || newRow.estado !== 'activa') return

          // Fetch author name
          const { data: perfil } = await supabase
            .from('perfiles')
            .select('nombre_usuario')
            .eq('id', newRow.usuario_id)
            .single()

          addPeticion({
            ...newRow,
            author_name: perfil?.nombre_usuario || 'Usuario',
            ya_oro: false,
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'peticiones_oracion',
          filter: `grupo_id=eq.${options.grupoId}`,
        },
        (payload) => {
          const updated = payload.new as Peticion

          // If no longer active or visible, remove from wall
          if (updated.estado !== 'activa' || updated.visibilidad !== 'group') {
            removePeticion(updated.id)
            return
          }

          updatePeticion(updated.id, {
            oraciones_count: updated.oraciones_count,
            estado: updated.estado,
            titulo: updated.titulo,
            descripcion: updated.descripcion,
            categoria: updated.categoria,
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'oraciones_por_peticion',
        },
        (payload) => {
          const newRow = payload.new as { peticion_id: string }
          // Increment oraciones_count for the affected petition
          setPeticiones(prev =>
            prev.map(p =>
              p.id === newRow.peticion_id
                ? { ...p, oraciones_count: p.oraciones_count + 1 }
                : p
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.grupoId])

  return { peticiones, setPeticiones }
}
