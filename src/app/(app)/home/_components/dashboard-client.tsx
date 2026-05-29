'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Sparkles, CheckCircle } from 'lucide-react'
import { RegisterReadingDialog } from './register-reading-dialog'
import { RetosHomeSection } from './retos-home-section'
import { Toaster } from '@/components/ui/sonner'
import { XpGainToast, LevelUpNotification } from '@/components/shared/xp-toast'

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
  streak?: number
  weeklyProgress?: { day: string; reading: boolean; prayer: boolean }[]
  totalChapters?: number
  completedChapters?: number
  userId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pendientesRetos?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activosRetos?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proximosRetos?: any[]
}

const DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function DashboardClient({ dailyMission, userProgress, readingStats, prayerStats, streak = 0, weeklyProgress, totalChapters = 0, completedChapters = 0, userId, pendientesRetos = [], activosRetos = [], proximosRetos = [] }: DailyData) {
  const [isReadingDialogOpen, setIsReadingDialogOpen] = useState(false)
  const [xpToast, setXpToast] = useState<{ amount: number; show: boolean }>({ amount: 0, show: false })
  const [levelUp, setLevelUp] = useState<{ level: number; show: boolean }>({ level: 0, show: false })
  const router = useRouter()

  const handleXpGained = useCallback((data: { xpGanado: number; nuevoNivel?: number; subioNivel?: boolean }) => {
    // Show XP toast
    setXpToast({ amount: data.xpGanado, show: true })
    // Reset after animation
    setTimeout(() => setXpToast(prev => ({ ...prev, show: false })), 3000)

    // Show level-up if applicable
    if (data.subioNivel && data.nuevoNivel) {
      setTimeout(() => setLevelUp({ level: data.nuevoNivel!, show: true }), 800)
    }
  }, [])

  const chapterInfo = Array.isArray(dailyMission?.capitulos_diarios)
    ? dailyMission.capitulos_diarios[0]
    : dailyMission?.capitulos_diarios;

  const lecturaCompletada = userProgress?.lectura_completada || false
  const oracionCompletada = userProgress?.oracion_completada || false
  const misionesCompletadas = (lecturaCompletada ? 1 : 0) + (oracionCompletada ? 1 : 0)

  // Glass card style (CSS variables — theme-aware)
  const card = 'rounded-3xl border border-border bg-[hsl(var(--bg-surface)/0.7)] p-5 shadow-[var(--quest-shadow-card)]'

  const textPrimary = 'text-foreground'
  const textSecondary = 'text-muted-foreground'
  const accentTeal = 'hsl(var(--primary))'

  // Weekly stats
  const defaultWeek = DAYS_SHORT.map(d => ({ day: d, reading: false, prayer: false }))
  const week = weeklyProgress || defaultWeek
  const weekCompletedDays = week.filter(d => d.reading && d.prayer).length
  const weekPct = Math.round((weekCompletedDays / 7) * 100)

  return (
    <>
      {/* ── Streak Badge ── */}
      {streak > 0 && (
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: '#FF6B3518' }}>
            <span className="text-xl">🔥</span>
            <span className="font-sora text-2xl font-bold" style={{ color: '#FF6B35', letterSpacing: -1 }}>{streak}</span>
            <span className="text-[11px] font-bold" style={{ color: '#FF6B35', letterSpacing: 2 }}>DÍAS</span>
          </div>
        </div>
      )}

      {/* ── Mission Cards ── */}
      <div className="space-y-6">
        {!chapterInfo ? (
          <div className={card + ' flex flex-col items-center justify-center text-center'}>
            <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className={`font-sora text-lg font-semibold ${textPrimary}`}>Día de Descanso</h3>
            <p className={`text-sm ${textSecondary}`}>No hay una lectura asignada para hoy.</p>
          </div>
        ) : (
          <div className={card}>
            {/* Section Label */}
            <div className="mb-4 flex items-center gap-3">
              <div className="h-0.5 w-6 rounded-full" style={{ background: accentTeal }} />
              <span className={`text-[11px] font-bold tracking-[2px] ${textSecondary}`}>LECTURA DE HOY</span>
            </div>

            {/* Card Header: Plan name + progress badge */}
            <div className="mb-3 flex items-center justify-between">
              <h2 className={`font-sora text-2xl font-bold ${textPrimary}`} style={{ letterSpacing: -0.5 }}>
                {chapterInfo.referencia_capitulo?.split(' ')[0] || 'Plan'}
              </h2>
              <div className="rounded-lg px-2 py-1" style={{ background: 'hsl(var(--primary) / 0.10)' }}>
                <span className="text-xs font-bold" style={{ color: accentTeal }}>{completedChapters}/{totalChapters}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(completedChapters / totalChapters) * 100}%`, background: accentTeal }} />
            </div>

            {/* Chapter row */}
            <div className="mb-5 flex items-center gap-3">
              <BookOpen className="h-[18px] w-[18px]" style={{ color: '#00D4AA' }} />
              <span className={`font-sora text-[22px] font-bold ${textPrimary}`} style={{ letterSpacing: -0.5 }}>
                {chapterInfo.referencia_capitulo}
              </span>
            </div>

            {/* Action Buttons: Leer + Orar */}
            <div className="flex gap-3">
              {/* Read Button */}
              {!lecturaCompletada ? (
                <button
                  onClick={() => setIsReadingDialogOpen(true)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] font-semibold text-[hsl(var(--primary-foreground))] transition-all active:scale-95"
                  style={{ background: 'hsl(var(--primary))', boxShadow: '0 0 32px hsl(var(--primary) / 0.25)' }}
                >
                  <BookOpen className="h-4 w-4" />
                  Leer
                </button>
              ) : (
                <div className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] font-semibold" style={{ background: 'hsl(var(--primary) / 0.20)' }}>
                  <CheckCircle className="h-4 w-4" style={{ color: accentTeal }} />
                  <span style={{ color: accentTeal }}>Leído ✓</span>
                </div>
              )}

              {/* Pray Button */}
              {!oracionCompletada ? (
                <button
                  onClick={() => router.push('/oracion')}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] border border-border font-semibold transition-all active:scale-95 bg-[hsl(var(--muted))] text-foreground"
                >
                  <Sparkles className="h-4 w-4" />
                  Orar
                </button>
              ) : (
                <div className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] font-semibold" style={{ background: 'hsl(var(--primary) / 0.20)' }}>
                  <CheckCircle className="h-4 w-4" style={{ color: accentTeal }} />
                  <span style={{ color: accentTeal }}>Orado ✓</span>
                </div>
              )}
            </div>

            {/* Prayer meta */}
            <p className={`mt-3 text-center text-xs ${textSecondary}`}>
              ⏱ {dailyMission.minutos_oracion_requeridos} min · {misionesCompletadas}/2 completados
            </p>
          </div>
        )}

        {/* ── Stats Section: "HOY" ── */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-0.5 w-6 rounded-full" style={{ background: '#FF6B35' }} />
            <span className={`text-[11px] font-bold tracking-[2px] ${textSecondary}`}>HOY</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Stat 1: Lecturas */}
            <div className={card}>
              <div className={`font-sora text-[36px] font-bold ${textPrimary}`} style={{ letterSpacing: -2 }}>
                {readingStats?.count ?? 0}
              </div>
              <div className="mt-1 flex flex-col gap-1">
                <span className={`text-xs font-medium ${textSecondary}`}>Lecturas</span>
                {(readingStats?.count ?? 0) > 0 && (
                  <span className="text-xs font-medium" style={{ color: '#32D74B' }}>
                    {(readingStats?.count ?? 0) >= 10 ? 'Record!' : `+${readingStats?.count ?? 0} hoy`}
                  </span>
                )}
              </div>
            </div>
            {/* Stat 2: Oraciones */}
            <div className={card}>
              <div className={`font-sora text-[36px] font-bold ${textPrimary}`} style={{ letterSpacing: -2 }}>
                {prayerStats?.count ?? 0}
              </div>
              <div className="mt-1 flex flex-col gap-1">
                <span className={`text-xs font-medium ${textSecondary}`}>Oraciones</span>
                {(prayerStats?.count ?? 0) > 0 && (
                  <span className="text-xs font-medium" style={{ color: '#32D74B' }}>
                    {(prayerStats?.count ?? 0) >= 10 ? 'Record!' : `+${prayerStats?.count ?? 0} hoy`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Weekly Progress ── */}
        <div className={card}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-0.5 w-6 rounded-full" style={{ background: accentTeal }} />
              <span className={`text-[11px] font-bold tracking-[2px] ${textSecondary}`}>ESTA SEMANA</span>
            </div>
            <span className={`font-sora text-2xl font-bold ${textPrimary}`}>{weekPct}%</span>
          </div>
          <div className="flex items-end gap-2">
            {week.map((d, i) => {
              const both = d.reading && d.prayer
              const partial = d.reading || d.prayer
              const barH = both ? 48 : partial ? 28 : 12
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-lg transition-all duration-300"
                    style={{
                      height: barH,
                      background: both ? accentTeal : partial ? 'hsl(var(--muted))' : 'hsl(var(--background))',
                      border: i === new Date().getDay() - 1 ? `2px solid ${accentTeal}` : 'none',
                    }}
                  />
                  <span className={`text-[10px] font-semibold ${i === new Date().getDay() - 1 ? '' : textSecondary}`} style={i === new Date().getDay() - 1 ? { color: accentTeal } : {}}>
                    {DAYS_SHORT[i]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Retos Section */}
      {userId && (
        <div className="mt-6">
          <RetosHomeSection
            pendientes={pendientesRetos}
            activos={activosRetos}
            proximos={proximosRetos}
            userId={userId}
          />
        </div>
      )}

      {chapterInfo && (
        <RegisterReadingDialog
          open={isReadingDialogOpen}
          onOpenChange={setIsReadingDialogOpen}
          chapterId={chapterInfo.id}
          chapterReference={chapterInfo.referencia_capitulo}
          onXpGained={handleXpGained}
        />
      )}

      {/* XP Notifications */}
      <XpGainToast amount={xpToast.amount} show={xpToast.show} />
      <LevelUpNotification
        level={levelUp.level}
        show={levelUp.show}
        onClose={() => setLevelUp(prev => ({ ...prev, show: false }))}
      />

      <Toaster richColors />
    </>
  )
}
