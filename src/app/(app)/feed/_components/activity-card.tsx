'use client'

import { Card, CardContent } from '@/components/ui/card'
import { User, ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'

function timeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " años";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " meses";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " días";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " horas";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutos";
  return Math.floor(seconds) + " segundos";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActivityText(activity: any) {
  const userName = <strong className="font-semibold">{activity.perfiles.nombre_usuario}</strong>
  
  switch (activity.tipo_actividad) {
    case 'lectura_completada':
      return <p>{userName} ha completado su lectura de <strong>{activity.referencia_contenido}</strong>.</p>
    case 'oracion_completada':
      return <p>{userName} ha completado su tiempo de oración de hoy.</p>
    default:
      return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ActivityCard({ activity }: { activity: any }) {
  const completionTime = new Date(activity.creado_en).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const hasSummary = activity.tipo_actividad === 'lectura_completada' && activity.resumen_actividad;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            {getActivityText(activity)}
            <p className="text-xs text-muted-foreground mt-1">
              hace {timeAgo(activity.creado_en)} a las {completionTime}
            </p>
          </div>
        </div>
        
        {hasSummary && (
          <Collapsible className="mt-4">
            <CollapsibleTrigger asChild>
              <Button variant="link" className="p-0 h-auto text-xs">
                Ver resumen
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <blockquote className="mt-2 pl-4 border-l-2 text-sm italic text-muted-foreground">
                {activity.resumen_actividad}
              </blockquote>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}
