'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'

const GRATITUDE_PROMPTS = [
  'Dale gracias por su provisión en tu vida',
  'Agradece por las personas que te rodean',
  'Reconoce las bendiciones de este día',
  'Da gracias por su gracia y misericordia',
  'Agradece por la vida y el aliento que te da',
  'Reconoce su fidelidad a lo largo de tu historia',
]

type Props = {
  sectionElapsed: number
}

/**
 * Gratitude section: green thanksgiving treatment with optional
 * ephemeral reflection textarea. Text lives only in component state
 * and is never sent to any server action or localStorage.
 */
export function GratitudeSection({ sectionElapsed }: Props) {
  const [reflection, setReflection] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Rotate prompt every 30 seconds
  const promptIndex = Math.floor(sectionElapsed / 30) % GRATITUDE_PROMPTS.length
  const activePrompt = GRATITUDE_PROMPTS[promptIndex]

  // Clear reflection on unmount — ephemeral only
  useEffect(() => {
    return () => {
      setReflection('')
    }
  }, [])

  return (
    <div className="section-bg-gratitude flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-8">
      {/* Section icon */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'var(--section-gratitude-accent)', opacity: 0.15 }}
      >
        <Sparkles
          className="h-7 w-7"
          style={{ color: 'var(--section-gratitude-accent)' }}
        />
      </div>

      {/* Section title */}
      <h2
        className="text-center text-xl font-semibold leading-tight"
        style={{ color: 'var(--section-gratitude-accent)' }}
      >
        Gratitud
      </h2>

      {/* Thanksgiving prompt */}
      <p
        className="max-w-xs text-center text-base font-medium leading-relaxed"
        style={{ color: 'hsl(var(--foreground) / 0.80)' }}
      >
        {activePrompt}
      </p>

      {/* Optional reflection textarea — client-only, never persisted */}
      <div className="flex w-full max-w-sm flex-col gap-2">
        <label
          htmlFor="gratitude-reflection"
          className="text-center text-xs"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Reflexión personal (opcional, no se guarda)
        </label>
        <textarea
          ref={textareaRef}
          id="gratitude-reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Escribe por qué estás agradecido..."
          rows={3}
          className="w-full resize-none rounded-xl border bg-background/60 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-[var(--section-gratitude-accent)]"
          style={{
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
        />
      </div>
    </div>
  )
}
