'use client'

import { useState, useCallback } from 'react'
import { Users, Check } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIA_BADGE: Record<string, { emoji: string; label: string }> = {
  salud: { emoji: '🏥', label: 'Salud' },
  familia: { emoji: '👨‍👩‍👧‍👦', label: 'Familia' },
  trabajo: { emoji: '💼', label: 'Trabajo' },
  espiritual: { emoji: '✝️', label: 'Espiritual' },
  urgente: { emoji: '🚨', label: 'Urgente' },
  otro: { emoji: '📌', label: 'Otro' },
}

type CommunityPetition = {
  id: string
  titulo: string
  descripcion: string | null
  categoria: string
  usuario_nombre: string
  oraciones_count: number
}

type Props = {
  sectionElapsed: number
  petitions: CommunityPetition[]
  intercededIds: Set<string>
  onIntercede: (petitionId: string) => void
}

/**
 * Intercession section: orange gradient, displays community petitions with
 * requester identity. "Oré" tap button per petition reuses the existing
 * intercession pattern. Tracks interceded IDs via parent callback.
 */
export function IntercessionSection({
  sectionElapsed,
  petitions,
  intercededIds,
  onIntercede,
}: Props) {
  // Rotate highlighted petition every 20 seconds
  const highlightIndex = petitions.length > 0
    ? Math.floor(sectionElapsed / 20) % petitions.length
    : -1

  const handleOreTap = useCallback((petitionId: string) => {
    if (intercededIds.has(petitionId)) return
    onIntercede(petitionId)
    toast.success('Oración registrada 🙏', { duration: 1500 })
  }, [intercededIds, onIntercede])

  return (
    <div className="section-bg-intercession flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-8">
      {/* Section icon */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'var(--section-intercession-accent)', opacity: 0.15 }}
      >
        <Users
          className="h-7 w-7"
          style={{ color: 'var(--section-intercession-accent)' }}
        />
      </div>

      {/* Section title */}
      <h2
        className="text-center text-xl font-semibold leading-tight"
        style={{ color: 'var(--section-intercession-accent)' }}
      >
        Intercesión comunitaria
      </h2>

      {/* Community petitions */}
      {petitions.length === 0 ? (
        <p
          className="max-w-xs text-center text-base font-medium leading-relaxed"
          style={{ color: 'hsl(var(--foreground) / 0.60)' }}
        >
          No hay peticiones comunitarias en este momento
        </p>
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-2.5 overflow-y-auto overscroll-contain">
          {petitions.map((petition, i) => {
            const badge = CATEGORIA_BADGE[petition.categoria]
            const isHighlighted = i === highlightIndex
            const hasPrayed = intercededIds.has(petition.id)

            return (
              <div
                key={petition.id}
                className="rounded-xl border px-4 py-3 transition-all duration-300"
                style={{
                  background: isHighlighted
                    ? 'hsl(var(--foreground) / 0.06)'
                    : 'hsl(var(--foreground) / 0.03)',
                  borderColor: isHighlighted
                    ? 'var(--section-intercession-accent)'
                    : 'hsl(var(--border) / 0.3)',
                  borderWidth: isHighlighted ? '1.5px' : '1px',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: 'hsl(var(--foreground) / 0.85)' }}
                    >
                      {petition.titulo}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: 'var(--section-intercession-accent)', opacity: 0.8 }}
                      >
                        {petition.usuario_nombre}
                      </span>
                      {badge && (
                        <span className="text-[11px]" style={{ color: 'hsl(var(--foreground) / 0.45)' }}>
                          {badge.emoji} {badge.label}
                        </span>
                      )}
                      {petition.oraciones_count > 0 && (
                        <span className="text-[11px]" style={{ color: 'hsl(var(--foreground) / 0.45)' }}>
                          🙏 {petition.oraciones_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* "Oré" button */}
                <button
                  onClick={() => handleOreTap(petition.id)}
                  disabled={hasPrayed}
                  className="mt-2.5 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold active:scale-95 disabled:opacity-60 transition-all"
                  style={{
                    background: hasPrayed
                      ? 'hsl(var(--muted))'
                      : 'var(--section-intercession-accent)',
                    color: hasPrayed
                      ? 'hsl(var(--muted-foreground))'
                      : '#111318',
                  }}
                >
                  {hasPrayed ? (
                    <>
                      <Check className="h-4 w-4" />
                      Oraste por {petition.usuario_nombre}
                    </>
                  ) : (
                    <>Oré 🙏</>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Intercession counter */}
      {petitions.length > 0 && (
        <p className="text-[11px]" style={{ color: 'hsl(var(--foreground) / 0.40)' }}>
          {intercededIds.size} de {petitions.length} peticiones oradas
        </p>
      )}
    </div>
  )
}
