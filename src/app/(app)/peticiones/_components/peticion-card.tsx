'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarPeticionAction } from '../actions'
import type { Tables } from '@/types/database'

// ─── Types ───────────────────────────────────────────────────────────────────

type Peticion = Tables<'peticiones_oracion'>

interface PeticionCardProps {
  peticion: Peticion
  isOwner?: boolean
  onEdit?: (peticionId: string) => void
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

// ─── Component ───────────────────────────────────────────────────────────────

export function PeticionCard({
  peticion,
  isOwner = false,
  onEdit,
}: PeticionCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showActions, setShowActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const categoria = CATEGORIA_BADGES[peticion.categoria] ?? CATEGORIA_BADGES.otro
  const estado = ESTADO_BADGES[peticion.estado] ?? ESTADO_BADGES.activa

  // Truncate description
  const descripcionCorta = peticion.descripcion
    ? peticion.descripcion.length > 120
      ? peticion.descripcion.slice(0, 120) + '...'
      : peticion.descripcion
    : null

  // Delete handler
  function handleDelete() {
    startTransition(async () => {
      const result = await eliminarPeticionAction(peticion.id)
      if (result.success) {
        toast.success('Petición archivada')
        setShowDeleteConfirm(false)
        router.refresh()
      } else {
        toast.error('Error', { description: result.error })
      }
    })
  }

  // ─── Styles ──────────────────────────────────────────────────────────────
  const cardBg = 'hsl(var(--bg-surface) / 0.60)'
  const borderClr = 'hsl(var(--border))'
  const textClr = 'hsl(var(--foreground))'
  const subClr = 'hsl(var(--muted-foreground))'

  return (
    <div
      className="rounded-[16px] p-4 transition-all duration-200"
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${borderClr}`,
      }}
    >
      {/* Header: badges + actions */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {/* Categoria badge */}
          <span
            className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: categoria.bg, color: categoria.color }}
          >
            {categoria.label}
          </span>
          {/* Estado badge */}
          <span
            className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: estado.bg, color: estado.color }}
          >
            {estado.label}
          </span>
        </div>

        {/* Owner actions */}
        {isOwner && peticion.estado !== 'archivada' && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors hover:bg-muted"
              style={{ color: subClr }}
              aria-label="Abrir acciones de petición"
            >
              <MoreHorizontal className="size-4" />
            </button>

            {showActions && (
              <div
                className="absolute right-0 top-8 z-10 rounded-xl overflow-hidden shadow-lg"
                style={{
                  backgroundColor: 'hsl(var(--surface-elevated))',
                  border: `1px solid ${borderClr}`,
                  minWidth: 140,
                }}
              >
                <button
                  onClick={() => {
                    setShowActions(false)
                    onEdit?.(peticion.id)
                  }}
                  className="flex min-h-11 w-full items-center gap-2 px-3 text-left transition-colors"
                  style={{ color: textClr }}
                >
                  <Edit className="size-3.5" />
                  <span className="text-[12px] font-sans">Editar</span>
                </button>
                <div className="h-px" style={{ backgroundColor: borderClr }} />
                <button
                  onClick={() => {
                    setShowActions(false)
                    setShowDeleteConfirm(true)
                  }}
                  className="flex min-h-11 w-full items-center gap-2 px-3 text-left transition-colors"
                  style={{ color: '#EF4444' }}
                >
                  <Trash2 className="size-3.5" />
                  <span className="text-[12px] font-sans">Eliminar</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className="mb-1 break-words text-[15px] font-sans font-semibold leading-tight"
        style={{ color: textClr }}
      >
        {peticion.titulo}
      </h3>

      {/* Description */}
      {descripcionCorta && (
        <p
          className="mb-3 break-words text-[13px] font-sans leading-relaxed"
          style={{ color: subClr }}
        >
          {descripcionCorta}
        </p>
      )}

      {/* Footer: oraciones count + time */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Heart
            className="size-3.5"
            style={{ color: peticion.oraciones_count > 0 ? '#F59E0B' : subClr }}
          />
          <span
            className="text-[12px] font-sans"
            style={{ color: peticion.oraciones_count > 0 ? '#F59E0B' : subClr }}
          >
            {peticion.oraciones_count} {peticion.oraciones_count === 1 ? 'oración' : 'oraciones'}
          </span>
        </div>
        <span className="text-[11px] font-sans" style={{ color: subClr }}>
          {timeAgo(peticion.creado_en)}
        </span>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div
          className="mt-3 pt-3 flex flex-col gap-2"
          style={{ borderTop: `1px solid ${borderClr}` }}
        >
          <p className="text-[12px] font-sans" style={{ color: subClr }}>
            ¿Archivar esta petición? No se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="min-h-11 flex-1 rounded-lg text-[12px] font-sans font-medium transition-colors"
              style={{
                backgroundColor: 'hsl(var(--muted))',
                color: textClr,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="min-h-11 flex-1 rounded-lg text-[12px] font-sans font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
              }}
            >
              {isPending ? 'Archivando...' : 'Archivar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
