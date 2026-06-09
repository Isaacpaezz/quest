'use client'

import { useEffect, useMemo, useRef, useState, useCallback, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause, X } from 'lucide-react'
import { generarOracionesGuiaBatch } from '@/app/(app)/peticiones/actions'
import type { SectionDuration, SectionKey } from '@/lib/prayer-sections'
import { SECONDS_PER_INTERCESSION_PETITION } from '@/lib/guided-intercession'
import { usePrayerSession } from '@/hooks/use-prayer-session'
import { useKeepAwake } from '@/hooks/use-keep-awake'
import { SectionProgressBar } from './sections/section-progress-bar'
import { AdorationSection } from './sections/adoration-section'
import { ConfessionSection } from './sections/confession-section'
import { GratitudeSection } from './sections/gratitude-section'
import { SupplicationSection } from './sections/supplication-section'
import { IntercessionSection } from './sections/intercession-section'
import { SessionSummary } from './session-summary'

const SECTION_PLACEHOLDERS: Record<SectionKey, { emoji: string; prompt: string }> = {
  adoracion: { emoji: '🙌', prompt: 'Adora a Dios por quién Él es' },
  confesion: { emoji: '🕊️', prompt: 'Confiesa con un corazón sincero' },
  gratitud: { emoji: '❤️', prompt: 'Dale gracias por sus bendiciones' },
  suplica: { emoji: '🙏', prompt: 'Presenta tus peticiones personales' },
  intercesion: { emoji: '🔥', prompt: 'Intercede por tu comunidad' },
}

const fmt = (s: number): string => {
  const t = Math.max(0, Math.floor(s))
  return `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`
}

type GuideBatchResult = Awaited<ReturnType<typeof generarOracionesGuiaBatch>>

const guideBatchRequestsByFingerprint = new Map<string, Promise<GuideBatchResult>>()

function normalizeFingerprintValue(value: string | number | boolean | null | undefined): string | number | boolean | null {
  return value ?? null
}

function getSelectionFingerprint(petitions: PeticionComunidad[]): string {
  return JSON.stringify(
    [...petitions]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((petition) => ({
        id: petition.id,
        titulo: normalizeFingerprintValue(petition.titulo),
        descripcion: normalizeFingerprintValue(petition.descripcion),
        categoria: normalizeFingerprintValue(petition.categoria),
        usuario_nombre: normalizeFingerprintValue(petition.usuario_nombre),
        oraciones_count: normalizeFingerprintValue(petition.oraciones_count),
        creado_en: normalizeFingerprintValue(petition.creado_en),
        actualizado_en: normalizeFingerprintValue(petition.actualizado_en),
      }))
  )
}

type PeticionPropia = {
  id: string
  titulo: string
  descripcion: string | null
  categoria: string
  oraciones_count: number
}

type PeticionComunidad = {
  id: string
  titulo: string
  descripcion: string | null
  categoria: string
  usuario_nombre: string
  oraciones_count: number
  creado_en?: string | null
  actualizado_en?: string | null
  oracion_guia?: string | null
  has_prayed?: boolean
}

type CloseOptions = {
  clearSession: boolean
}

type Props = {
  totalSeconds: number
  sections: SectionDuration[]
  initialElapsed: number
  onSync: (elapsed: number) => void | Promise<void>
  onComplete: (totalElapsed: number) => Promise<void>
  peticionesPropias?: PeticionPropia[]
  peticionesComunidad?: PeticionComunidad[]
  onIntercessionBatch?: (intercededIds: string[]) => Promise<void>
  onClose?: (options?: CloseOptions) => void
  closeDisabled?: boolean
}

/**
 * Guided prayer container: owns session state via usePrayerSession,
 * renders progress bar + section content + navigation controls.
 * Tracks interceded petition IDs locally for batch save on completion.
 */
