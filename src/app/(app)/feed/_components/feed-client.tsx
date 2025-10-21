'use client'

import { ActivityCard } from './activity-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Newspaper } from 'lucide-react'

// Helper para formatear los encabezados de fecha
function formatDateHeader(dateString: string) {
  // Comparar solo las fechas (YYYY-MM-DD) sin considerar la hora
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (dateString === today) {
    return 'Hoy';
  }
  if (dateString === yesterday) {
    return 'Ayer';
  }
  
  // Para fechas anteriores, crear el objeto Date y formatear
  const activityDate = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(activityDate);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FeedClient({ groupedActivities }: { groupedActivities: Record<string, any[]> }) {
  const activityDates = Object.keys(groupedActivities);

  if (activityDates.length === 0) {
    return (
      <EmptyState
        Icon={Newspaper}
        title="El feed está tranquilo"
        description="Sé el primero en completar una misión hoy para aparecer aquí."
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {activityDates.map(date => (
        <div key={date}>
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b">{formatDateHeader(date)}</h2>
          <div className="space-y-6">
            {groupedActivities[date].map(activity => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
