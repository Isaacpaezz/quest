'use client'

import { useState, useEffect, useRef } from 'react'
import { Feather } from 'lucide-react'

const CONFESSION_PROMPTS = [
  'Abre tu corazón ante Dios con sinceridad',
  'Confiesa con humildad y recibe su gracia',
  'Dios conoce tu corazón — háblale con verdad',
  'Entrega tus cargas y encuentra libertad en Él',
  'Su misericordia es nueva cada mañana',
]

type Props = {
  sectionElapsed: number
}

/**
 * Confession section: purple gradient, ephemeral textarea with clear
 * privacy notice. Text lives ONLY in component state — never sent to
 * any server action, localStorage, or parent callback.
 */
export function ConfessionSection({ sectionElapsed }: Props) {
  const [confession, setConfession] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Rotate prompt every 30 seconds
  const promptIndex = Math.floor(sectionElapsed / 30) % CONFESSION_PROMPTS.length
  const activePrompt = CONFESSION_PROMPTS[promptIndex]

  // Ephemeral cleanup: reset state on unmount so text never leaks
  useEffect(() => {
    return () => {
      setConfession('')
    }
  }, [])

  return (
    <div className="section-bg-confession flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-8">
      {/* Section icon */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'var(--section-confession-accent)', opacity: 0.15 }}
      >
        <Feather
          className="h-7 w-7"
          style={{ color: 'var(--section-confession-accent)' }}
        />
      </div>

      {/* Section title */}
      <h2
        className="text-center text-xl font-semibold leading-tight"
        style={{ color: 'var(--section-confession-accent)' }}
      >
        Confesión
      </h2>

      {/* Confession prompt */}
      <p
        className="max-w-xs text-center text-base font-medium leading-relaxed"
        style={{ color: 'hsl(var(--foreground) / 0.80)' }}
      >
        {activePrompt}
      </p>

      {/* Ephemeral confession textarea */}
      <div className="flex w-full max-w-sm flex-col gap-2">
        <div className="flex items-center justify-center gap-1.5">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--section-confession-accent)', opacity: 0.6 }}
          />
          <span
            className="text-center text-xs font-medium"
            style={{ color: 'var(--section-confession-accent)', opacity: 0.7 }}
          >
            Esto no se guarda
          </span>
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--section-confession-accent)', opacity: 0.6 }}
          />
        </div>
        <textarea
          ref={textareaRef}
          value={confession}
          onChange={(e) => setConfession(e.target.value)}
          placeholder="Escribe tu confesión aquí..."
          rows={4}
          spellCheck={false}
          autoComplete="off"
          className="w-full resize-none rounded-xl border bg-background/60 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-[var(--section-confession-accent)]"
          style={{
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
        />
      </div>
    </div>
  )
}
