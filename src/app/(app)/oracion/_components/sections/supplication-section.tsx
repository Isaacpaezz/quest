'use client'

import { Heart } from 'lucide-react'

const CATEGORIA_BADGE: Record<string, { emoji: string; label: string }> = {
  salud: { emoji: '🏥', label: 'Salud' },
  familia: { emoji: '👨‍👩‍👧‍👦', label: 'Familia' },
  trabajo: { emoji: '💼', label: 'Trabajo' },
  espiritual: { emoji: '✝️', label: 'Espiritual' },
  urgente: { emoji: '🚨', label: 'Urgente' },
  otro: { emoji: '📌', label: 'Otro' },
}

type Petition = {
  id: string
  titulo: string
  descripcion: string | null
  categoria: string
  oraciones_count: number
}

type Props = {
  sectionElapsed: number
  petitions: Petition[]
}

/**
 * Supplication section: blue gradient, displays the user's own petitions.
 * Each petition shows title, category badge, and prayer count.
 * Pure display — no persistence or callbacks.
 */
export function SupplicationSection({ sectionElapsed, petitions }: Props) {
  // Rotate highlighted petition every 20 seconds
  const highlightIndex = petitions.length > 0
    ? Math.floor(sectionElapsed / 20) % petitions.length
    : -1

  return (
    <div className="section-bg-supplication flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-8">
      {/* Section icon */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'var(--section-supplication-accent)', opacity: 0.15 }}
      >
        <Heart
          className="h-7 w-7"
          style={{ color: 'var(--section-supplication-accent)' }}
        />
      </div>

      {/* Section title */}
      <h2
        className="text-center text-xl font-semibold leading-tight"
        style={{ color: 'var(--section-supplication-accent)' }}
      >
        Suplica personal
      </h2>

      {/* Petitions list */}
      {petitions.length === 0 ? (
        <p
          className="max-w-xs text-center text-base font-medium leading-relaxed"
          style={{ color: 'hsl(var(--foreground) / 0.60)' }}
        >
          Presenta tus peticiones personales ante Dios
        </p>
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-2.5 overflow-y-auto overscroll-contain">
          {petitions.map((petition, i) => {
            const badge = CATEGORIA_BADGE[petition.categoria]
            const isHighlighted = i === highlightIndex

            return (
              <div
                key={petition.id}
                className="rounded-xl border px-4 py-3 transition-all duration-300"
                style={{
                  background: isHighlighted
                    ? 'hsl(var(--foreground) / 0.06)'
                    : 'hsl(var(--foreground) / 0.03)',
                  borderColor: isHighlighted
                    ? 'var(--section-supplication-accent)'
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
                    {petition.descripcion && (
                      <p
                        className="mt-0.5 line-clamp-1 text-xs"
                        style={{ color: 'hsl(var(--foreground) / 0.50)' }}
                      >
                        {petition.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {badge && (
                      <span className="text-[11px]" style={{ color: 'hsl(var(--foreground) / 0.45)' }}>
                        {badge.emoji}
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
            )
          })}
        </div>
      )}
    </div>
  )
}
