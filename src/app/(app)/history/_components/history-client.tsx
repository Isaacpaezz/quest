'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { BookOpen, Clock, Calendar, ChevronDown } from 'lucide-react'
import { type Tables } from '@/types/database'

type ProgressEntry = {
  fecha_progreso: string
  lectura_completada: boolean
  oracion_completada: boolean
}

// ── Simple calendar heatmap ────────────────────────────────────────────────
function MonthCalendar({
  completedDates,
  pendingDates,
  year,
  month,
  isDark,
}: {
  completedDates: Set<string>
  pendingDates: Set<string>
  year: number
  month: number
  isDark: boolean
}) {
  const today = new Date()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Monday-first: shift Sunday from 0 to 6
  const firstDay = new Date(year, month, 1).getDay()
  const firstDayMondayBased = firstDay === 0 ? 6 : firstDay - 1

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayMondayBased }, (_, i) => i)

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const accentClr = isDark ? '#2DDAB0' : '#1AAF8B'
  const pendingClr = isDark ? '#FFB84D' : '#E69500'
  const dotBg = isDark ? '#1E2330' : '#E0E3EB'
  const textClr = isDark ? '#5A6075' : '#8C9099'
  const todayBdr = isDark ? '#3D4560' : '#C0C5D5'

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[10px] font-bold font-sans" style={{ color: textClr }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {blanks.map(i => <div key={`b-${i}`} />)}
        {days.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const done = completedDates.has(dateStr)
          const pending = pendingDates.has(dateStr)
          const isSunday = new Date(year, month, day).getDay() === 0

          let bg = dotBg
          let color = textClr
          if (done) { bg = accentClr; color = isDark ? '#080A10' : '#FFFFFF' }
          else if (pending) { bg = pendingClr; color = isDark ? '#080A10' : '#FFFFFF' }

          return (
            <div
              key={day}
              className="aspect-square rounded-lg flex items-center justify-center text-[12px] font-sans font-medium"
              style={{
                backgroundColor: bg,
                color,
                outline: isToday && !done && !pending ? `2px solid ${todayBdr}` : 'none',
                opacity: isSunday && !done && !pending ? 0.4 : 1,
              }}
            >
              {day}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-sm" style={{ backgroundColor: accentClr }} />
          <span className="text-[10px] font-sans" style={{ color: textClr }}>Completado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-sm" style={{ backgroundColor: pendingClr }} />
          <span className="text-[10px] font-sans" style={{ color: textClr }}>Pendiente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-sm" style={{ backgroundColor: dotBg }} />
          <span className="text-[10px] font-sans" style={{ color: textClr }}>Libre</span>
        </div>
      </div>
    </div>
  )
}

