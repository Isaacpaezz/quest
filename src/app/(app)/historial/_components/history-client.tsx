'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { Trophy } from 'lucide-react'
import { type Tables } from '@/types/database'

function getDaysBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir el día de inicio
}

export function HistoryClient({ planes }: { planes: Tables<'planes_lectura'>[] }) {
  if (planes.length === 0) {
    return (
      <EmptyState
        Icon={Trophy}
        title="Aún no hay planes completados"
        description="El primer plan de lectura completado por la comunidad aparecerá aquí. ¡Sigue adelante!"
      />
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {planes.map(plan => {
        const totalDays = getDaysBetween(plan.fecha_inicio, plan.fecha_fin);
        return (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.nombre_libro}</CardTitle>
              <CardDescription>
                Completado en {new Date(plan.fecha_fin).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Duración:</span>
                <span className="font-semibold">{totalDays} días</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Oración diaria:</span>
                <span className="font-semibold">{plan.minutos_oracion_requeridos} min</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
