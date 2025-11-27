'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Play } from 'lucide-react'
import { actualizarProgresoOracionAction } from '../actions'

type PrayerTimerProps = {
  minutosRequeridos: number
  segundosIniciales: number
  capituloId: number
  oracionCompletada: boolean
}

const formatTiempo = (segundos: number) => {
  const secs = Math.max(0, Math.floor(segundos))
  const mins = Math.floor(secs / 60).toString().padStart(2, '0')
  const segs = (secs % 60).toString().padStart(2, '0')
  return `${mins}:${segs}`
}

export function PrayerTimer({ minutosRequeridos, segundosIniciales, capituloId, oracionCompletada }: PrayerTimerProps) {
  const totalSegundosRequeridos = Math.max(0, minutosRequeridos * 60)

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
      toast.success('¡Oración completada!', { description: 'Has cumplido tu tiempo de oración de hoy.' })
    } else if (!result?.error) {
      toast.info('Progreso guardado', { description: 'Tu tiempo de oración ha sido guardado.' })
    }
  }, [capituloId, totalSegundosRequeridos])

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

  return (
    <div className="space-y-3">
      {/* Time Display */}
      <div className="font-display text-2xl font-bold tabular-nums text-slate-900">
        {tiempoFormateado}
        <span className="text-base font-normal text-slate-400"> / {tiempoTotalFormateado}</span>
      </div>

      {/* Control Button */}
      {!estaCompleto && (
        <button
          onClick={handleToggle}
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#5B5FEF] font-medium text-white shadow-sm transition-all active:scale-95"
        >
          <Play className="h-5 w-5" fill="white" />
          {estaActivo ? 'Pausar' : 'Iniciar'}
        </button>
      )}
    </div>
  )
}