export function HistoryClient({
  progressData,
  planes,
}: {
  progressData: ProgressEntry[]
  planes: Tables<'planes_lectura'>[]
}) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())

  const cardBg = isDark ? 'rgba(21,25,37,0.60)' : 'rgba(255,255,255,0.88)'
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const textClr = isDark ? '#FFFFFF' : '#111318'
  const subClr = isDark ? '#5A6075' : '#8C9099'
  const accentClr = isDark ? '#2DDAB0' : '#1AAF8B'
  const sectionLbl = isDark ? '#7A8090' : '#6B7080'

  // Build sets for the viewed month
  const completedDates = new Set<string>()
  const pendingDates = new Set<string>()

  let lecturasMes = 0
  let oracionesMes = 0
  let lecturasLastMes = 0
  let oracionesLastMes = 0

  for (const p of progressData) {
    const date = p.fecha_progreso.split('T')[0]
    const d = new Date(date + 'T12:00:00')
    const pMonth = d.getMonth()
    const pYear = d.getFullYear()

    if (pMonth === viewMonth && pYear === viewYear) {
      if (p.lectura_completada && p.oracion_completada) {
        completedDates.add(date)
      } else if (p.lectura_completada || p.oracion_completada) {
        pendingDates.add(date)
      }
      if (p.lectura_completada) lecturasMes++
      if (p.oracion_completada) oracionesMes++
    }

    // Previous month stats for comparison
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear
    if (pMonth === prevMonth && pYear === prevYear) {
      if (p.lectura_completada) lecturasLastMes++
      if (p.oracion_completada) oracionesLastMes++
    }
  }

  const lecturaDiff = lecturasMes - lecturasLastMes
  const oracionDiff = oracionesMes - oracionesLastMes

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const prevMonthName = new Date(viewYear, viewMonth - 1).toLocaleDateString('es-ES', { month: 'long' })

  const [showMonthPicker, setShowMonthPicker] = useState(false)

  // Build list of available months from progress data
  const availableMonths: { month: number; year: number; label: string }[] = []
  const monthSet = new Set<string>()
  // Always include current month
  monthSet.add(`${now.getFullYear()}-${now.getMonth()}`)
  availableMonths.push({
    month: now.getMonth(),
    year: now.getFullYear(),
    label: new Date(now.getFullYear(), now.getMonth()).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
  })
  for (const p of progressData) {
    const d = new Date(p.fecha_progreso.split('T')[0] + 'T12:00:00')
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!monthSet.has(key)) {
      monthSet.add(key)
      availableMonths.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: new Date(d.getFullYear(), d.getMonth()).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      })
    }
  }
  availableMonths.sort((a, b) => b.year - a.year || b.month - a.month)

  return (
    <div className="flex flex-col gap-6">

      {/* Calendar card */}
      <div
        className="rounded-[24px] p-4"
        style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-display text-[16px] font-bold capitalize" style={{ color: textClr }}>
            {monthName}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-sans font-medium"
              style={{
                backgroundColor: isDark ? 'rgba(30,35,48,0.80)' : 'rgba(0,0,0,0.05)',
                color: subClr,
              }}
            >
              {new Date(viewYear, viewMonth).toLocaleDateString('es-ES', { month: 'long' })}
              <ChevronDown className="size-3.5" />
            </button>
            {showMonthPicker && (
              <div
                className="absolute right-0 top-full mt-1 rounded-xl p-1 z-50 max-h-[240px] overflow-y-auto min-w-[180px] shadow-lg"
                style={{
                  backgroundColor: isDark ? '#1A1E2A' : '#FFFFFF',
                  border: `1px solid ${border}`,
                }}
              >
                {availableMonths.map(m => {
                  const isActive = m.month === viewMonth && m.year === viewYear
                  return (
                    <button
                      key={`${m.year}-${m.month}`}
                      onClick={() => {
                        setViewMonth(m.month)
                        setViewYear(m.year)
                        setShowMonthPicker(false)
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-[13px] font-sans capitalize"
                      style={{
                        backgroundColor: isActive ? (isDark ? 'rgba(45,218,176,0.12)' : 'rgba(26,175,139,0.10)') : 'transparent',
                        color: isActive ? accentClr : (isDark ? '#FFFFFF' : '#111318'),
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <MonthCalendar
          completedDates={completedDates}
          pendingDates={pendingDates}
          year={viewYear}
          month={viewMonth}
          isDark={isDark}
        />
      </div>

      {/* Stats cards — matching Pencil design */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-[20px] p-4"
          style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        >
          <span className="text-[11px] font-sans font-bold uppercase tracking-[1px]" style={{ color: subClr }}>Lecturas</span>
          <span className="font-display text-[32px] font-bold block" style={{ color: accentClr }}>
            {lecturasMes}
          </span>
          <p className="text-[11px] font-sans" style={{ color: lecturaDiff >= 0 ? accentClr : '#FF6B6B' }}>
            {lecturaDiff >= 0 ? '+' : ''}{lecturaDiff} vs {prevMonthName}
          </p>
        </div>
        <div
          className="rounded-[20px] p-4"
          style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
        >
          <span className="text-[11px] font-sans font-bold uppercase tracking-[1px]" style={{ color: subClr }}>Oraciones</span>
          <span className="font-display text-[32px] font-bold block" style={{ color: accentClr }}>
            {oracionesMes}
          </span>
          <p className="text-[11px] font-sans" style={{ color: oracionDiff >= 0 ? accentClr : '#FF6B6B' }}>
            {oracionDiff >= 0 ? '+' : ''}{oracionDiff} vs {prevMonthName}
          </p>
        </div>
      </div>

      {/* Books section */}
      {planes.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-[2px] rounded-sm" style={{ backgroundColor: '#FF6B35' }} />
            <span
              className="text-[11px] font-bold tracking-[2px] font-sans uppercase"
              style={{ color: sectionLbl }}
            >
              LIBROS LEÍDOS
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {planes.map(plan => {
              const endDate = new Date(plan.fecha_fin)
              const startDate = new Date(plan.fecha_inicio)
              const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
              return (
                <div
                  key={plan.id}
                  className="rounded-[20px] p-4"
                  style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="size-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isDark ? 'rgba(45,218,176,0.12)' : 'rgba(26,175,139,0.10)' }}
                      >
                        <BookOpen className="size-5" style={{ color: accentClr }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-[600] font-sans truncate" style={{ color: textClr }}>
                          {plan.nombre_libro}
                        </h3>
                        <p className="text-[12px] font-sans mt-0.5" style={{ color: subClr }}>
                          {endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div
                      className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-[600] font-sans"
                      style={{
                        backgroundColor: isDark ? 'rgba(45,218,176,0.12)' : 'rgba(26,175,139,0.10)',
                        color: accentClr,
                      }}
                    >
                      ✓ {diffDays}d
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
