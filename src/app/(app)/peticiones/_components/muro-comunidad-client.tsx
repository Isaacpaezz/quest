'use client'

import { useState } from 'react'
import { Heart, HandHeart } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/shared/empty-state'
import { PeticionCard } from './peticion-card'
import { OrarPorPeticionButton } from './orar-por-peticion-button'
import { useRealtimePeticiones, type CommunityPeticion } from './use-realtime-peticiones'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MuroComunidadClientProps {
  peticiones: CommunityPeticion[]
  grupoId: string
  currentUserId: string
}

type FiltroComunidad = 'todas' | 'urgentes' | 'menos-oradas'

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * MuroComunidadClient
 * Community prayer wall with realtime updates, sorting filters,
 * and inline "Oré por esto" buttons.
 */
export function MuroComunidadClient({
  peticiones: initialPeticiones,
  grupoId,
  currentUserId,
}: MuroComunidadClientProps) {
  const { peticiones } = useRealtimePeticiones(initialPeticiones, { grupoId })
  const [filtro, setFiltro] = useState<FiltroComunidad>('todas')

  // Apply filters
  const peticionesFiltradas = (() => {
    switch (filtro) {
      case 'urgentes':
        return peticiones.filter(p => p.categoria === 'urgente')
      case 'menos-oradas':
        return [...peticiones].sort((a, b) => a.oraciones_count - b.oraciones_count)
      default:
        return peticiones
    }
  })()

  // ─── Styles ──────────────────────────────────────────────────────────────
  const subClr = 'hsl(var(--muted-foreground))'
  const activeBg = 'hsl(var(--primary))'
  const activeText = '#FFFFFF'
  const inactiveBg = 'hsl(var(--muted))'

  const FILTROS: { value: FiltroComunidad; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'urgentes', label: 'Urgentes' },
    { value: 'menos-oradas', label: 'Menos oradas' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 pb-1">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className="min-h-11 shrink-0 rounded-full px-4 text-[12px] font-sans font-medium transition-colors"
            style={{
              backgroundColor: filtro === f.value ? activeBg : inactiveBg,
              color: filtro === f.value ? activeText : subClr,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Petitions list */}
      {peticionesFiltradas.length === 0 ? (
        <EmptyState
          Icon={HandHeart}
          title="Tu comunidad aún no tiene peticiones"
          description="¡Sé el primero en compartir una petición con tu grupo!"
        >
          <Link
            href="/peticiones/nueva"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-sans font-medium transition-colors"
            style={{
              backgroundColor: activeBg,
              color: activeText,
            }}
          >
            <Heart className="size-4" />
            Crear Petición
          </Link>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {peticionesFiltradas.map((peticion) => {
            const isOwner = peticion.usuario_id === currentUserId

            return (
              <div key={peticion.id} className="flex flex-col gap-2">
                <Link href={`/peticiones/${peticion.id}`} className="block">
                  <PeticionCard
                    peticion={peticion}
                    isOwner={false}
                  />
                </Link>
                <div className="flex justify-end">
                  <OrarPorPeticionButton
                    peticionId={peticion.id}
                    initialOracionesCount={peticion.oraciones_count}
                    yaOro={peticion.ya_oro}
                    esAutor={isOwner}
                    autorNombre={peticion.author_name}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
