'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Newspaper, Heart, MessageCircle, BookOpen, Timer, Flame, ChevronDown } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { toggleLikeAction } from '../actions'
import type { FeedActivity } from '../types'

// ─── Date helpers ────────────────────────────────────────────────────────────
function formatDateHeader(dateString: string) {
  const [yearStr, monthStr, dayStr] = dateString.split('-')
  const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr))
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  if (same(dateObj, today)) return 'Hoy'
  if (same(dateObj, yesterday)) return 'Ayer'
  return dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatRelativeTime(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}

interface Hero {
  id: string
  nombre_usuario: string
}

function ActivityItem({ act, currentUserLiked, currentUserId, isDark }: { act: FeedActivity; currentUserLiked: boolean; currentUserId: string; isDark: boolean }) {
  const [liked, setLiked] = useState(currentUserLiked)
  const [likeCount, setLikeCount] = useState(Number(act.likes_count) || 0)
  const [expanded, setExpanded] = useState(false)

  const cardBg = isDark ? 'rgba(21,25,37,0.60)' : 'rgba(255,255,255,0.88)'
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const textClr = isDark ? '#FFFFFF' : '#111318'
  const subClr = isDark ? '#5A6075' : '#8C9099'
  const dotClr = isDark ? '#2B3045' : '#E8EBF0'

  // Extract name from perfiles join (can be object or array)
  const perfiles = act.perfiles
  let nombre = 'Usuario'
  if (perfiles) {
    if (Array.isArray(perfiles)) {
      nombre = perfiles[0]?.nombre_usuario || 'Usuario'
    } else if (typeof perfiles === 'object' && perfiles.nombre_usuario) {
      nombre = perfiles.nombre_usuario
    }
  }
  const tipo = String(act.tipo_actividad || '')
  const isLectura = tipo === 'lectura_completada'

  async function handleLike() {
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount(c => newLiked ? c + 1 : Math.max(0, c - 1))
    await toggleLikeAction(Number(act.id), liked)
  }

  return (
    <div
      className="flex items-start gap-3 rounded-[20px] p-4"
      style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
    >
      {/* Avatar */}
      <div
        className="size-10 rounded-full flex items-center justify-center shrink-0 text-[15px] font-bold font-display"
        style={{ backgroundColor: dotClr, color: subClr }}
      >
        {nombre[0]?.toUpperCase() || '?'}
      </div>

      <div className="flex-1 min-w-0">
        {/* Name + time */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[14px] font-[600] font-sans truncate" style={{ color: textClr }}>
            {nombre}
          </span>
          <span className="text-[12px] font-sans shrink-0" style={{ color: subClr }}>
            {act.creado_en ? formatRelativeTime(String(act.creado_en)) : ''}
          </span>
        </div>

        {/* Activity label */}
        <div className="flex items-center gap-1.5 mb-3">
          {isLectura
            ? <BookOpen className="size-3.5 shrink-0" style={{ color: isDark ? '#7B8FFF' : '#5468FF' }} />
            : <Timer className="size-3.5 shrink-0" style={{ color: isDark ? '#B97BFF' : '#8A4FFF' }} />
          }
          <span className="text-[12px] font-sans" style={{ color: subClr }}>
            {isLectura
              ? `Leyó ${act.referencia_contenido || 'la lectura de hoy'}`
              : `Oró · ${act.referencia_contenido || 'Tiempo de Oración'}`
            }
          </span>
        </div>

        {/* Expandable reflection for reading activities */}
        {isLectura && act.resumen_actividad && (
          <div className="mb-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[11px] font-medium transition-colors"
              style={{ color: isDark ? '#7B8FFF' : '#5468FF' }}
            >
              <ChevronDown
                className="size-3 transition-transform duration-200"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
              Reflexión
            </button>
            {expanded && (
              <div
                className="mt-2 rounded-xl px-3 py-2.5 text-[12px] leading-relaxed font-sans"
                style={{
                  backgroundColor: isDark ? 'rgba(123,143,255,0.08)' : 'rgba(84,104,255,0.06)',
                  borderLeft: `2px solid ${isDark ? '#7B8FFF' : '#5468FF'}`,
                  color: isDark ? '#A0ACD0' : '#5A6070',
                }}
              >
                {act.resumen_actividad}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 transition-opacity active:scale-95"
          >
            <Heart
              className="size-4"
              style={{
                color: liked ? '#FF6B6B' : subClr,
                fill: liked ? '#FF6B6B' : 'transparent',
              }}
            />
            <span className="text-[12px] font-sans" style={{ color: liked ? '#FF6B6B' : subClr }}>
              {likeCount}
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            <MessageCircle className="size-4" style={{ color: subClr }} />
            <span className="text-[12px] font-sans" style={{ color: subClr }}>
              {Number(act.comentarios_count) || 0}
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}

export function FeedClient({ groupedActivities, likedActivityIds, currentUserId, todaysHeroes }: {
  groupedActivities: Record<string, FeedActivity[]>
  likedActivityIds: Set<number>
  currentUserId: string
  todaysHeroes: Hero[]
}) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'
  const activityDates = Object.keys(groupedActivities)

  const sectionLbl = isDark ? '#7A8090' : '#6B7080'
  const dateClr = isDark ? '#5A6075' : '#8C9099'

  return (
    <div className="flex flex-col gap-6">

      {/* Héroes del día */}
      {todaysHeroes.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-[2px] rounded-sm" style={{ backgroundColor: '#FF6B35' }} />
            <span className="text-[11px] font-bold tracking-[2px] font-sans uppercase" style={{ color: sectionLbl }}>
              HÉROES DEL DÍA
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {todaysHeroes.map(hero => (
              <div key={hero.id} className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className="size-12 rounded-full flex items-center justify-center text-[15px] font-bold font-display relative"
                  style={{
                    backgroundColor: isDark ? '#1E2330' : '#E8EBF0',
                    color: isDark ? '#2DDAB0' : '#1AAF8B',
                    boxShadow: `0 0 0 2px ${isDark ? 'rgba(45,218,176,0.35)' : 'rgba(26,175,139,0.35)'}`,
                  }}
                >
                  {hero.nombre_usuario[0]?.toUpperCase()}
                  <Flame className="absolute -bottom-1 -right-1 size-3.5" style={{ color: '#FF6B35' }} />
                </div>
                <span className="text-[10px] font-sans" style={{ color: isDark ? '#5A6075' : '#8C9099' }}>
                  {hero.nombre_usuario.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity feed */}
      {activityDates.length === 0 ? (
        <EmptyState
          Icon={Newspaper}
          title="Sin actividad aún"
          description="Las actividades de la comunidad aparecerán aquí."
        />
      ) : (
        activityDates.map(date => (
          <div key={date} className="flex flex-col gap-3">
            {/* Date separator */}
            <span
              className="text-[11px] font-bold tracking-[1.5px] font-sans uppercase"
              style={{ color: dateClr }}
            >
              {formatDateHeader(date)}
            </span>
            {groupedActivities[date].map(act => (
              <ActivityItem
                key={act.id}
                act={act}
                isDark={isDark}
                currentUserLiked={likedActivityIds.has(act.id)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ))
      )}
    </div>
  )
}
