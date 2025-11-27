'use client'

import { ActivityCard } from './activity-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Newspaper, Crown, Flame } from 'lucide-react'
import { getTodayInVenezuela } from '@/lib/utils'

// Helper para formatear los encabezados de fecha
function formatDateHeader(dateString: string) {
  const today = getTodayInVenezuela();
  const yesterdayDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Caracas' }));
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const year = yesterdayDate.getFullYear();
  const month = String(yesterdayDate.getMonth() + 1).padStart(2, '0');
  const day = String(yesterdayDate.getDate()).padStart(2, '0');
  const yesterday = `${year}-${month}-${day}`;
  
  if (dateString === today) return 'Hoy';
  if (dateString === yesterday) return 'Ayer';
  
  const activityDate = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(activityDate);
}

// Mock data for Heroes (Visual Mockup)
const HEROES = [
  { id: 1, name: 'Helimenas', color: 'from-amber-300 to-orange-500' },
  { id: 2, name: 'Isaac', color: 'from-blue-300 to-indigo-500' },
]

export function FeedClient({ groupedActivities }: { groupedActivities: Record<string, any[]> }) {
  const activityDates = Object.keys(groupedActivities);

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-24">
      {/* HÉROES DEL DÍA (Gamification Header) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Héroes del día</h3>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            2 COMPLETADOS
          </span>
        </div>
        
        <div className="no-scrollbar flex gap-5 overflow-x-auto px-4 py-2">
          {HEROES.map((hero) => (
            <div key={hero.id} className="flex flex-col items-center">
              <div className="relative">
                {/* Crown */}
                <Crown className="absolute -top-5 left-1/2 h-6 w-6 -translate-x-1/2 fill-amber-500 text-amber-500" />
                
                {/* Avatar Container */}
                <div className={`flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-transparent bg-gradient-to-br ${hero.color} p-[2px]`}>
                  <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-slate-100">
                    <span className="font-bold text-slate-500">{hero.name[0]}</span>
                  </div>
                </div>

                {/* Flame Badge */}
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                  <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                </div>
              </div>
              <span className="mt-2 w-20 truncate text-center text-xs font-medium text-slate-600">
                {hero.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVITY FEED */}
      {activityDates.length === 0 ? (
        <EmptyState
          Icon={Newspaper}
          title="El feed está tranquilo"
          description="Sé el primero en completar una misión hoy para aparecer aquí."
        />
      ) : (
        <div className="space-y-8 px-2">
          {activityDates.map(date => (
            <div key={date}>
              <div className="sticky top-16 z-10 mb-6 bg-slate-50/95 py-2 backdrop-blur-sm">
                <h2 className="px-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                  {formatDateHeader(date)}
                </h2>
              </div>
              <div className="space-y-6">
                {groupedActivities[date].map(activity => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
