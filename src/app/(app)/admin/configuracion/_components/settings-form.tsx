'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { actualizarConfiguracionAction } from '../actions'
import { Toaster } from '@/components/ui/sonner'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
]

const TIMEZONES = [
  'America/Caracas',
  'America/Bogota',
  'America/Mexico_City',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Lima',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Sao_Paulo',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Berlin',
]

const METODOS_RECUPERACION = [
  { value: 'xp', label: 'Puntos (XP)', desc: 'Gastar XP para recuperar' },
  { value: 'dinero', label: 'Dinero ($)', desc: 'Pagar monto extra' },
  { value: 'reto_extra', label: 'Reto Extra', desc: 'Completar reto compensatorio' },
]

function SubmitButton({ isDark }: { isDark: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-12 rounded-2xl text-[15px] font-semibold font-sans transition-all active:scale-[0.98] disabled:opacity-50"
      style={{
        backgroundColor: isDark ? '#2DDAB0' : '#1AAF8B',
        color: isDark ? '#0A0D14' : '#FFFFFF',
      }}
    >
      {pending ? 'Guardando...' : 'Guardar Cambios'}
    </button>
  )
}

function ThemedInput({ name, type = 'text', step, defaultValue, required, isDark }: {
  name: string; type?: string; step?: string; defaultValue?: string; required?: boolean; isDark: boolean;
}) {
  const textPrimary = isDark ? '#FFFFFF' : '#111318'
  return (
    <input
      name={name}
      type={type}
      step={step}
      defaultValue={defaultValue}
      required={required}
      className="mt-1.5 w-full h-11 px-4 rounded-xl text-[15px] font-sans outline-none"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        color: textPrimary,
      }}
    />
  )
}

