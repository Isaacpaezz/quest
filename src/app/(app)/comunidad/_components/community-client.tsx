'use client'

import { CommunityMember } from '@/types/definitions'
import { Check, Minus, AlertCircle, ShieldAlert, ChevronDown, CheckCircle2 } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function CommunityClient({ communityData }: { communityData: CommunityMember[] }) {
  const accountabilityData = communityData
    .filter(user => user.deuda.total > 0)
    .sort((a, b) => b.deuda.total - a.deuda.total);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Tarjeta de Pulso Diario */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="p-6 pb-2">
           <div className="mb-6 flex items-center gap-3">
             <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
               <CheckCircle2 className="size-6" />
             </div>
             <h2 className="text-xl font-bold text-slate-900">Hoy</h2>
           </div>

           {/* Column Headers */}
           <div className="mb-2 flex justify-between px-4">
             <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Miembro</span>
             <div className="flex items-center gap-8">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Lectura</span>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Oración</span>
                <span className="w-6 text-center text-xs font-medium uppercase tracking-wider text-slate-400">🔥</span>
             </div>
           </div>
        </div>

        <div className="px-2 pb-4">
          {communityData.map(user => (
            <div key={user.id} className="flex h-[72px] items-center justify-between border-b border-slate-50 px-4 last:border-0">
              {/* Avatar & Name */}
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full border border-slate-100 bg-purple-100 font-bold text-purple-600">
                  {user.nombre_usuario.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-900">{user.nombre_usuario}</span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-10">
                 {/* Lectura */}
                 <div className={cn("flex size-8 items-center justify-center rounded-full", 
                    user.progresoHoy.lectura_completada ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                    {user.progresoHoy.lectura_completada ? <Check className="size-5" /> : <Minus className="size-5" />}
                 </div>
                 
                 {/* Oracion */}
                 <div className={cn("flex size-8 items-center justify-center rounded-full", 
                    user.progresoHoy.oracion_completada ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                    {user.progresoHoy.oracion_completada ? <Check className="size-5" /> : <Minus className="size-5" />}
                 </div>

                 {/* Streak */}
                 <span className="w-6 text-center font-bold text-amber-500">{user.streak}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tarjeta de Muro de Deuda */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="p-6 pb-2">
           <div className="mb-6 flex items-center gap-3">
             <div className="flex size-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
               <ShieldAlert className="size-6" />
             </div>
             <h2 className="text-xl font-bold text-slate-900">Muro</h2>
           </div>

           {/* Column Headers */}
           <div className="mb-2 flex justify-between px-4">
             <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Miembro</span>
             <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Faltas | Deuda</span>
           </div>
        </div>

        <div className="px-2 pb-4">
          {accountabilityData.length > 0 ? (
            accountabilityData.map(user => (
              <Collapsible key={user.id}>
                <CollapsibleTrigger className="w-full">
                  <div className="group flex h-[72px] items-center justify-between rounded-xl border-b border-slate-50 px-4 transition-colors hover:bg-slate-50/50 last:border-0">
                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3">
                       <div className="flex size-10 items-center justify-center rounded-full border border-slate-100 bg-purple-100 font-bold text-purple-600">
                        {user.nombre_usuario.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{user.nombre_usuario}</span>
                        <ChevronDown className="size-4 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
                      </div>
                    </div>

                    {/* Debt Data */}
                    <div className="flex items-center gap-6">
                      <span className="font-medium text-slate-500">{user.deuda.dias_pendientes}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-rose-600">
                          {user.deuda.total.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}
                        </span>
                        <AlertCircle className="size-4 text-rose-400" />
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="mx-2 mb-2 rounded-xl bg-slate-50/50 p-4">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Detalle de Incumplimientos</h4>
                    <ul className="space-y-3">
                      {user.deuda.penalizaciones.map((p) => (
                        <li key={p.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">
                            {new Date(p.fecha_incumplimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </span>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">{p.motivo}</Badge>
                            <span className="font-mono font-medium text-slate-700">
                              {p.monto.toLocaleString('es-ES', { style: 'currency', currency: 'USD' })}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          ) : (
             <div className="py-12 text-center">
               <div className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                 <CheckCircle2 className="size-6" />
               </div>
               <p className="font-medium text-slate-500">¡Sin deudas pendientes!</p>
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
