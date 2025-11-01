'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
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

  // Segundos acumulados hasta la última pausa (o inicio). Persistimos solo aquí.
  const [segundosBase, setSegundosBase] = useState<number>(segundosIniciales)
  const baseRef = useRef<number>(segundosIniciales)

  const [estaActivo, setEstaActivo] = useState<boolean>(false)
  const [estaCompleto, setEstaCompleto] = useState<boolean>(oracionCompletada)

  // Timestamp de inicio de la sesión actual
  const startTimeRef = useRef<number | null>(null)
  // requestAnimationFrame id
  const rafRef = useRef<number | null>(null)
  // Estado "tick" para forzar re-render desde RAF sin mutar el progreso base
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
    // Forzamos re-render para refrescar el tiempo mostrado
    setTick(Date.now())

    const totalAhora = calcularSegundosActuales()
    if (totalAhora >= totalSegundosRequeridos && !estaCompleto) {
      // Completar y persistir una sola vez
      stopRaf()
      setEstaActivo(false)
      setEstaCompleto(true)
      setSegundosBase(totalSegundosRequeridos)
      baseRef.current = totalSegundosRequeridos
      startTimeRef.current = null
      void handleSaveProgress(totalSegundosRequeridos, true)
      return
    }

    // Continuar el bucle si sigue activo
    if (estaActivo && !estaCompleto) {
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [calcularSegundosActuales, totalSegundosRequeridos, estaActivo, estaCompleto, handleSaveProgress])

  useEffect(() => {
    if (estaActivo && !estaCompleto) {
      // Iniciamos/reanudamos: anclamos el tiempo de referencia ahora
      startTimeRef.current = Date.now()
      rafRef.current = requestAnimationFrame(animate)
    } else {
      // Pausa o completado: detenemos animación
      stopRaf()
    }
    return () => stopRaf()
  }, [estaActivo, estaCompleto, animate])

  const handleToggle = () => {
    const nuevoEstadoActivo = !estaActivo
    if (nuevoEstadoActivo) {
      // Pasamos a activo: solo arrancamos el reloj
      setEstaActivo(true)
      // startTime se define en el efecto superior
    } else {
      // Pasamos a pausa: consolidamos segundos actuales y guardamos
      const totalAhora = Math.min(calcularSegundosActuales(), totalSegundosRequeridos)
      setSegundosBase(totalAhora)
      baseRef.current = totalAhora
      setEstaActivo(false)
      startTimeRef.current = null
      if (!estaCompleto) void handleSaveProgress(totalAhora, false)
    }
  }

  // UI de completado
  if (estaCompleto) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 size={20} />
        <span className="font-semibold">Completado</span>
      </div>
    )
  }

  // Tiempo mostrado (derivado en cada render; preciso incluso tras inactividad)
  const segundosMostrados = Math.min(calcularSegundosActuales(), totalSegundosRequeridos)
  const tiempoFormateado = formatTiempo(segundosMostrados)
  const tiempoTotalFormateado = formatTiempo(totalSegundosRequeridos)

  return (
    <div className="flex items-center justify-between w-full">
      <div className="font-mono text-lg font-semibold tracking-wider">
        <span>{tiempoFormateado}</span>
        <span className="text-muted-foreground"> / {tiempoTotalFormateado}</span>
      </div>
      <Button onClick={handleToggle}>
        {estaActivo ? 'Pausar Oración' : 'Iniciar Oración'}
      </Button>
    </div>
  )
}
