'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Heart } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/shared/empty-state'
import { PeticionCard } from './peticion-card'
import type { Tables } from '@/types/database'

// ─── Types ───────────────────────────────────────────────────────────────────

type Peticion = Tables<'peticiones_oracion'>

interface MuroPersonalClientProps {
  peticiones: Peticion[]
}

type FiltroEstado = 'todas' | 'activa' | 'respondida' | 'archivada'

// ─── Component ───────────────────────────────────────────────────────────────

export function MuroPersonalClient({ peticiones: initialPeticiones }: MuroPersonalClientProps) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<FiltroEstado>('todas')

  // Filter petitions
  const peticionesFiltradas = filtro === 'todas'
    ? initialPeticiones
    : initialPeticiones.filter((p) => p.estado === filtro)

  // Count by estado
  const counts = {
    todas: initialPeticiones.length,
    activa: initialPeticiones.filter((p) => p.estado === 'activa').length,
    respondida: initialPeticiones.filter((p) => p.estado === 'respondida').length,
    archivada: initialPeticiones.filter((p) => p.estado === 'archivada').length,
  }

  // ─── Styles ──────────────────────────────────────────────────────────────
  const textClr = 'hsl(var(--foreground))'
  const subClr = 'hsl(var(--muted-foreground))'
  const borderClr = 'hsl(var(--border))'
  const activeBg = 'hsl(var(--primary))'
  const activeText = '#FFFFFF'
  const inactiveBg = 'hsl(var(--muted))'

  const FILTROS: { value: FiltroEstado; label: string }[] = [
    { value: 'todas', label: `Todas (${counts.todas})` },
    { value: 'activa', label: `Activas (${counts.activa})` },
    { value: 'respondida', label: `Respondidas (${counts.respondida})` },
    { value: 'archivada', label: `Archivadas (${counts.archivada})` },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-sans font-medium transition-colors"
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
          Icon={Heart}
          title={
            filtro === 'todas'
              ? 'No tenés peticiones aún'
              : filtro === 'activa'
                ? 'Sin peticiones activas'
                : filtro === 'respondida'
                  ? 'Sin peticiones respondidas'
                  : 'Sin peticiones archivadas'
          }
          description={
            filtro === 'todas'
              ? 'Creá tu primera petición para compartir con tu comunidad'
              : 'Las peticiones con este estado aparecerán aquí'
          }
        >
          {filtro === 'todas' && (
            <Link
              href="/peticiones/nueva"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-sans font-medium transition-colors"
              style={{
                backgroundColor: activeBg,
                color: activeText,
              }}
            >
              <Plus className="size-4" />
              Crear Petición
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {peticionesFiltradas.map((peticion) => (
            <PeticionCard
              key={peticion.id}
              peticion={peticion}
              isOwner={true}
              onEdit={(id) => router.push(`/peticiones/${id}/editar`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
