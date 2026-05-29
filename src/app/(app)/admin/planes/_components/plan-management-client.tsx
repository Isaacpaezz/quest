'use client'

import { useActionState, useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { LIBROS_BIBLIA } from '@/lib/bible-data'
import { generarPlanAction, eliminarPlanAction, programarPlanSiguienteAction } from '../actions'
import { toast } from 'sonner'
import { Tables } from '@/types/database'
import { BookOpen, Calendar, Clock, Trash2, ChevronDown, ChevronUp, Play, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

type Plan = Tables<'planes_lectura'> & {
  totalCapitulos: number
  progresoCompletado: number
  totalMiembros: number
}

function PlanCard({
  plan,
  onDelete,
  onSchedule,
  isDark,
  cardBg,
  cardBorder,
}: {
  plan: Plan
  onDelete: (id: number) => void
  onSchedule: (id: number) => void
  isDark: boolean
  cardBg: string
  cardBorder: string
}) {
  const [expanded, setExpanded] = useState(false)
  const textPrimary = isDark ? '#FFFFFF' : '#111318'
  const textSecondary = isDark ? '#5A6075' : '#8C9099'

  const estadoStyles: Record<string, { bg: string; color: string }> = {
    activo: { bg: isDark ? 'rgba(45,218,176,0.15)' : 'rgba(26,175,139,0.10)', color: isDark ? '#2DDAB0' : '#1AAF8B' },
    proximo: { bg: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(217,119,6,0.10)', color: isDark ? '#FCD34D' : '#D97706' },
    inactivo: { bg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: textSecondary },
    completado: { bg: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(79,70,229,0.10)', color: isDark ? '#A5B4FC' : '#4F46E5' },
  }
  const estadoLabel: Record<string, string> = { activo: 'Activo', proximo: 'Próximo', inactivo: 'Inactivo', completado: 'Completado' }
  const style = estadoStyles[plan.estado] || estadoStyles.inactivo

  const maxProgreso = plan.totalCapitulos * plan.totalMiembros
  const porcentaje = maxProgreso > 0 ? Math.round((plan.progresoCompletado / maxProgreso) * 100) : 0

  return (
    <div
      className="p-4 rounded-[20px]"
      style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <BookOpen className="size-4" style={{ color: textSecondary }} />
            <h3 className="font-sans text-[15px] font-semibold" style={{ color: textPrimary }}>{plan.nombre_libro}</h3>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold font-sans"
              style={{ backgroundColor: style.bg, color: style.color }}
            >
              {estadoLabel[plan.estado]}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-[12px] font-sans" style={{ color: textSecondary }}>
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(plan.fecha_inicio).toLocaleDateString('es-ES')} — {new Date(plan.fecha_fin).toLocaleDateString('es-ES')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {plan.minutos_oracion_requeridos} min
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {plan.estado === 'inactivo' && (
            <>
              <button onClick={() => onSchedule(plan.id)} className="p-1.5 rounded-lg" title="Programar">
                <Play className="size-4" style={{ color: isDark ? '#2DDAB0' : '#1AAF8B' }} />
              </button>
              <button onClick={() => onDelete(plan.id)} className="p-1.5 rounded-lg" title="Eliminar">
                <Trash2 className="size-4" style={{ color: '#FF6B6B' }} />
              </button>
            </>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg">
            {expanded ? <ChevronUp className="size-4" style={{ color: textSecondary }} /> : <ChevronDown className="size-4" style={{ color: textSecondary }} />}
          </button>
        </div>
      </div>

      {(plan.estado === 'activo' || plan.estado === 'completado') && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[12px] font-sans" style={{ color: textSecondary }}>
            <span>Progreso comunidad</span>
            <span>{porcentaje}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full" style={{ background: isDark ? '#1E2330' : '#E8EBF0' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${porcentaje}%`, background: isDark ? '#2DDAB0' : '#1AAF8B' }}
            />
          </div>
        </div>
      )}

      {expanded && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${cardBorder}` }}>
          <div className="grid grid-cols-2 gap-2 text-[13px] font-sans" style={{ color: textSecondary }}>
            <div><span style={{ color: textPrimary }} className="font-medium">Capítulos:</span> {plan.totalCapitulos}</div>
            <div><span style={{ color: textPrimary }} className="font-medium">Miembros:</span> {plan.totalMiembros}</div>
            <div><span style={{ color: textPrimary }} className="font-medium">Completados:</span> {plan.progresoCompletado}</div>
            <div><span style={{ color: textPrimary }} className="font-medium">Oración:</span> {plan.minutos_oracion_requeridos} min</div>
          </div>
        </div>
      )}
    </div>
  )
}

export function PlanManagementClient({ planes }: { planes: Plan[] }) {
  const [state, formAction] = useActionState(generarPlanAction, {})
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedBook, setSelectedBook] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (state.message) { toast.success(state.message); formRef.current?.reset(); setSelectedBook('') }
    if (state.errors?._form) toast.error(state.errors._form[0])
  }, [state])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isDark = !mounted ? true : resolvedTheme === 'dark'
  const cardBg = isDark ? 'rgba(21,25,37,0.44)' : 'rgba(255,255,255,0.91)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.031)'
  const textPrimary = isDark ? '#FFFFFF' : '#111318'
  const textSecondary = isDark ? '#5A6075' : '#8C9099'
  const labelColor = isDark ? '#9CA0B5' : '#6B7080'

  const handleDelete = async (planId: number) => {
    if (!confirm('¿Estás seguro de eliminar este plan?')) return
    const result = await eliminarPlanAction(planId)
    if (result.error) toast.error(result.error)
    else if (result.message) toast.success(result.message)
  }

  const handleSchedule = async (planId: number) => {
    if (!confirm('¿Programar este plan como el siguiente?')) return
    const result = await programarPlanSiguienteAction(planId)
    if (result.error) toast.error(result.error)
    else if (result.message) toast.success(result.message)
  }

  const planActivo = planes.find(p => p.estado === 'activo')
  const planesProximos = planes.filter(p => p.estado === 'proximo')
  const planesInactivos = planes.filter(p => p.estado === 'inactivo')
  const planesCompletados = planes.filter(p => p.estado === 'completado')

  function SectionHeader({ label, color }: { label: string; color: string }) {
    return (
      <div className="flex items-center gap-3 mb-3">
        <div className="w-6 h-[2px] rounded-sm" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-bold tracking-[2px] font-sans uppercase" style={{ color }}>{label}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back navigation */}
      <Link href="/admin" className="flex items-center gap-1">
        <ChevronLeft className="size-4" style={{ color: isDark ? '#2DDAB0' : '#1AAF8B' }} />
        <span className="text-[13px] font-sans" style={{ color: isDark ? '#2DDAB0' : '#1AAF8B' }}>Panel Admin</span>
      </Link>

      {planActivo && (
        <div>
          <SectionHeader label="Plan Activo" color={isDark ? '#2DDAB0' : '#1AAF8B'} />
          <PlanCard plan={planActivo} onDelete={handleDelete} onSchedule={handleSchedule} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} />
        </div>
      )}

      {planesProximos.length > 0 && (
        <div>
          <SectionHeader label={`Cola (${planesProximos.length})`} color={isDark ? '#FCD34D' : '#D97706'} />
          <div className="space-y-3">
            {planesProximos.map(plan => (
              <PlanCard key={plan.id} plan={plan} onDelete={handleDelete} onSchedule={handleSchedule} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} />
            ))}
          </div>
        </div>
      )}

      {planesInactivos.length > 0 && (
        <div>
          <SectionHeader label={`Inactivos (${planesInactivos.length})`} color={textSecondary} />
          <div className="space-y-3">
            {planesInactivos.map(plan => (
              <PlanCard key={plan.id} plan={plan} onDelete={handleDelete} onSchedule={handleSchedule} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} />
            ))}
          </div>
        </div>
      )}

      {planesCompletados.length > 0 && (
        <div>
          <SectionHeader label={`Completados (${planesCompletados.length})`} color={isDark ? '#A5B4FC' : '#4F46E5'} />
          <div className="space-y-3">
            {planesCompletados.map(plan => (
              <PlanCard key={plan.id} plan={plan} onDelete={handleDelete} onSchedule={handleSchedule} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} />
            ))}
          </div>
        </div>
      )}

      {/* Agregar nuevo plan */}
      <div
        className="p-5 rounded-[20px]"
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <h2 className="text-[15px] font-bold font-sans mb-4" style={{ color: textPrimary }}>Agregar Plan a la Cola</h2>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <span className="text-[12px] font-sans" style={{ color: labelColor }}>Libro de la Biblia</span>
            <input type="hidden" name="nombre_libro" value={selectedBook} />
            <div className="relative mt-1.5" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full h-11 px-4 rounded-xl text-[15px] font-sans text-left flex items-center justify-between outline-none"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  color: selectedBook ? textPrimary : textSecondary,
                }}
              >
                <span>{selectedBook || 'Selecciona un libro'}</span>
                <ChevronDown className="size-4" style={{ color: textSecondary }} />
              </button>

              {showDropdown && (
                <div
                  className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl z-50"
                  style={{
                    backgroundColor: isDark ? '#1A1F2E' : '#FFFFFF',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.30)',
                  }}
                >
                  {LIBROS_BIBLIA.map(libro => (
                    <button
                      key={libro.nombre}
                      type="button"
                      onClick={() => { setSelectedBook(libro.nombre); setShowDropdown(false) }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-sans transition-colors"
                      style={{
                        color: textPrimary,
                        backgroundColor: selectedBook === libro.nombre
                          ? (isDark ? 'rgba(45,218,176,0.10)' : 'rgba(26,175,139,0.08)')
                          : 'transparent',
                      }}
                      onMouseEnter={e => {
                        (e.target as HTMLElement).style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
                      }}
                      onMouseLeave={e => {
                        (e.target as HTMLElement).style.backgroundColor = selectedBook === libro.nombre
                          ? (isDark ? 'rgba(45,218,176,0.10)' : 'rgba(26,175,139,0.08)')
                          : 'transparent'
                      }}
                    >
                      {libro.nombre} ({libro.capitulos} cap.)
                    </button>
                  ))}
                </div>
              )}
            </div>
            {state.errors?.nombre_libro && (
              <p className="mt-1 text-[12px] font-sans" style={{ color: '#FF6B6B' }}>{state.errors.nombre_libro[0]}</p>
            )}
          </div>
          <div>
            <span className="text-[12px] font-sans" style={{ color: labelColor }}>Minutos de Oración Diarios</span>
            <input
              name="minutos_oracion"
              type="number"
              defaultValue="15"
              required
              className="mt-1.5 w-full h-11 px-4 rounded-xl text-[15px] font-sans outline-none"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                color: textPrimary,
              }}
            />
          </div>
          <p className="text-[11px] font-sans" style={{ color: textSecondary }}>
            La fecha de inicio se calcula automáticamente según la cola de planes del grupo.
          </p>
          <button
            type="submit"
            className="w-full h-12 rounded-2xl text-[15px] font-semibold font-sans transition-all active:scale-[0.98]"
            style={{
              backgroundColor: isDark ? '#2DDAB0' : '#1AAF8B',
              color: isDark ? '#0A0D14' : '#FFFFFF',
            }}
          >
            Agregar a la Cola
          </button>
        </form>
      </div>
    </div>
  )
}
