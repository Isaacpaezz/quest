'use client'

import { useRouter } from 'next/navigation'
import { Heart, Users, ArrowRight } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

type PetitionResult = {
  id: string
  titulo: string
  autorNombre: string
  fueOrada: boolean // whether user tapped "Oré" for this one
}

type Props = {
  // Existing timer info
  baseSecs: number
  bonusSecs: number
  elapsed: number
  bonusReached: boolean
  bonusXp: number
  saving: boolean
  pauseCount: number

  // Intercession info (new)
  peticionesRezadas: PetitionResult[]

  // Callbacks
  onVolver: () => void
}

// ── Helpers ──────────────────────────────────────────────────────────────

const fmt = (s: number) => {
  const t = Math.max(0, Math.floor(s))
  return `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`
}

// ── Component ────────────────────────────────────────────────────────────

export function ResumenOracion({
  baseSecs,
  bonusSecs,
  elapsed,
  bonusReached,
  bonusXp,
  saving,
  pauseCount,
  peticionesRezadas,
  onVolver,
}: Props) {
  const router = useRouter()

  const prayedPetitions = peticionesRezadas.filter(p => p.fueOrada)
  const uniqueAuthors = new Set(prayedPetitions.map(p => p.autorNombre))
  const intercessionCount = prayedPetitions.length
  const authorCount = uniqueAuthors.size

  return (
    <div className="mt-2 flex flex-col items-center gap-4 px-6">
      {/* Main completion badge */}
      <div
        className="rounded-2xl px-6 py-3"
        style={{
          background: bonusReached
            ? 'hsl(47 100% 50% / 0.10)'
            : 'hsl(var(--primary) / 0.12)',
        }}
      >
        <span
          className="text-lg font-semibold"
          style={{ color: bonusReached ? '#FFD700' : 'hsl(var(--primary))' }}
        >
          {bonusReached ? '✨ ¡Oración bonus completada!' : '✓ ¡Oración completada!'}
        </span>
      </div>

      {/* Time stats */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[13px] text-muted-foreground">
          ⏱ {fmt(baseSecs)} oración
          {bonusReached && ` + ${fmt(Math.max(0, elapsed - baseSecs))} bonus`}
        </span>
        {pauseCount > 0 && (
          <span className="text-[12px] text-muted-foreground">
            {pauseCount} pausa{pauseCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Intercession summary */}
      {intercessionCount > 0 && (
        <div className="w-full max-w-[300px]">
          <div
            className="rounded-xl px-4 py-3 border"
            style={{
              background: 'hsl(var(--primary) / 0.06)',
              borderColor: 'hsl(var(--primary) / 0.15)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Intercediste por tu comunidad
              </span>
            </div>

            <p className="text-[13px] text-muted-foreground mb-2">
              Oraste por <strong className="text-foreground">{intercessionCount}</strong>{' '}
              {intercessionCount === 1 ? 'petición' : 'peticiones'} de{' '}
              <strong className="text-foreground">{authorCount}</strong>{' '}
              {authorCount === 1 ? 'miembro' : 'miembros'}
            </p>

            {/* List of names */}
            <div className="flex flex-wrap gap-1.5">
              {prayedPetitions.slice(0, 5).map((p, i) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5"
                  style={{
                    background: 'hsl(var(--primary) / 0.10)',
                    color: 'hsl(var(--primary))',
                  }}
                >
                  🙏 {p.autorNombre}
                </span>
              ))}
              {prayedPetitions.length > 5 && (
                <span className="text-[11px] text-muted-foreground">
                  +{prayedPetitions.length - 5} más
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-3 mt-2">
        <button
          onClick={() => router.push('/peticiones/mis-peticiones')}
          className="flex items-center gap-2 text-sm font-medium text-primary"
        >
          <Heart className="h-4 w-4" />
          Ver mis peticiones
          <ArrowRight className="h-3 w-3" />
        </button>

        <button
          onClick={onVolver}
          disabled={saving}
          className="rounded-xl px-6 py-3 text-sm font-semibold active:scale-95 disabled:opacity-50"
          style={{
            background: bonusReached ? '#FFD700' : 'hsl(var(--primary))',
            color: '#111318',
          }}
        >
          {saving ? 'Guardando…' : 'Volver al inicio'}
        </button>
      </div>
    </div>
  )
}
