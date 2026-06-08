'use client'

import { Check } from 'lucide-react'
import type { SectionDuration, SectionKey } from '@/lib/prayer-sections'

const SECTION_ACCENTS: Record<SectionKey, string> = {
  adoracion: '#D4A017',
  confesion: '#8B5CF6',
  gratitud: '#10B981',
  suplica: '#3B82F6',
  intercesion: '#F59E0B',
}

const fmt = (s: number): string => {
  const t = Math.max(0, Math.floor(s))
  return `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`
}

type Props = {
  sections: SectionDuration[]
  currentSectionIndex: number
  sectionElapsed: number
}

/**
 * Section progress bar: 5 dots (completed/active/upcoming), current section
 * label, and per-section timer ring with accent color.
 */
export function SectionProgressBar({ sections, currentSectionIndex, sectionElapsed }: Props) {
  const currentSection = sections[currentSectionIndex]
  const accent = currentSection ? SECTION_ACCENTS[currentSection.key] : '#8C9099'
  const remaining = currentSection ? Math.max(0, currentSection.seconds - sectionElapsed) : 0

  const R = 18
  const C = 2 * Math.PI * R
  const pct = currentSection && currentSection.seconds > 0
    ? Math.min(sectionElapsed / currentSection.seconds, 1)
    : 0

  return (
    <div className="flex flex-col items-center gap-3 px-4 pt-2">
      {/* Section dots */}
      <div className="flex items-center gap-2.5" role="tablist" aria-label="Secciones de oración">
        {sections.map((section, i) => {
          const isCompleted = i < currentSectionIndex
          const isActive = i === currentSectionIndex
          const dotAccent = SECTION_ACCENTS[section.key]
          return (
            <div key={section.key} className="flex flex-col items-center gap-1">
              <div
                role="tab"
                aria-selected={isActive}
                aria-label={`${section.label}${isCompleted ? ' (completada)' : isActive ? ' (actual)' : ''}`}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300"
                style={{
                  background: isCompleted ? dotAccent : isActive ? `${dotAccent}22` : 'hsl(var(--muted))',
                  border: isActive ? `2px solid ${dotAccent}` : '2px solid transparent',
                  color: isCompleted ? '#FFFFFF' : isActive ? dotAccent : 'hsl(var(--muted-foreground))',
                }}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Current section label + timer ring */}
      {currentSection && (
        <div className="flex items-center gap-3" aria-live="polite" aria-atomic="true">
          <div className="relative flex h-10 w-10 items-center justify-center" aria-hidden="true">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
              <circle
                cx="20" cy="20" r={R} fill="none" stroke={accent} strokeWidth="2.5"
                strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
            </svg>
            <span className="text-[10px] font-semibold tabular-nums" style={{ color: accent }}>
              {fmt(remaining)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              {currentSection.label}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Sección {currentSectionIndex + 1} de {sections.length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
