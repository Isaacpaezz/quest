'use client'

import { useState, useEffect } from 'react'
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
  const mins = Math.floor(segundos / 60).toString().padStart(2, '0')
  const segs = (segundos % 60).toString().padStart(2, '0')
  return `${mins}:${segs}` 
}

export function PrayerTimer({ minutosRequeridos, segundosIniciales, capituloId, oracionCompletada }: PrayerTimerProps) {
  const totalSegundosRequeridos = minutosRequeridos * 60
  const [segundos, setSegundos] = useState(segundosIniciales)
  const [estaActivo, setEstaActivo] = useState(false)
  const [estaCompleto, setEstaCompleto] = useState(oracionCompletada)

  // Efecto principal para el temporizador
  useEffect(() => {
    if (!estaActivo || estaCompleto) return

    const intervalo = setInterval(() => {
      setSegundos(s => {
        const nuevosSegundos = s + 1
        if (nuevosSegundos >= totalSegundosRequeridos) {
          setEstaActivo(false)
          setEstaCompleto(true)
          actualizarProgresoOracionAction({ segundosAcumulados: nuevosSegundos, capituloId, oracionCompletada: true })
            .then(() => toast.success('¡Oración completada!', { description: 'Has cumplido tu tiempo de oración de hoy.' }))
          return totalSegundosRequeridos
        }
        return nuevosSegundos
      })
    }, 1000)

    return () => clearInterval(intervalo)
  }, [estaActivo, estaCompleto, totalSegundosRequeridos, capituloId])
  
  const handleToggle = () => {
    const nuevoEstadoActivo = !estaActivo
    setEstaActivo(nuevoEstadoActivo)

    // Si se está pausando, guardar el progreso
    if (!nuevoEstadoActivo && !estaCompleto) {
      actualizarProgresoOracionAction({ segundosAcumulados: segundos, capituloId, oracionCompletada: false })
        .then((res) => {
          if (!res.error) toast.info('Progreso guardado', { description: 'Tu tiempo de oración ha sido guardado.' })
        })
    }
  }

  if (estaCompleto) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 size={20} />
        <span className="font-semibold">Completado</span>
      </div>
    )
  }

  const tiempoFormateado = formatTiempo(segundos)
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
