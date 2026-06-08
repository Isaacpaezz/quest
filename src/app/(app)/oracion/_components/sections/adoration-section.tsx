'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'

const VERSES = [
  { text: '«Orad sin cesar.»', ref: '— 1 Tesalonicenses 5:17' },
  { text: '«Velad y orad, para que no entréis en tentación.»', ref: '— Mateo 26:41' },
  { text: '«Clama a mí, y yo te responderé.»', ref: '— Jeremías 33:3' },
  { text: '«El Señor está cerca de los que lo invocan.»', ref: '— Salmos 145:18' },
  { text: '«Grandes son tus obras, oh Señor.»', ref: '— Salmo 92:5' },
  { text: '«Santo, santo, santo es el Señor Dios Todopoderoso.»', ref: '— Apocalipsis 4:8' },
]

const WORSHIP_PROMPTS = [
  'Adora a Dios por su grandeza y soberanía',
  'Alábale por su fidelidad y amor inquebrantable',
  'Exálta como Creador de todo lo que existe',
  'Glorifica su nombre santo y poderoso',
  'Reconoce su majestad y dignidad suprema',
]

type Props = {
  sectionElapsed: number
}

/**
 * Adoration section: calm full-screen layout with warm gold treatment,
 * scripture verse, and worship prompts. Pure display — no persistence.
 */
export function AdorationSection({ sectionElapsed }: Props) {
  const [verse] = useState(() => VERSES[Math.floor(Math.random() * VERSES.length)])

  // Rotate prompt every 30 seconds
  const promptIndex = Math.floor(sectionElapsed / 30) % WORSHIP_PROMPTS.length
  const activePrompt = WORSHIP_PROMPTS[promptIndex]

  return (
    <div className="section-bg-adoration flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-8">
      {/* Section icon */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'var(--section-adoration-accent)', opacity: 0.15 }}
      >
        <Heart
          className="h-7 w-7"
          style={{ color: 'var(--section-adoration-accent)' }}
          fill="var(--section-adoration-accent)"
        />
      </div>

      {/* Section title */}
      <h2
        className="text-center text-xl font-semibold leading-tight"
        style={{ color: 'var(--section-adoration-accent)' }}
      >
        Adoración
      </h2>

      {/* Worship prompt */}
      <p
        className="max-w-xs text-center text-base font-medium leading-relaxed"
        style={{ color: 'hsl(var(--foreground) / 0.80)' }}
      >
        {activePrompt}
      </p>

      {/* Scripture verse */}
      <div className="flex flex-col items-center gap-1.5">
        <p
          className="max-w-sm text-center text-sm italic leading-snug"
          style={{ color: 'hsl(var(--foreground) / 0.50)' }}
        >
          {verse.text}
        </p>
        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {verse.ref}
        </p>
      </div>
    </div>
  )
}
