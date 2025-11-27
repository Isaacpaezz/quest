'use client'

import { EmptyState } from '@/components/shared/empty-state'
import { Newspaper, Crown, Flame } from 'lucide-react'
import { ActivityCard } from './activity-card'
import { getTodayInVenezuela } from '@/lib/utils'

// Helper para formatear los encabezados de fecha
function formatDateHeader(dateString: string) {
  const dateObj = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Comparar solo año, mes y día (ignorar hora)
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };
  
  if (isSameDay(dateObj, today)) return 'Hoy';
  if (isSameDay(dateObj, yesterday)) return 'Ayer';
  
  return dateObj.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
}

// Colores de gradiente para los héroes
const HERO_COLORS = [
  'from-amber-300 to-orange-500',
  'from-blue-300 to-indigo-500',
  'from-purple-300 to-pink-500',
  'from-green-300 to-emerald-500',
  'from-rose-300 to-red-500',
]

interface Hero {
  id: string
  nombre_usuario: string
}

export function FeedClient({ groupedActivities, likedActivityIds, currentUserId, todaysHeroes }: { 
  groupedActivities: Record<string, unknown[]>
  likedActivityIds: Set<number>
  currentUserId: string
  todaysHeroes: Hero[]
}) {
  const activityDates = Object.keys(groupedActivities);

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-24">
      {/* HÉROES DEL DÍA (Gamification Header) */}
      {todaysHeroes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Héroes del día</h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {todaysHeroes.length} {todaysHeroes.length === 1 ? 'COMPLETADO' : 'COMPLETADOS'}
            </span>
          </div>
          
          <div className="no-scrollbar flex gap-5 overflow-x-auto py-2">
            {todaysHeroes.map((hero, index) => (
              <div key={hero.id} className="flex flex-col items-center">
                <div className="relative">
                  <Crown className="absolute -top-5 left-1/2 h-6 w-6 -translate-x-1/2 fill-amber-500 text-amber-500" />
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-transparent bg-gradient-to-br ${HERO_COLORS[index % HERO_COLORS.length]} p-[2px]`}>
                    <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-slate-100">
                      <span className="font-bold text-slate-500">{hero.nombre_usuario[0]}</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                    <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                  </div>
                </div>
                <span className="mt-2 text-xs font-medium text-slate-700">{hero.nombre_usuario}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FEED DE ACTIVIDADES */}
      {activityDates.length === 0 ? (
        <EmptyState
          Icon={Newspaper}
          title="Sin Actividad Aún"
          description="No hay actividades recientes para mostrar."
        />
      ) : (
        activityDates.map((date) => (
          <div key={date} className="space-y-4">
            <div className="sticky top-[72px] z-10 border-b border-slate-200/80 bg-white/90 pb-2 pt-3 backdrop-blur">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{formatDateHeader(date)}</h2>
            </div>
            {(groupedActivities[date] as Record<string, unknown>[]).map((act) => (
              <ActivityCard
                key={String(act['id'] ?? Math.random())}
                activity={act}
                initialLikesCount={Number(act['likes_count'] as unknown) || 0}
                initialCommentsCount={Number(act['comentarios_count'] as unknown) || 0}
                currentUserLiked={likedActivityIds.has(Number(act['id'] as unknown))}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ))
      )}
    </div>
  )
}
