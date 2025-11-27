'use client'

import { User, Heart, MessageCircle, Sparkles, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

function timeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " años";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " meses";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " días";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " min";
  return "ahora";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ActivityCard({ activity }: { activity: any }) {
  const isReading = activity.tipo_actividad === 'lectura_completada';
  const completionTime = new Date(activity.creado_en).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="relative mb-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      {/* Timeline Connector (Optional - keeping it subtle) */}
      <div className="absolute -left-4 top-10 hidden h-full w-[2px] bg-slate-100 lg:block" />

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <span className="font-bold">{activity.perfiles.nombre_usuario[0]}</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-900">{activity.perfiles.nombre_usuario}</h4>
            <p className="text-xs text-slate-400">{timeAgo(activity.creado_en)}</p>
          </div>
        </div>
        <button className="text-slate-300 transition-colors hover:text-slate-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* CONTENT BLOCK (Gray Box) */}
      <div className="mt-3 rounded-2xl border border-slate-100/50 bg-slate-50 p-4">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {isReading ? 'Lectura Bíblica' : 'Oración Completada'}
        </div>
        
        <h3 className="font-display text-lg font-bold leading-tight text-slate-900">
          {isReading ? activity.referencia_contenido : 'ha terminado su tiempo con Dios.'}
        </h3>

        {/* QUEST AI INSIGHT (Only for readings with summary) */}
        {isReading && activity.resumen_actividad && (
          <div className="mt-4 flex gap-3 rounded-xl border border-indigo-100 bg-[#EEF2FF] p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
            <div className="space-y-1">
              <p className="text-sm leading-relaxed text-slate-700">
                {activity.resumen_actividad}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* INTERACTIONS FOOTER (Hidden for Prayer) */}
      {isReading && (
        <div className="mt-4">
          <div className="flex items-center gap-6">
            <button className="group flex items-center gap-1.5 text-slate-400 transition-colors hover:text-rose-500">
              <Heart className="h-5 w-5 stroke-2 transition-transform group-active:scale-90" />
              <span className="text-sm font-medium">24</span>
            </button>
            <button className="flex items-center gap-1.5 text-slate-400 transition-colors hover:text-indigo-500">
              <MessageCircle className="h-5 w-5 stroke-2" />
              <span className="text-sm font-medium">1</span>
            </button>
          </div>

          {/* Comments Preview */}
          <div className="mt-4 space-y-2 border-t border-slate-50 pt-3">
            <div className="text-sm">
              <span className="font-bold text-slate-900">Isaac Paez</span>{' '}
              <span className="text-slate-600">¡Gran capítulo! La decisión de Abraham fue muy sabia.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
