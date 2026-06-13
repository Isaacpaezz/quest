'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { Users, Check, Sparkles, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
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
  has_prayed?: boolean
}

type Props = {
  sectionElapsed: number
  sectionSeconds: number
  secondsPerPetition: number
  petitions: CommunityPetition[]
  intercededIds: Set<string>
  guideTextByPetitionId: Record<string, string>
  guideLoadingByPetitionId: Record<string, boolean>
  guideErrorByPetitionId: Record<string, string>
  scrollContainerRef?: RefObject<HTMLElement | null>
  onIntercede: (petitionId: string) => void
}

/**
 * Intercession section: orange gradient, displays community petitions with
 * requester identity. "Oré" tap button per petition reuses the existing
 * intercession pattern. Tracks interceded IDs via parent callback.
 */
export function IntercessionSection({
  sectionElapsed,
  sectionSeconds,
  secondsPerPetition,
  petitions,
  intercededIds,
  guideTextByPetitionId,
  guideLoadingByPetitionId,
  guideErrorByPetitionId,
  scrollContainerRef,
  onIntercede,
}: Props) {
  const activePetitionSeconds = petitions.length > 0
    ? Math.max(1, sectionSeconds / petitions.length)
    : Math.max(1, secondsPerPetition)
  const timedActiveIndex = petitions.length > 0
    ? Math.min(Math.floor(sectionElapsed / activePetitionSeconds), petitions.length - 1)
    : -1
  const [manualIndex, setManualIndex] = useState<number | null>(null)
  const petitionIdsKey = petitions.map(petition => petition.id).join('|')
  const activeIndex = manualIndex === null
    ? timedActiveIndex
    : Math.min(manualIndex, petitions.length - 1)
  const activePetition = activeIndex >= 0 ? petitions[activeIndex] : null
  const activeBadge = activePetition ? CATEGORIA_BADGE[activePetition.categoria] : null
  const hasPrayed = activePetition
    ? Boolean(activePetition.has_prayed) || intercededIds.has(activePetition.id)
    : false
  const guideText = activePetition ? guideTextByPetitionId[activePetition.id] : null
  const guideLoading = activePetition ? guideLoadingByPetitionId[activePetition.id] : false
  const guideError = activePetition ? guideErrorByPetitionId[activePetition.id] : null
  const displayIndex = activeIndex + 1
  const activePetitionId = activePetition?.id ?? null
  const lastActivePetitionIdRef = useRef<string | null>(null)

  useEffect(() => {
    setManualIndex(null)
  }, [petitionIdsKey])

  useLayoutEffect(() => {
    if (!activePetitionId) {
      lastActivePetitionIdRef.current = null
      return
    }

    if (lastActivePetitionIdRef.current === activePetitionId) return

    lastActivePetitionIdRef.current = activePetitionId
    const scrollContainer = scrollContainerRef?.current
    if (!scrollContainer) return

    if (typeof scrollContainer.scrollTo === 'function') {
      scrollContainer.scrollTo({ top: 0, behavior: 'auto' })
    } else {
      scrollContainer.scrollTop = 0
    }
  }, [activePetitionId, scrollContainerRef])

  const handleOreTap = useCallback((petitionId: string) => {
    const petition = petitions.find(item => item.id === petitionId)
    if (petition?.has_prayed || intercededIds.has(petitionId)) return
    onIntercede(petitionId)
    toast.success('Oración registrada 🙏', { duration: 1500 })
  }, [intercededIds, onIntercede, petitions])

  const handlePrevious = useCallback(() => {
    if (petitions.length < 2) return
    setManualIndex(currentIndex => {
      const baseIndex = currentIndex ?? activeIndex
      return (baseIndex - 1 + petitions.length) % petitions.length
    })
  }, [activeIndex, petitions.length])

  const handleNext = useCallback(() => {
    if (petitions.length < 2) return
    setManualIndex(currentIndex => {
      const baseIndex = currentIndex ?? activeIndex
      return (baseIndex + 1) % petitions.length
    })
  }, [activeIndex, petitions.length])

  return (
    <div className="section-bg-intercession flex min-h-full flex-col items-center justify-center gap-5 px-8 py-6">
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

      {/* Active community petition */}
      {!activePetition ? (
        <p
          className="max-w-xs text-center text-base font-medium leading-relaxed"
          style={{ color: 'hsl(var(--foreground) / 0.60)' }}
        >
          No hay peticiones comunitarias en este momento
        </p>
      ) : (
        <div className="w-full max-w-sm rounded-2xl border px-5 py-4" style={{ background: 'hsl(var(--foreground) / 0.04)', borderColor: 'hsl(var(--border) / 0.35)' }}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--section-intercession-accent)' }}>
              Petición {displayIndex} de {petitions.length}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {Math.min(Math.floor(sectionElapsed), sectionSeconds)}s / {sectionSeconds}s
            </span>
          </div>

          {petitions.length > 1 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                className="flex min-h-10 items-center justify-center gap-1 rounded-lg border px-3 text-xs font-semibold transition-all active:scale-95"
                style={{ borderColor: 'hsl(var(--border) / 0.45)', color: 'hsl(var(--foreground) / 0.72)' }}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex min-h-10 items-center justify-center gap-1 rounded-lg border px-3 text-xs font-semibold transition-all active:scale-95"
                style={{ borderColor: 'hsl(var(--border) / 0.45)', color: 'hsl(var(--foreground) / 0.72)' }}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-3">
            <p className="text-xs font-medium" style={{ color: 'hsl(var(--foreground) / 0.55)' }}>
              Ora por {activePetition.usuario_nombre}
            </p>
            <h3 className="mt-1 text-lg font-semibold leading-tight" style={{ color: 'hsl(var(--foreground) / 0.92)' }}>
              {activePetition.titulo}
            </h3>
            {activePetition.descripcion && (
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.68)' }}>
                {activePetition.descripcion}
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeBadge && (
              <span className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: 'hsl(var(--foreground) / 0.06)', color: 'hsl(var(--foreground) / 0.65)' }}>
                {activeBadge.emoji} {activeBadge.label}
              </span>
            )}
            <span className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: 'hsl(var(--foreground) / 0.06)', color: 'hsl(var(--foreground) / 0.65)' }}>
              🙏 {activePetition.oraciones_count} {activePetition.oraciones_count === 1 ? 'oración' : 'oraciones'}
            </span>
          </div>

          {/* "Oré" button */}
          <button
            onClick={() => handleOreTap(activePetition.id)}
            disabled={hasPrayed}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-base font-semibold transition-all active:scale-95 disabled:opacity-60"
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
                {activePetition.has_prayed ? `Ya habías orado por ${activePetition.usuario_nombre}` : `Oraste por ${activePetition.usuario_nombre}`}
              </>
            ) : (
              <>Oré 🙏</>
            )}
          </button>

          <div className="mt-4 min-h-52 rounded-xl px-4 py-3" style={{ background: 'hsl(var(--foreground) / 0.05)' }}>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--section-intercession-accent)' }}>
              <Sparkles className="h-3.5 w-3.5" />
              Guía de oración
            </div>
            {guideText ? (
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.78)' }}>
                {guideText}
              </p>
            ) : guideLoading ? (
              <p className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.62)' }}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  Preparando una guía serena para esta petición… Señor, acompaña a {activePetition.usuario_nombre} en esta necesidad y guíanos a interceder con fe y amor.
                </span>
              </p>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.62)' }}>
                {guideError ? 'No se pudo preparar la guía. ' : ''}
                Señor, acompaña a {activePetition.usuario_nombre} en esta necesidad y guíanos a interceder con fe y amor.
              </p>
            )}
          </div>

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
