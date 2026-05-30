'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrarPorPeticionButtonProps {
  peticionId: string
  initialOracionesCount: number
  /** If true, user already prayed for this petition */
  yaOro?: boolean
  compact?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * OrarPorPeticionButton
 * Inline button for feed cards. In PR1, this is non-functional (UI only).
 * Will be connected to server action in PR2.
 */
export function OrarPorPeticionButton({
  peticionId,
  initialOracionesCount,
  yaOro = false,
  compact = false,
}: OrarPorPeticionButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [oracionesCount, setOracionesCount] = useState(initialOracionesCount)
  const [hasOro, setHasOro] = useState(yaOro)

  function handleClick() {
    // In PR1, show a toast that this will be available soon
    toast.info('Próximamente', {
      description: 'La función de orar por peticiones estará disponible pronto',
    })
  }

  const subClr = 'hsl(var(--muted-foreground))'
  const activeColor = '#F59E0B'

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
      title="Oré por esto"
    >
      <Heart
        className={compact ? 'size-3.5' : 'size-4'}
        style={{
          color: hasOro ? activeColor : subClr,
          fill: hasOro ? activeColor : 'transparent',
        }}
      />
      {!compact && (
        <span
          className="text-[12px] font-sans"
          style={{ color: hasOro ? activeColor : subClr }}
        >
          {oracionesCount}
        </span>
      )}
    </button>
  )
}
