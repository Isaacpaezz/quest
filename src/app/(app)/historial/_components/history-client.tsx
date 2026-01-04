'use client'

import { Trophy, BookOpen, Clock, Calendar } from 'lucide-react'
import { type Tables } from '@/types/database'
import { EmptyState } from '@/components/shared/empty-state'

function getDaysBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

export function HistoryClient({ planes }: { planes: Tables<'planes_lectura'>[] }) {
  if (planes.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <EmptyState
          Icon={Trophy}
          title="Aún no hay planes completados"
          description="El primer plan de lectura completado por la comunidad aparecerá aquí. ¡Sigue adelante!"
        />
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {planes.map(plan => {
        const totalDays = getDaysBetween(plan.fecha_inicio, plan.fecha_fin)
        const endDate = new Date(plan.fecha_fin)
        
        return (
          <div key={plan.id} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <BookOpen className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                  Completado
                </span>
              </div>
              
              <h3 className="mb-1 text-lg font-bold text-slate-900">{plan.nombre_libro}</h3>
              <p className="mb-4 text-sm text-slate-500">
                {endDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', day: 'numeric' })}
              </p>
              
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-slate-500">
                    <Calendar className="mr-2 h-4 w-4 text-slate-400" />
                    Duración
                  </span>
                  <span className="font-medium text-slate-900">{totalDays} días</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-slate-500">
                    <Clock className="mr-2 h-4 w-4 text-slate-400" />
                    Oración diaria
                  </span>
                  <span className="font-medium text-slate-900">{plan.minutos_oracion_requeridos} min</span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-center">
              <span className="text-sm font-medium text-slate-500">
                {plan.descripcion || 'Plan de lectura completado con éxito'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
