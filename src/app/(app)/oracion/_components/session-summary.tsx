'use client'

import { useRouter } from 'next/navigation'
import { Heart, Users, Clock, ArrowRight } from 'lucide-react'
import type { SectionDuration } from '@/lib/prayer-sections'

type Props = {
  totalElapsed: number
  sections: SectionDuration[]
  sectionElapsedMap: number[]
  intercessionCount: number
  saving: boolean
}

const SECTION_ACCENTS: Record<string, string> = {
  adoracion: '#D4A017',
  confesion: '#8B5CF6',
  gratitud: '#10B981',
  suplica: '#3B82F6',
  intercesion: '#F59E0B',
}

const fmt = (s: number) => {
  const t = Math.max(0, Math.floor(s))
  return `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`
}

/**
 * Session summary: replaces ResumenOracion for guided prayer mode.
 * Shows total elapsed, per-section time breakdown, intercession count,
 * and completion status. Excludes confession text.
 */
export function SessionSummary({
  totalElapsed,
  sections,
  sectionElapsedMap,
  intercessionCount,
  saving,
}: Props) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-4">
      {/* Completion badge */}
      <div
        className="rounded-2xl px-6 py-3"
        style={{ background: 'hsl(var(--primary) / 0.12)' }}
      >
        <span
          className="text-lg font-semibold"
          style={{ color: 'hsl(var(--primary))' }}
        >
          ✨ Oración guiada completada
        </span>
      </div>

      {/* Total time */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-[13px] text-muted-foreground">
          {fmt(totalElapsed)} de oración
        </span>
      </div>

      {/* Per-section breakdown */}
      <div className="w-full max-w-[300px]">
        <div
          className="rounded-xl px-4 py-3 border"
          style={{
            background: 'hsl(var(--primary) / 0.04)',
            borderColor: 'hsl(var(--primary) / 0.12)',
          }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tiempo por sección
          </p>
          <div className="flex flex-col gap-1.5">
            {sections.map((section, i) => {
              const accent = SECTION_ACCENTS[section.key] ?? 'hsl(var(--muted-foreground))'
              const elapsed = sectionElapsedMap[i] ?? 0
              const pct = section.seconds > 0 ? Math.min(elapsed / section.seconds, 1) : 0

              return (
                <div key={section.key} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: accent }}
                  />
                  <span
                    className="min-w-[100px] text-[12px] font-medium"
                    style={{ color: 'hsl(var(--foreground) / 0.75)' }}
                  >
                    {section.label}
                  </span>
                  <div className="flex-1">
                    <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: 'hsl(var(--muted))' }}>
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{ width: `${pct * 100}%`, background: accent }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {fmt(elapsed)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Intercession summary */}
      {intercessionCount > 0 && (
        <div className="w-full max-w-[300px]">
          <div
            className="rounded-xl px-4 py-3 border"
            style={{
              background: 'hsl(32 97% 48% / 0.06)',
              borderColor: 'hsl(32 97% 48% / 0.15)',
            }}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: '#F59E0B' }} />
              <span className="text-sm font-semibold text-foreground">
                Intercediste por {intercessionCount}{' '}
                {intercessionCount === 1 ? 'petición' : 'peticiones'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-3 mt-2">
        <button
          onClick={() => router.push('/peticiones/mis-peticiones')}
          disabled={saving}
          className="flex items-center gap-2 text-sm font-medium text-primary disabled:opacity-50"
        >
          <Heart className="h-4 w-4" />
          Ver mis peticiones
          <ArrowRight className="h-3 w-3" />
        </button>

        <button
          onClick={() => router.push('/home')}
          disabled={saving}
          className="rounded-xl px-6 py-3 text-sm font-semibold active:scale-95 disabled:opacity-50"
          style={{
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
          }}
        >
          {saving ? 'Guardando…' : 'Volver al inicio'}
        </button>
      </div>
    </div>
  )
}
