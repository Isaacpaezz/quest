'use client'

import { useState, useMemo } from 'react'
import { Heart, Users, Check, ChevronRight } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

export type PeticionContext = {
  id: string
  titulo: string
  descripcion: string | null
  categoria: string
  usuario_nombre?: string
  oraciones_count: number
}

type Props = {
  peticionesPropias: PeticionContext[]
  peticionesComunidad: PeticionContext[]
  tieneGrupo: boolean
  onConfirm: (selectedIds: string[]) => void
}

// ── Category badges ──────────────────────────────────────────────────────

const CATEGORIA_BADGE: Record<string, { emoji: string; label: string }> = {
  salud: { emoji: '🏥', label: 'Salud' },
  familia: { emoji: '👨‍👩‍👧‍👦', label: 'Familia' },
  trabajo: { emoji: '💼', label: 'Trabajo' },
  espiritual: { emoji: '✝️', label: 'Espiritual' },
  urgente: { emoji: '🚨', label: 'Urgente' },
  otro: { emoji: '📌', label: 'Otro' },
}

// ── Component ────────────────────────────────────────────────────────────

export function PreparacionOracion({
  peticionesPropias,
  peticionesComunidad,
  tieneGrupo,
  onConfirm,
}: Props) {
  // All community petitions selected by default ("Orar por todos")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(peticionesComunidad.map(p => p.id))
  )

  const allSelected = peticionesComunidad.length > 0 &&
    selectedIds.size === peticionesComunidad.length

  const canStart = selectedIds.size > 0 || peticionesComunidad.length === 0

  const togglePetition = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(peticionesComunidad.map(p => p.id)))
    }
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds))
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col quest-bg overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-center px-6 pt-[18px] pb-3 h-[54px]">
        <span className="text-[15px] font-semibold text-foreground">
          Preparate para orar
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-6 space-y-6">
        {/* Section A: Own Petitions */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Tus peticiones
            </h2>
            {peticionesPropias.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({peticionesPropias.length})
              </span>
            )}
          </div>

          {peticionesPropias.length === 0 ? (
            <p className="text-[13px] text-muted-foreground pl-6">
              No tenés peticiones activas
            </p>
          ) : (
            <div className="space-y-2">
              {peticionesPropias.map(p => (
                <div
                  key={p.id}
                  className="rounded-xl bg-card/50 border border-border/50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.titulo}
                      </p>
                      {p.descripcion && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {p.descripcion}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {CATEGORIA_BADGE[p.categoria]?.emoji} {CATEGORIA_BADGE[p.categoria]?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Section B: Community Petitions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Tu comunidad necesita oración
              </h2>
              {peticionesComunidad.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({peticionesComunidad.length})
                </span>
              )}
            </div>

            {/* "Orar por todos" toggle */}
            {peticionesComunidad.length > 0 && (
              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-colors"
                style={{
                  background: allSelected
                    ? 'hsl(var(--primary) / 0.15)'
                    : 'hsl(var(--muted))',
                  color: allSelected
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--muted-foreground))',
                }}
              >
                {allSelected && <Check className="h-3 w-3" />}
                Orar por todos
              </button>
            )}
          </div>

          {!tieneGrupo ? (
            <div className="rounded-xl bg-muted/30 border border-border/30 px-4 py-6 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Unite a un grupo para orar en comunidad
              </p>
            </div>
          ) : peticionesComunidad.length === 0 ? (
            <div className="rounded-xl bg-muted/30 border border-border/30 px-4 py-6 text-center">
              <Heart className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Tu comunidad aún no tiene peticiones
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {peticionesComunidad.map(p => {
                const isSelected = selectedIds.has(p.id)
                const badge = CATEGORIA_BADGE[p.categoria]

                return (
                  <button
                    key={p.id}
                    onClick={() => togglePetition(p.id)}
                    className="w-full text-left rounded-xl border px-4 py-3 transition-all"
                    style={{
                      background: isSelected
                        ? 'hsl(var(--primary) / 0.08)'
                        : 'hsl(var(--card) / 0.5)',
                      borderColor: isSelected
                        ? 'hsl(var(--primary) / 0.3)'
                        : 'hsl(var(--border) / 0.5)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div
                        className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors"
                        style={{
                          background: isSelected ? 'hsl(var(--primary))' : 'transparent',
                          borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                        }}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {p.titulo}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-muted-foreground">
                            {p.usuario_nombre}
                          </span>
                          {badge && (
                            <span className="text-[11px] text-muted-foreground">
                              {badge.emoji} {badge.label}
                            </span>
                          )}
                          {p.oraciones_count > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              🙏 {p.oraciones_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Bottom: Start button */}
      <div className="sticky bottom-0 px-5 pb-8 pt-4 bg-gradient-to-t from-background via-background">
        <button
          onClick={handleConfirm}
          disabled={!canStart}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold active:scale-[0.98] disabled:opacity-40 transition-all"
          style={{
            background: canStart ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
            color: canStart ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
          }}
        >
          {selectedIds.size > 0 ? (
            <>
              Comenzar a orar
              <span className="text-xs opacity-80">
                ({selectedIds.size} {selectedIds.size === 1 ? 'petición' : 'peticiones'})
              </span>
            </>
          ) : (
            'Seleccioná al menos una petición'
          )}
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  )
}
