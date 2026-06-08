'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import type { SectionDuration, SectionKey } from '@/lib/prayer-sections'
import { usePrayerSession } from '@/hooks/use-prayer-session'
import { SectionProgressBar } from './sections/section-progress-bar'
import { AdorationSection } from './sections/adoration-section'
import { ConfessionSection } from './sections/confession-section'
import { GratitudeSection } from './sections/gratitude-section'
import { SupplicationSection } from './sections/supplication-section'
import { IntercessionSection } from './sections/intercession-section'

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
}

type Props = {
  totalSeconds: number
  sections: SectionDuration[]
  initialElapsed: number
  onSync: (elapsed: number) => void
  onComplete: (totalElapsed: number) => void
  peticionesPropias?: PeticionPropia[]
  peticionesComunidad?: PeticionComunidad[]
  onIntercessionBatch?: (intercededIds: string[]) => Promise<void>
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
}: Props) {
  const [state, actions] = usePrayerSession(totalSeconds, sections, initialElapsed, onSync)
  const { phase, currentSectionIndex, totalElapsed, sectionElapsed } = state
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

  const handleIntercede = useCallback((petitionId: string) => {
    setIntercededIds(prev => {
      const next = new Set(prev)
      next.add(petitionId)
      return next
    })
  }, [])

  const completedRef = useRef(false)

  useEffect(() => {
    if (phase === 'complete' && !completedRef.current) {
      completedRef.current = true
      onComplete(totalElapsed)
    }
  }, [phase, totalElapsed, onComplete])

  // Batch save intercessions on completion
  useEffect(() => {
    if (phase !== 'complete' || batchSaved) return
    if (intercededIds.size === 0 || !onIntercessionBatch) return
    setBatchSaved(true)
    setBatchSaving(true)
    void onIntercessionBatch(Array.from(intercededIds)).finally(() => setBatchSaving(false))
  }, [phase, intercededIds, batchSaved, onIntercessionBatch])

  void batchSaving

  return (
    <div className="flex h-full flex-col">
      <SectionProgressBar
        sections={sections}
        currentSectionIndex={currentSectionIndex}
        sectionElapsed={sectionElapsed}
      />

      {/* Section content */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        {phase !== 'complete' && currentSection ? (
          <div className="flex min-h-0 w-full flex-1 flex-col transition-opacity duration-500">
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
                petitions={peticionesComunidad}
                intercededIds={intercededIds}
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
        <div className="px-6 pb-1">
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
        <div className="flex shrink-0 items-center justify-center gap-4 px-6 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2">
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
