'use client'

import { useState } from 'react'
import { BookOpen, Flame, Sparkles } from 'lucide-react'
import { RegisterReadingDialog } from './register-reading-dialog'
import { Toaster } from '@/components/ui/sonner'
import { PrayerTimer } from './prayer-timer'

type DailyData = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dailyMission: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProgress: any
  readingStats?: {
    count: number
    firstReaderName?: string | null
  }
  prayerStats?: {
    count: number
    firstPrayerName?: string | null
  }
}

// El componente recibe los datos pre-cargados desde la página del servidor
export function DashboardClient({ dailyMission, userProgress, readingStats, prayerStats }: DailyData) {
  const [isReadingDialogOpen, setIsReadingDialogOpen] = useState(false)
  
  const chapterInfo = Array.isArray(dailyMission?.capitulos_diarios)
    ? dailyMission.capitulos_diarios[0]
    : dailyMission?.capitulos_diarios;

  // Calculate missions completed
  const lecturaCompletada = userProgress?.lectura_completada || false
  const oracionCompletada = userProgress?.oracion_completada || false
  const misionesCompletadas = (lecturaCompletada ? 1 : 0) + (oracionCompletada ? 1 : 0)
  const totalMisiones = chapterInfo ? 2 : 0

  return (
    <>
      {/* Header & Missions Badge */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Sustento Diario
          </h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        
        {/* Missions Badge */}
        {chapterInfo && (
          <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5">
            <Flame className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-600">
              {misionesCompletadas}/{totalMisiones} MISIONES
            </span>
          </div>
        )}
      </div>

      {/* Mission Cards */}
      <div className="space-y-4">
        {!chapterInfo ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-8 text-center shadow-sm">
            <Sparkles className="mb-4 h-12 w-12 text-slate-400" />
            <h3 className="font-display font-semibold">Día de Descanso</h3>
            <p className="text-sm text-slate-500">No hay una lectura asignada para hoy.</p>
          </div>
        ) : (
          <>
            {/* Reading Mission Card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Lectura Bíblica
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-slate-900">
                    {chapterInfo.referencia_capitulo}
                  </h3>
                </div>
              </div>

              {!lecturaCompletada ? (
                <button
                  onClick={() => setIsReadingDialogOpen(true)}
                  className="flex h-[50px] w-full items-center justify-center rounded-xl bg-slate-900 font-medium text-white transition-all active:scale-95"
                >
                  Registrar Lectura
                </button>
              ) : (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">
                  <span className="font-medium text-emerald-600">✓ Completado</span>
                </div>
              )}

              {/* Facepile dinámico: mostrar nombre y cantidad real de lectores hoy */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-orange-500" />
                  {readingStats && readingStats.count > 1 && (
                    <div className="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-cyan-500" />
                  )}
                  {readingStats && readingStats.count > 2 && (
                    <div className="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-br from-green-400 to-emerald-500" />
                  )}
                  {readingStats && readingStats.count > 3 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-semibold text-slate-600">
                      +{Math.min(readingStats.count - 3, 99)}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {readingStats && readingStats.count > 0 ? (
                    readingStats.count === 1 ? (
                      <span className="font-medium text-slate-700">{readingStats.firstReaderName ?? 'Alguien'}</span>
                    ) : (
                      <>
                        <span className="font-medium text-slate-700">{readingStats.firstReaderName ?? 'Alguien'}</span> y {readingStats.count - 1} más ya leyeron hoy.
                      </>
                    )
                  ) : (
                    <span className="text-slate-400">Sé el primero en leer hoy.</span>
                  )}
                </p>
              </div>
            </div>

            {/* Prayer Mission Card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Tiempo de Oración
                  </p>
                </div>
              </div>

              <PrayerTimer
                minutosRequeridos={dailyMission.minutos_oracion_requeridos}
                segundosIniciales={userProgress?.segundos_oracion_acumulados || 0}
                capituloId={chapterInfo.id}
                oracionCompletada={userProgress?.oracion_completada || false}
              />

              {userProgress?.oracion_completada && (
                <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-center">
                  <span className="font-medium text-emerald-600">✓ Completado</span>
                  <p className="mt-2 text-sm text-slate-600">Ha completado su tiempo de oración de hoy.</p>
                </div>
              )}

              {/* Facepile */}
              {/* Facepile dinámico para oración */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-br from-pink-400 to-rose-500" />
                  {prayerStats && prayerStats.count > 1 && (
                    <div className="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-br from-violet-400 to-purple-500" />
                  )}
                  {prayerStats && prayerStats.count > 2 && (
                    <div className="h-6 w-6 rounded-full border-2 border-white bg-gradient-to-br from-fuchsia-400 to-pink-500" />
                  )}
                  {prayerStats && prayerStats.count > 3 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-semibold text-slate-600">
                      +{Math.min(prayerStats.count - 3, 99)}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {prayerStats && prayerStats.count > 0 ? (
                    prayerStats.count === 1 ? (
                      <span className="font-medium text-slate-700">{prayerStats.firstPrayerName ?? 'Alguien'}</span>
                    ) : (
                      <>
                        <span className="font-medium text-slate-700">{prayerStats.firstPrayerName ?? 'Alguien'}</span> y {prayerStats.count - 1} más ya oraron hoy.
                      </>
                    )
                  ) : (
                    <span className="text-slate-400">Sé el primero en orar hoy.</span>
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      
      {chapterInfo && (
        <RegisterReadingDialog
          open={isReadingDialogOpen}
          onOpenChange={setIsReadingDialogOpen}
          chapterId={chapterInfo.id}
          chapterReference={chapterInfo.referencia_capitulo}
        />
      )}
      <Toaster richColors />
    </>
  )
}
