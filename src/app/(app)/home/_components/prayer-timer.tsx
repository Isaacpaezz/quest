'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Play, Pause } from 'lucide-react'
import { actualizarProgresoOracionAction } from '../actions'

type PrayerTimerProps = {
  minutosRequeridos: number
  segundosIniciales: number
  capituloId: number
  oracionCompletada: boolean
  onXpGained?: (data: { xpGanado: number; nuevoNivel?: number; subioNivel?: boolean }) => void
}

const formatTiempo = (segundos: number) => {
  const secs = Math.max(0, Math.floor(segundos))
  const mins = Math.floor(secs / 60).toString().padStart(2, '0')
  const segs = (secs % 60).toString().padStart(2, '0')
  return `${mins}:${segs}`
}

export function PrayerTimer({ minutosRequeridos, segundosIniciales, capituloId, oracionCompletada, onXpGained }: PrayerTimerProps) {
  const totalSegundosRequeridos = Math.max(0, minutosRequeridos * 60)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [segundosBase, setSegundosBase] = useState<number>(segundosIniciales)
  const baseRef = useRef<number>(segundosIniciales)

  const [estaActivo, setEstaActivo] = useState<boolean>(false)
  const [estaCompleto, setEstaCompleto] = useState<boolean>(oracionCompletada)

  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const [, setTick] = useState<number>(0)

  useEffect(() => {
    baseRef.current = segundosBase
  }, [segundosBase])

  const calcularSegundosActuales = useCallback(() => {
    if (estaActivo && startTimeRef.current != null) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      return baseRef.current + elapsed
    }
    return baseRef.current
  }, [estaActivo])

  const handleSaveProgress = useCallback(async (currentSeconds: number, isCompleted: boolean) => {
    const clamped = Math.min(Math.floor(currentSeconds), totalSegundosRequeridos)
    const result = await actualizarProgresoOracionAction({
      segundosAcumulados: clamped,
      capituloId,
      oracionCompletada: isCompleted,
    })
    if (isCompleted) {
      const xp = result?.xpGanado ?? 0
      toast.success('¡Oración completada!', {
        description: xp > 0 ? `+${xp} XP` : 'Has cumplido tu tiempo de oración de hoy.',
      })
      if (xp > 0 && onXpGained) {
        onXpGained({
          xpGanado: xp,
          nuevoNivel: result?.nuevoNivel,
          subioNivel: result?.subioNivel,
        })
      }
    } else if (!result?.error) {
      toast.info('Progreso guardado', { description: 'Tu tiempo de oración ha sido guardado.' })
    }
  }, [capituloId, totalSegundosRequeridos, onXpGained])

  const stopRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const animate = useCallback(() => {
    setTick(Date.now())

    const totalAhora = calcularSegundosActuales()
    if (totalAhora >= totalSegundosRequeridos && !estaCompleto) {
      stopRaf()
      setEstaActivo(false)
      setEstaCompleto(true)
      setSegundosBase(totalSegundosRequeridos)
      baseRef.current = totalSegundosRequeridos
      startTimeRef.current = null
      void handleSaveProgress(totalSegundosRequeridos, true)
      return
    }

    if (estaActivo && !estaCompleto) {
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [calcularSegundosActuales, totalSegundosRequeridos, estaActivo, estaCompleto, handleSaveProgress])

  useEffect(() => {
    if (estaActivo && !estaCompleto) {
      startTimeRef.current = Date.now()
      rafRef.current = requestAnimationFrame(animate)
    } else {
      stopRaf()
    }
    return () => stopRaf()
  }, [estaActivo, estaCompleto, animate])

  const handleToggle = () => {
    const nuevoEstadoActivo = !estaActivo
    if (nuevoEstadoActivo) {
      setEstaActivo(true)
    } else {
      const totalAhora = Math.min(calcularSegundosActuales(), totalSegundosRequeridos)
      setSegundosBase(totalAhora)
      baseRef.current = totalAhora
      setEstaActivo(false)
      startTimeRef.current = null
      if (!estaCompleto) void handleSaveProgress(totalAhora, false)
    }
  }

  // Tiempo mostrado
  const segundosMostrados = Math.min(calcularSegundosActuales(), totalSegundosRequeridos)
  const tiempoFormateado = formatTiempo(segundosMostrados)
  const tiempoTotalFormateado = formatTiempo(totalSegundosRequeridos)
  const progress = totalSegundosRequeridos > 0 ? (segundosMostrados / totalSegundosRequeridos) * 100 : 0

  const textPrimary = isDark ? 'text-white' : 'text-[#111318]'
  const textSecondary = isDark ? 'text-[#5A6075]' : 'text-[#8C9099]'

  return (
    <div className="space-y-3">
      {/* Time Display */}
      <div className={`font-sora text-2xl font-bold tabular-nums ${textPrimary}`}>
        {tiempoFormateado}
        <span className={`text-base font-normal ${textSecondary}`}> / {tiempoTotalFormateado}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: isDark ? '#1E2330' : '#E8EBF0' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: '#2DDAB0' }} />
      </div>

      {/* Control Button */}
      {!estaCompleto && (
        <button
          onClick={handleToggle}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] font-semibold transition-all active:scale-95"
          style={{
            background: estaActivo ? (isDark ? '#FF6B35' : '#FF6B35') : '#2DDAB0',
            color: estaActivo ? '#FFFFFF' : '#111318',
            boxShadow: estaActivo ? '0 0 24px #FF6B3540' : '0 0 32px #E5FF0040',
          }}
        >
          {estaActivo ? <Pause className="h-5 w-5" fill="white" /> : <Play className="h-5 w-5" fill="#111318" />}
          {estaActivo ? 'Pausar' : 'Iniciar'}
        </button>
      )}
    </div>
  )
}
