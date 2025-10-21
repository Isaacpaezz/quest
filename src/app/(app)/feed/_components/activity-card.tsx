'use client'

import { Card, CardContent } from '@/components/ui/card'
import { User } from 'lucide-react'

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

  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1">
          {getActivityText(activity)}
          <p className="text-xs text-muted-foreground mt-1">
            hace {timeAgo(activity.creado_en)} a las {completionTime}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
