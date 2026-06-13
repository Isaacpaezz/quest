'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, ArrowLeft, Plus, CheckCircle, TrendingUp, Sparkles, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { OrarPorPeticionButton } from './orar-por-peticion-button'
import { crearActualizacionPeticionAction } from '../actions'
import type { Tables } from '@/types/database'

// ─── Types ───────────────────────────────────────────────────────────────────

type Peticion = Tables<'peticiones_oracion'>
type Actualizacion = Tables<'actualizaciones_peticion'>

interface PeticionDetailClientProps {
  peticion: Peticion & {
    author_name: string
    is_owner: boolean
    ya_oro: boolean
  }
  updates: Actualizacion[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORIA_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  salud: { label: 'Salud', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  familia: { label: 'Familia', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  trabajo: { label: 'Trabajo', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  espiritual: { label: 'Espiritual', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  urgente: { label: 'Urgente', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  otro: { label: 'Otro', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
}

const ESTADO_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  activa: { label: 'Activa', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  respondida: { label: 'Respondida', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  archivada: { label: 'Archivada', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
}

const TIPO_UPDATE_CONFIG: Record<string, { icon: typeof TrendingUp; label: string; color: string; bg: string }> = {
  progreso: { icon: TrendingUp, label: 'Progreso', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  resuelto: { icon: CheckCircle, label: 'Resuelto', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  testimonio: { icon: Sparkles, label: 'Testimonio', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
}

function timeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' años'
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' meses'
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' días'
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' h'
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + ' min'
  return 'ahora'
}

// ─── Update Form ─────────────────────────────────────────────────────────────

function UpdateForm({
  peticionId,
  onSuccess,
}: {
  peticionId: string
  onSuccess: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [tipo, setTipo] = useState<'progreso' | 'resuelto' | 'testimonio'>('progreso')
  const [texto, setTexto] = useState('')
  const [testimonioTexto, setTestimonioTexto] = useState('')
  const [testimonioPublico, setTestimonioPublico] = useState(false)

  const subClr = 'hsl(var(--muted-foreground))'
  const textClr = 'hsl(var(--foreground))'
  const borderClr = 'hsl(var(--border))'
  const activeBg = 'hsl(var(--primary))'

  function handleSubmit() {
    if (!texto.trim()) {
      toast.error('El texto es requerido')
      return
    }

    startTransition(async () => {
      const result = await crearActualizacionPeticionAction(peticionId, {
        tipo,
        texto: texto.trim(),
        testimonio_texto: tipo === 'resuelto' && testimonioTexto.trim() ? testimonioTexto.trim() : null,
        testimonio_publico: tipo === 'resuelto' ? testimonioPublico : false,
      })

      if (result.success) {
        toast.success('Actualización publicada')
        setTexto('')
        setTestimonioTexto('')
        setTestimonioPublico(false)
        setShowForm(false)
        onSuccess()
      } else {
        toast.error('Error', { description: result.error })
      }
    })
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-sans font-medium transition-colors"
        style={{
          backgroundColor: activeBg,
          color: '#FFFFFF',
        }}
      >
        <Plus className="size-4" />
        Actualizar petición
      </button>
    )
  }

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        backgroundColor: 'hsl(var(--bg-surface) / 0.60)',
        border: `1px solid ${borderClr}`,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[14px] font-sans font-semibold" style={{ color: textClr }}>
          Nueva actualización
        </span>
        <button
          onClick={() => setShowForm(false)}
          className="min-h-11 rounded-full px-3 text-[12px] font-sans"
          style={{ color: subClr }}
        >
          Cancelar
        </button>
      </div>

      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {(['progreso', 'resuelto', 'testimonio'] as const).map((t) => {
          const config = TIPO_UPDATE_CONFIG[t]
          const Icon = config.icon
          return (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className="flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[11px] font-sans font-medium transition-colors"
              style={{
                backgroundColor: tipo === t ? config.bg : 'hsl(var(--muted))',
                color: tipo === t ? config.color : subClr,
                border: `1px solid ${tipo === t ? config.color + '30' : 'transparent'}`,
              }}
            >
              <Icon className="size-3" />
              {config.label}
            </button>
          )
        })}
      </div>

      {/* Text input */}
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={
          tipo === 'progreso'
            ? '¿Cómo va tu petición?'
            : tipo === 'resuelto'
              ? '¿Cómo fue respondida?'
              : 'Compartí tu testimonio...'
        }
        maxLength={300}
        rows={3}
        className="w-full rounded-xl px-3 py-2.5 text-[13px] font-sans outline-none transition-colors resize-none"
        style={{
          backgroundColor: 'hsl(var(--input))',
          color: textClr,
          border: `1px solid ${borderClr}`,
        }}
      />
      <span className="text-[11px] font-sans text-right" style={{ color: subClr }}>
        {texto.length}/300
      </span>

      {/* Testimony section (when resolving) */}
      {tipo === 'resuelto' && (
        <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid ${borderClr}` }}>
          <span className="text-[12px] font-sans font-medium" style={{ color: textClr }}>
            Testimonio (opcional)
          </span>
          <textarea
            value={testimonioTexto}
            onChange={(e) => setTestimonioTexto(e.target.value)}
            placeholder="Compartí cómo Dios respondió..."
            maxLength={1000}
            rows={2}
            className="w-full rounded-xl px-3 py-2.5 text-[13px] font-sans outline-none transition-colors resize-none"
            style={{
              backgroundColor: 'hsl(var(--input))',
              color: textClr,
              border: `1px solid ${borderClr}`,
            }}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={testimonioPublico}
              onChange={(e) => setTestimonioPublico(e.target.checked)}
              className="rounded"
            />
            <span className="text-[12px] font-sans" style={{ color: subClr }}>
              Compartir como testimonio público en el feed
            </span>
          </label>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={isPending || !texto.trim()}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-sans font-medium transition-colors disabled:opacity-50"
        style={{
          backgroundColor: activeBg,
          color: '#FFFFFF',
        }}
      >
        {isPending ? 'Publicando...' : 'Publicar actualización'}
      </button>
    </div>
  )
}

// ─── Timeline ────────────────────────────────────────────────────────────────

function UpdateTimeline({ updates }: { updates: Actualizacion[] }) {
  const subClr = 'hsl(var(--muted-foreground))'
  const textClr = 'hsl(var(--foreground))'
  const borderClr = 'hsl(var(--border))'

  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <MessageSquare className="size-8" style={{ color: subClr }} />
        <span className="text-[13px] font-sans" style={{ color: subClr }}>
          Sin actualizaciones aún
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {updates.map((update, index) => {
        const config = TIPO_UPDATE_CONFIG[update.tipo] || TIPO_UPDATE_CONFIG.progreso
        const Icon = config.icon

        return (
          <div key={update.id} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className="size-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: config.bg }}
              >
                <Icon className="size-3.5" style={{ color: config.color }} />
              </div>
              {index < updates.length - 1 && (
                <div
                  className="w-px flex-1 min-h-[20px]"
                  style={{ backgroundColor: borderClr }}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: config.bg, color: config.color }}
                >
                  {config.label}
                </span>
                <span className="text-[11px] font-sans" style={{ color: subClr }}>
                  {timeAgo(update.creado_en)}
                </span>
              </div>
              <p className="text-[13px] font-sans leading-relaxed" style={{ color: textClr }}>
                {update.texto}
              </p>
              {update.testimonio_texto && (
                <div
                  className="mt-2 rounded-xl px-3 py-2.5"
                  style={{
                    backgroundColor: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.12)',
                  }}
                >
                  <p className="text-[12px] font-sans italic leading-relaxed" style={{ color: textClr }}>
                    &ldquo;{update.testimonio_texto}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PeticionDetailClient({
  peticion,
  updates: initialUpdates,
}: PeticionDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const categoria = CATEGORIA_BADGES[peticion.categoria] ?? CATEGORIA_BADGES.otro
  const estado = ESTADO_BADGES[peticion.estado] ?? ESTADO_BADGES.activa

  const textClr = 'hsl(var(--foreground))'
  const subClr = 'hsl(var(--muted-foreground))'
  const borderClr = 'hsl(var(--border))'

  function handleRefresh() {
    startTransition(async () => {
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[13px] font-sans transition-colors"
        style={{ color: subClr }}
      >
        <ArrowLeft className="size-4" />
        Volver
      </button>

      {/* Petition header */}
      <div
        className="rounded-[16px] p-4"
        style={{
          backgroundColor: 'hsl(var(--bg-surface) / 0.60)',
          border: `1px solid ${borderClr}`,
        }}
      >
        {/* Badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: categoria.bg, color: categoria.color }}
          >
            {categoria.label}
          </span>
          <span
            className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: estado.bg, color: estado.color }}
          >
            {estado.label}
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-[20px] font-display font-bold leading-tight mb-2"
          style={{ color: textClr }}
        >
          {peticion.titulo}
        </h1>

        {/* Description */}
        {peticion.descripcion && (
          <p
            className="text-[14px] font-sans leading-relaxed mb-3"
            style={{ color: subClr }}
          >
            {peticion.descripcion}
          </p>
        )}

        {/* Author + stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3" style={{ borderTop: `1px solid ${borderClr}` }}>
          <span className="text-[12px] font-sans" style={{ color: subClr }}>
            por {peticion.author_name}
          </span>
          <div className="flex items-center gap-3">
            {peticion.estado === 'activa' ? (
              <OrarPorPeticionButton
                peticionId={peticion.id}
                initialOracionesCount={peticion.oraciones_count}
                yaOro={peticion.ya_oro}
                esAutor={peticion.is_owner}
                autorNombre={peticion.author_name}
              />
            ) : (
              <span className="text-[12px] font-sans" style={{ color: subClr }}>
                {peticion.oraciones_count} oraciones
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Owner actions: update form */}
      {peticion.is_owner && peticion.estado === 'activa' && (
        <UpdateForm peticionId={peticion.id} onSuccess={handleRefresh} />
      )}

      {/* Updates timeline */}
      <div>
        <h2
          className="text-[16px] font-display font-semibold mb-4"
          style={{ color: textClr }}
        >
          Actualizaciones
        </h2>
        <UpdateTimeline updates={initialUpdates} />
      </div>
    </div>
  )
}