export function GuidedPrayerContainer({
  totalSeconds,
  sections,
  initialElapsed,
  onSync,
  onComplete,
  peticionesPropias = [],
  peticionesComunidad = [],
  onIntercessionBatch,
  onClose,
  closeDisabled = false,
}: Props) {
  const [state, actions] = usePrayerSession(totalSeconds, sections, initialElapsed, onSync)
  const { phase, currentSectionIndex, totalElapsed, sectionElapsed } = state

  // Keep screen awake while guided session is running (Issue #3 fix)
  useKeepAwake(phase === 'running')

  const currentSection = sections[currentSectionIndex]
  const placeholder = currentSection ? SECTION_PLACEHOLDERS[currentSection.key] : null
  const isFirst = currentSectionIndex === 0
  const isLast = currentSectionIndex === sections.length - 1

  const sessionProgress = useMemo(
    () => (totalSeconds > 0 ? Math.min(totalElapsed / totalSeconds, 1) : 0),
    [totalElapsed, totalSeconds]
  )

  // Track interceded petition IDs locally
  const [intercededIds, setIntercededIds] = useState<Set<string>>(new Set())
  const [batchSaved, setBatchSaved] = useState(false)
  const [batchSaving, setBatchSaving] = useState(false)
  const [completionSaving, setCompletionSaving] = useState(false)
  const [completionPersisted, setCompletionPersisted] = useState(false)
  const [completionError, setCompletionError] = useState<string | null>(null)
  const completionSavingRef = useRef(false)
  const completionPersistedRef = useRef(false)
  const selectedCommunityPetitionIds = useMemo(
    () => peticionesComunidad.map((petition) => petition.id),
    [peticionesComunidad]
  )
  const selectedCommunityPetitionFingerprint = useMemo(
    () => getSelectionFingerprint(peticionesComunidad),
    [peticionesComunidad]
  )
  const [guideTextByPetitionId, setGuideTextByPetitionId] = useState<Record<string, string>>(() => {
    const initialGuides = Object.fromEntries(
      peticionesComunidad
        .filter((petition) => Boolean(petition.oracion_guia))
        .map((petition) => [petition.id, petition.oracion_guia as string])
    )

    return initialGuides
  })
  const [guideLoadingByPetitionId, setGuideLoadingByPetitionId] = useState<Record<string, boolean>>({})
  const [guideErrorByPetitionId, setGuideErrorByPetitionId] = useState<Record<string, string>>({})

  const handleIntercede = useCallback((petitionId: string) => {
    setIntercededIds(prev => {
      const next = new Set(prev)
      next.add(petitionId)
      return next
    })
  }, [])

  useEffect(() => {
    if (selectedCommunityPetitionIds.length === 0) return

    const initialGuides = Object.fromEntries(
      peticionesComunidad
        .filter((petition) => Boolean(petition.oracion_guia))
        .map((petition) => [petition.id, petition.oracion_guia as string])
    )
    setGuideTextByPetitionId(prev => {
      const next = { ...prev }
      selectedCommunityPetitionIds.forEach(id => { delete next[id] })
      return { ...next, ...initialGuides }
    })

    setGuideLoadingByPetitionId(prev => ({
      ...prev,
      ...Object.fromEntries(selectedCommunityPetitionIds.map(id => [id, true])),
    }))
    setGuideErrorByPetitionId(prev => {
      const next = { ...prev }
      selectedCommunityPetitionIds.forEach(id => { delete next[id] })
      return next
    })

    let cancelled = false
    const existingRequest = guideBatchRequestsByFingerprint.get(selectedCommunityPetitionFingerprint)
    const guideRequest = existingRequest ?? generarOracionesGuiaBatch(selectedCommunityPetitionIds)

    if (!existingRequest) {
      guideBatchRequestsByFingerprint.set(selectedCommunityPetitionFingerprint, guideRequest)
      void guideRequest.finally(() => {
        if (guideBatchRequestsByFingerprint.get(selectedCommunityPetitionFingerprint) === guideRequest) {
          guideBatchRequestsByFingerprint.delete(selectedCommunityPetitionFingerprint)
        }
      })
    }

    guideRequest
      .then(result => {
        if (result.success) {
          if (!cancelled) {
            setGuideTextByPetitionId(prev => ({ ...prev, ...result.oraciones }))
          }
          return
        }

        if (cancelled) return

        const message = result.error || 'No se pudo preparar la oración guía'
        setGuideErrorByPetitionId(prev => ({
          ...prev,
          ...Object.fromEntries(selectedCommunityPetitionIds.map(id => [id, message])),
        }))
      })
      .catch(error => {
        console.error('Error preparing guided intercession prayers:', error)
        if (cancelled) return
        setGuideErrorByPetitionId(prev => ({
          ...prev,
          ...Object.fromEntries(selectedCommunityPetitionIds.map(id => [id, 'No se pudo preparar la oración guía'])),
        }))
      })
      .finally(() => {
        if (cancelled) return
        setGuideLoadingByPetitionId(prev => ({
          ...prev,
          ...Object.fromEntries(selectedCommunityPetitionIds.map(id => [id, false])),
        }))
      })

    return () => {
      cancelled = true
    }
  }, [peticionesComunidad, selectedCommunityPetitionIds, selectedCommunityPetitionFingerprint])

  // Close handler: snapshots guided elapsed, persists progress, flushes
  // intercessions, then delegates navigation to the parent onClose.
  // This replaces the legacy OracionClient pause/close path (Issue #1 fix).
  const [closing, setClosing] = useState(false)
  const handleCloseClick = useCallback(async () => {
    if (closing || batchSaving) return
    if (phase === 'complete') {
      onClose?.({ clearSession: completionPersistedRef.current })
      return
    }
    setClosing(true)
    try {
      // Pause the guided session and snapshot current elapsed
      const pausedElapsed = actions.pause()
      // Persist progress via the parent's onSync (which calls save)
      await onSync(pausedElapsed)
      // Flush any pending guided intercessions before leaving
      if (!batchSaved && intercededIds.size > 0 && onIntercessionBatch) {
        await onIntercessionBatch(Array.from(intercededIds))
      }
    } catch (err) {
      console.error('Guided close error:', err)
    } finally {
      setClosing(false)
      onClose?.({ clearSession: true })
    }
  }, [closing, batchSaving, phase, actions, onSync, batchSaved, intercededIds, onIntercessionBatch, onClose])

  // Compute per-section elapsed times for summary
  const sectionElapsedMap = useMemo(() => {
    return sections.map((section, i) => {
      const nextOffset = i < sections.length - 1 ? sections[i + 1].startOffset : totalSeconds
      const sectionDuration = nextOffset - section.startOffset
      if (totalElapsed <= section.startOffset) return 0
      if (totalElapsed >= nextOffset) return sectionDuration
      return totalElapsed - section.startOffset
    })
  }, [sections, totalElapsed, totalSeconds])

  const completedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionContentRef = useRef<HTMLDivElement>(null)

  const persistCompletion = useCallback(async () => {
    if (completionSavingRef.current || completionPersistedRef.current) return

    completionSavingRef.current = true
    setCompletionSaving(true)
    setCompletionError(null)

    try {
      await onComplete(totalElapsed)
      completionPersistedRef.current = true
      setCompletionPersisted(true)
      actions.clearPersistedSession()
    } catch (error) {
      console.error('Guided completion save error:', error)
      setCompletionError('No se pudo guardar tu oración. Revisá tu conexión y reintentá.')
    } finally {
      completionSavingRef.current = false
      setCompletionSaving(false)
    }
  }, [actions, onComplete, totalElapsed])

  // Focus management: auto-focus section content area on section change
  useEffect(() => {
    if (phase === 'complete' || phase === 'idle') return
    const el = sectionContentRef.current
    if (el) {
      el.focus({ preventScroll: true })
    }
  }, [currentSectionIndex, phase])

  useEffect(() => {
    if (phase === 'complete' && !completedRef.current) {
      completedRef.current = true
      void persistCompletion()
    }
  }, [phase, persistCompletion])

  // Batch save intercessions on completion
  useEffect(() => {
    if (phase !== 'complete' || !completionPersisted || batchSaved) return
    if (intercededIds.size === 0 || !onIntercessionBatch) return
    setBatchSaved(true)
    setBatchSaving(true)
    void onIntercessionBatch(Array.from(intercededIds)).finally(() => setBatchSaving(false))
  }, [phase, completionPersisted, intercededIds, batchSaved, onIntercessionBatch])

  const trapFocus = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return

    const root = containerRef.current
    if (!root) return

    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1)

    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  return (
    <div ref={containerRef} onKeyDown={trapFocus} className="flex h-full flex-col">
      {/* Top Bar — inside focus trap so keyboard users can reach close */}
      {onClose && (
        <div className="flex h-[calc(env(safe-area-inset-top)+48px)] shrink-0 items-end justify-between px-3 pb-1.5 pt-[env(safe-area-inset-top)]">
          <button
            onClick={handleCloseClick}
            disabled={closeDisabled || completionSaving || batchSaving || closing}
            className="flex h-11 w-11 items-center justify-center rounded-full active:scale-95 disabled:opacity-50"
            aria-label="Cerrar oración"
          >
            <X className="h-6 w-6 text-muted-foreground/50" />
          </button>
          <span className="text-[15px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            Oración guiada
          </span>
          <div className="h-11 w-11" />
        </div>
      )}

      <SectionProgressBar
        sections={sections}
        currentSectionIndex={currentSectionIndex}
        sectionElapsed={sectionElapsed}
      />

      {/* Section content — crossfade with reduced-motion support */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        {phase === 'complete' && !completionPersisted ? (
          <div className="flex max-w-sm flex-col items-center gap-4 px-6 text-center" role={completionError ? 'alert' : 'status'}>
            <div
              className="rounded-2xl px-6 py-4"
              style={{ background: completionError ? 'hsl(var(--destructive) / 0.10)' : 'hsl(var(--primary) / 0.10)' }}
            >
              <p className="text-base font-semibold" style={{ color: completionError ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
                {completionError ? 'No se pudo guardar tu oración' : 'Guardando tu oración…'}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {completionError
                ? 'Tu progreso sigue guardado en este dispositivo. Reintentá para completar el registro.'
                : 'Esperá unos segundos antes de cerrar.'}
            </p>
            {completionError && (
              <button
                type="button"
                onClick={persistCompletion}
                disabled={completionSaving}
                className="rounded-xl px-6 py-3 text-sm font-semibold active:scale-95 disabled:opacity-50"
                style={{
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                }}
              >
                {completionSaving ? 'Guardando…' : 'Reintentar guardado'}
              </button>
            )}
          </div>
        ) : phase === 'complete' ? (
          <SessionSummary
            totalElapsed={totalElapsed}
            sections={sections}
            sectionElapsedMap={sectionElapsedMap}
            intercessionCount={intercededIds.size}
            saving={completionSaving || batchSaving}
          />
        ) : currentSection ? (
          <div
            key={currentSectionIndex}
            ref={sectionContentRef}
            role="region"
            aria-label={`${currentSection.label}, sección ${currentSectionIndex + 1} de ${sections.length}`}
            tabIndex={-1}
            className="guided-section-crossfade flex min-h-0 w-full flex-1 flex-col outline-none"
          >
            {currentSection.key === 'adoracion' ? (
              <AdorationSection sectionElapsed={sectionElapsed} />
            ) : currentSection.key === 'confesion' ? (
              <ConfessionSection sectionElapsed={sectionElapsed} />
            ) : currentSection.key === 'gratitud' ? (
              <GratitudeSection sectionElapsed={sectionElapsed} />
            ) : currentSection.key === 'suplica' ? (
              <SupplicationSection
                sectionElapsed={sectionElapsed}
                petitions={peticionesPropias}
              />
            ) : currentSection.key === 'intercesion' ? (
              <IntercessionSection
                sectionElapsed={sectionElapsed}
                sectionSeconds={currentSection.seconds}
                secondsPerPetition={SECONDS_PER_INTERCESSION_PETITION}
                petitions={peticionesComunidad}
                intercededIds={intercededIds}
                guideTextByPetitionId={guideTextByPetitionId}
                guideLoadingByPetitionId={guideLoadingByPetitionId}
                guideErrorByPetitionId={guideErrorByPetitionId}
                onIntercede={handleIntercede}
              />
            ) : placeholder ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <span className="text-4xl leading-none">{placeholder.emoji}</span>
                <p className="max-w-xs text-base font-medium leading-snug" style={{ color: 'hsl(var(--foreground) / 0.80)' }}>
                  {placeholder.prompt}
                </p>
                <p className="text-sm text-muted-foreground">{fmt(sectionElapsed)} / {fmt(currentSection.seconds)}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Overall session progress */}
      {phase !== 'complete' && (
        <div className="px-6 pb-1" aria-live="polite" aria-atomic="true">
          <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: 'hsl(var(--muted))' }}>
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${sessionProgress * 100}%`, background: 'hsl(var(--primary))' }}
            />
          </div>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            {fmt(totalElapsed)} / {fmt(totalSeconds)}
          </p>
        </div>
      )}

      {/* Controls */}
      {phase !== 'complete' && (
        <div className="flex shrink-0 items-center justify-center gap-4 px-6 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-2">
          <button
            onClick={actions.prevSection}
            disabled={isFirst || phase === 'idle'}
            aria-label="Sección anterior"
            className="flex h-11 w-11 items-center justify-center rounded-full border active:scale-95 disabled:opacity-30"
            style={{ background: 'hsl(var(--bg-surface) / 0.90)', borderColor: 'hsl(var(--border))' }}
          >
            <ChevronLeft className="h-5 w-5" style={{ color: 'hsl(var(--foreground))' }} />
          </button>
          <button
            onClick={phase === 'idle' ? actions.start : phase === 'running' ? actions.pause : actions.resume}
            aria-label={phase === 'running' ? 'Pausar oración' : 'Iniciar oración'}
            className="flex h-16 w-16 items-center justify-center rounded-full active:scale-90"
            style={{ background: 'hsl(var(--primary))' }}
          >
            {phase === 'running' ? (
              <Pause className="h-7 w-7" style={{ color: 'hsl(var(--primary-foreground))' }} />
            ) : (
              <Play className="h-7 w-7 ml-1" style={{ color: 'hsl(var(--primary-foreground))' }} />
            )}
          </button>
          <button
            onClick={actions.nextSection}
            disabled={isLast || phase === 'idle'}
            aria-label="Siguiente sección"
            className="flex h-11 w-11 items-center justify-center rounded-full border active:scale-95 disabled:opacity-30"
            style={{ background: 'hsl(var(--bg-surface) / 0.90)', borderColor: 'hsl(var(--border))' }}
          >
            <ChevronRight className="h-5 w-5" style={{ color: 'hsl(var(--foreground))' }} />
          </button>
        </div>
      )}
    </div>
  )
}