function ThemedSelect({ name, defaultValue, options, isDark }: {
  name: string; defaultValue?: string; options: { value: string; label: string }[]; isDark: boolean;
}) {
  const textPrimary = isDark ? '#FFFFFF' : '#111318'
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="mt-1.5 w-full h-11 px-4 rounded-xl text-[15px] font-sans outline-none appearance-none"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        color: textPrimary,
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} style={{ color: '#111318' }}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [state, formAction] = useActionState(actualizarConfiguracionAction, {})
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [diasLibres, setDiasLibres] = useState<number[]>(() => {
    try { return JSON.parse(settings.dias_libres || '[]') } catch { return [] }
  })
  const [metodosRecuperacion, setMetodosRecuperacion] = useState<string[]>(() => {
    try { return JSON.parse(settings.metodo_recuperacion || '["xp"]') } catch { return ['xp'] }
  })

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (state.message) toast.success(state.message)
    else if (state.error) toast.error(state.error)
  }, [state])

  const isDark = !mounted ? true : resolvedTheme === 'dark'
  const cardBg = isDark ? 'rgba(21,25,37,0.44)' : 'rgba(255,255,255,0.91)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.031)'
  const textPrimary = isDark ? '#FFFFFF' : '#111318'
  const textSecondary = isDark ? '#5A6075' : '#8C9099'
  const labelColor = isDark ? '#9CA0B5' : '#6B7080'
  const accent = isDark ? '#2DDAB0' : '#1AAF8B'

  const toggleDia = (day: number) => {
    setDiasLibres(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const toggleMetodo = (metodo: string) => {
    setMetodosRecuperacion(prev =>
      prev.includes(metodo) ? prev.filter(m => m !== metodo) : [...prev, metodo]
    )
  }

  return (
    <>
      {/* Back navigation */}
      <Link href="/admin" className="flex items-center gap-1 mb-6">
        <ChevronLeft className="size-4" style={{ color: accent }} />
        <span className="text-[13px] font-sans" style={{ color: accent }}>
          Panel Admin
        </span>
      </Link>

      <form action={formAction} className="flex flex-col gap-6">
        {/* Modo de Penalización */}
        <div
          className="p-5 rounded-[20px]"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <h2 className="text-[15px] font-bold font-sans mb-4" style={{ color: textPrimary }}>Modo de Penalización</h2>
          <div>
            <span className="text-[12px] font-sans" style={{ color: labelColor }}>Tipo de penalización</span>
            <ThemedSelect
              name="modo_penalizacion"
              defaultValue={settings.modo_penalizacion || 'dinero'}
              isDark={isDark}
              options={[
                { value: 'dinero', label: '💰 Dinero — Multas en $' },
                { value: 'puntos', label: '⭐ Puntos — Descuento de XP' },
              ]}
            />
            <p className="mt-1 text-[11px] font-sans" style={{ color: textSecondary }}>
              Define si las penalizaciones se cobran en dinero o puntos
            </p>
          </div>
          <div className="mt-4">
            <span className="text-[12px] font-sans" style={{ color: labelColor }}>Monto por incumplimiento ($)</span>
            <ThemedInput name="monto_penalizacion" type="number" step="0.01" defaultValue={settings.monto_penalizacion || '0'} required isDark={isDark} />
          </div>
        </div>

        {/* Puntos XP por Actividad */}
        <div
          className="p-5 rounded-[20px]"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <h2 className="text-[15px] font-bold font-sans mb-2" style={{ color: textPrimary }}>Puntos XP por Actividad</h2>
          <p className="mb-4 text-[12px] font-sans" style={{ color: textSecondary }}>
            Configura cuántos puntos de experiencia se otorgan por cada actividad.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[12px] font-sans" style={{ color: labelColor }}>XP por lectura</span>
                <ThemedInput name="xp_lectura" type="number" defaultValue={settings.xp_lectura || '40'} required isDark={isDark} />
              </div>
              <div>
                <span className="text-[12px] font-sans" style={{ color: labelColor }}>XP por oración</span>
                <ThemedInput name="xp_oracion" type="number" defaultValue={settings.xp_oracion || '30'} required isDark={isDark} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[12px] font-sans" style={{ color: labelColor }}>XP bonus oración larga</span>
                <ThemedInput name="xp_oracion_bonus" type="number" defaultValue={settings.xp_oracion_bonus || '20'} required isDark={isDark} />
              </div>
              <div>
                <span className="text-[12px] font-sans" style={{ color: labelColor }}>Minutos para bonus</span>
                <ThemedInput name="xp_oracion_bonus_minutos" type="number" defaultValue={settings.xp_oracion_bonus_minutos || '10'} required isDark={isDark} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[12px] font-sans" style={{ color: labelColor }}>XP devocional completo</span>
                <ThemedInput name="xp_devocional_completo" type="number" defaultValue={settings.xp_devocional_completo || '25'} required isDark={isDark} />
              </div>
              <div>
                <span className="text-[12px] font-sans" style={{ color: labelColor }}>XP reto completado</span>
                <ThemedInput name="xp_reto_completado" type="number" defaultValue={settings.xp_reto_completado || '100'} required isDark={isDark} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[12px] font-sans" style={{ color: labelColor }}>Multiplicador racha</span>
                <ThemedInput name="xp_racha_multiplicador" type="number" defaultValue={settings.xp_racha_multiplicador || '10'} required isDark={isDark} />
                <p className="mt-1 text-[11px] font-sans" style={{ color: textSecondary }}>XP × días consecutivos</p>
              </div>
              <div>
                <span className="text-[12px] font-sans" style={{ color: labelColor }}>Máximo XP racha</span>
                <ThemedInput name="xp_racha_cap" type="number" defaultValue={settings.xp_racha_cap || '100'} required isDark={isDark} />
                <p className="mt-1 text-[11px] font-sans" style={{ color: textSecondary }}>Límite de bonus por racha</p>
              </div>
            </div>
          </div>
        </div>

        {/* Canjeo y Recuperación */}
        <div
          className="p-5 rounded-[20px]"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <h2 className="text-[15px] font-bold font-sans mb-4" style={{ color: textPrimary }}>Canjeo y Recuperación</h2>
          <div className="space-y-4">
            <div>
              <span className="text-[12px] font-sans" style={{ color: labelColor }}>Tasa de canjeo (puntos → $)</span>
              <ThemedInput name="tasa_canjeo" type="number" step="0.01" defaultValue={settings.tasa_canjeo || '100'} required isDark={isDark} />
              <p className="mt-1 text-[11px] font-sans" style={{ color: textSecondary }}>Cuántos puntos equivalen a $1</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[12px] font-sans" style={{ color: labelColor }}>Costo recuperar (XP)</span>
                <ThemedInput name="costo_recuperacion_puntos" type="number" defaultValue={settings.costo_recuperacion_puntos || '0'} required isDark={isDark} />
              </div>
              <div>
                <span className="text-[12px] font-sans" style={{ color: labelColor }}>Costo recuperar ($)</span>
                <ThemedInput name="costo_recuperacion_dinero" type="number" step="0.01" defaultValue={settings.costo_recuperacion_dinero || '0'} required isDark={isDark} />
              </div>
            </div>
            <div>
              <span className="text-[12px] font-sans" style={{ color: labelColor }}>Máx. recuperaciones por mes</span>
              <ThemedInput name="max_recuperaciones_mes" type="number" defaultValue={settings.max_recuperaciones_mes || '3'} required isDark={isDark} />
            </div>
          </div>
        </div>

        {/* Métodos de Recuperación */}
        <div
          className="p-5 rounded-[20px]"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <h2 className="text-[15px] font-bold font-sans mb-2" style={{ color: textPrimary }}>Métodos de Recuperación</h2>
          <p className="mb-4 text-[12px] font-sans" style={{ color: textSecondary }}>
            Selecciona qué métodos pueden usar los miembros para recuperar su racha.
          </p>
          <div className="flex flex-col gap-2">
            {METODOS_RECUPERACION.map(metodo => (
              <button
                key={metodo.value}
                type="button"
                onClick={() => toggleMetodo(metodo.value)}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: metodosRecuperacion.includes(metodo.value)
                    ? (isDark ? 'rgba(45,218,176,0.10)' : 'rgba(26,175,139,0.08)')
                    : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  border: `1px solid ${metodosRecuperacion.includes(metodo.value)
                    ? (isDark ? 'rgba(45,218,176,0.25)' : 'rgba(26,175,139,0.20)')
                    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
                    }`,
                }}
              >
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: metodosRecuperacion.includes(metodo.value) ? accent : 'transparent',
                    border: metodosRecuperacion.includes(metodo.value) ? 'none' : `2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                  }}
                >
                  {metodosRecuperacion.includes(metodo.value) && (
                    <span className="text-[11px]" style={{ color: isDark ? '#0A0D14' : '#FFFFFF' }}>✓</span>
                  )}
                </div>
                <div>
                  <span className="text-[13px] font-semibold font-sans block" style={{ color: textPrimary }}>
                    {metodo.label}
                  </span>
                  <span className="text-[11px] font-sans" style={{ color: textSecondary }}>
                    {metodo.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <input type="hidden" name="metodo_recuperacion" value={JSON.stringify(metodosRecuperacion)} />
        </div>

        {/* Zona horaria */}
        <div
          className="p-5 rounded-[20px]"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <h2 className="text-[15px] font-bold font-sans mb-4" style={{ color: textPrimary }}>Zona Horaria</h2>
          <div>
            <span className="text-[12px] font-sans" style={{ color: labelColor }}>Timezone del grupo</span>
            <ThemedSelect
              name="timezone"
              defaultValue={settings.timezone || 'America/Caracas'}
              isDark={isDark}
              options={TIMEZONES.map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))}
            />
            <p className="mt-1 text-[11px] font-sans" style={{ color: textSecondary }}>
              Determina cuándo inicia y termina cada día para el grupo
            </p>
          </div>
        </div>

        {/* Días libres */}
        <div
          className="p-5 rounded-[20px]"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <h2 className="text-[15px] font-bold font-sans mb-2" style={{ color: textPrimary }}>Días Libres</h2>
          <p className="mb-4 text-[12px] font-sans" style={{ color: textSecondary }}>
            Los días marcados no requieren lectura ni oración.
          </p>
          <div className="flex flex-wrap gap-2">
            {DIAS_SEMANA.map(dia => (
              <button
                key={dia.value}
                type="button"
                onClick={() => toggleDia(dia.value)}
                className="rounded-xl px-4 py-2 text-[13px] font-semibold font-sans transition-all"
                style={{
                  backgroundColor: diasLibres.includes(dia.value)
                    ? (isDark ? 'rgba(45,218,176,0.15)' : 'rgba(26,175,139,0.10)')
                    : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  border: `1px solid ${diasLibres.includes(dia.value)
                    ? (isDark ? 'rgba(45,218,176,0.30)' : 'rgba(26,175,139,0.25)')
                    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
                    }`,
                  color: diasLibres.includes(dia.value)
                    ? accent
                    : textPrimary,
                }}
              >
                {dia.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="dias_libres" value={JSON.stringify(diasLibres)} />
        </div>

        <SubmitButton isDark={isDark} />
      </form>
      <Toaster richColors />
    </>
  )
}
