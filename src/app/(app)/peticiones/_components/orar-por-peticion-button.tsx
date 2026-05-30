'use client'

import { useState, useTransition, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { orarPorPeticionAction } from '../actions'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrarPorPeticionButtonProps {
  peticionId: string
  initialOracionesCount: number
  /** If true, user already prayed for this petition */
  yaOro?: boolean
  /** If true, user is the petition author (hide button) */
  esAutor?: boolean
  /** Petition author name for toast */
  autorNombre?: string
  compact?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * OrarPorPeticionButton
 * "Oré por esto" button with optimistic update.
 * - Increments counter immediately on click
 * - Rolls back on error
 * - Disabled after praying (shows "Oraste 🙏")
 * - Hidden if user is the petition author
 */
export function OrarPorPeticionButton({
  peticionId,
  initialOracionesCount,
  yaOro = false,
  esAutor = false,
  autorNombre,
  compact = false,
}: OrarPorPeticionButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [oracionesCount, setOracionesCount] = useState(initialOracionesCount)
  const [hasOro, setHasOro] = useState(yaOro)

  // Sync count when parent re-renders with new data
  useEffect(() => {
    setOracionesCount(initialOracionesCount)
  }, [initialOracionesCount])

  useEffect(() => {
    setHasOro(yaOro)
  }, [yaOro])

  // Don't show button for petition author
  if (esAutor) {
    return (
      <div className="flex items-center gap-1.5">
        <Heart
          className={compact ? 'size-3.5' : 'size-4'}
          style={{ color: '#F59E0B', fill: oracionesCount > 0 ? '#F59E0B' : 'transparent' }}
        />
        {!compact && (
          <span className="text-[12px] font-sans" style={{ color: '#F59E0B' }}>
            {oracionesCount}
          </span>
        )}
      </div>
    )
  }

  function handleClick() {
    if (hasOro || isPending) return

    // Optimistic update
    setHasOro(true)
    setOracionesCount((c) => c + 1)

    startTransition(async () => {
      const result = await orarPorPeticionAction(peticionId)

      if (!result.success) {
        // Rollback
        setHasOro(false)
        setOracionesCount((c) => Math.max(0, c - 1))

        if (result.error === 'Ya oraste por esta petición') {
          setHasOro(true)
          setOracionesCount((c) => c + 1) // Re-increment since they already prayed
          toast.info('Ya oraste por esta petición')
        } else {
          toast.error('Error', { description: result.error })
        }
      } else {
        toast.success('Oraste 🙏', {
          description: autorNombre
            ? `Oraste por ${autorNombre}`
            : 'Tu oración fue registrada',
        })
      }
    })
  }

  const subClr = 'hsl(var(--muted-foreground))'
  const activeColor = '#F59E0B'

  return (
    <button
      onClick={handleClick}
      disabled={isPending || hasOro}
      className="flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-70"
      title={hasOro ? 'Oraste por esta petición' : 'Oré por esto'}
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
          {hasOro ? 'Oraste 🙏' : oracionesCount}
        </span>
      )}
    </button>
  )
}
