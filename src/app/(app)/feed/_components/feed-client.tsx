'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { Newspaper, Heart, MessageCircle, BookOpen, Timer, Flame, ChevronDown, Send, Trash2, Trophy, HandHeart } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { toggleReactionAction, postCommentAction, getCommentsAction, deleteCommentAction } from '../actions'
import { OrarPorPeticionButton } from '@/app/(app)/peticiones/_components/orar-por-peticion-button'
import type { FeedActivity } from '../types'
import { toast } from 'sonner'
import { useRealtimeFeed } from './use-realtime-feed'

// ─── Constants ───────────────────────────────────────────────────────────────
const REACTION_TYPES = [
  { type: 'like' as const, emoji: '❤️', label: 'Me gusta' },
  { type: 'prayer' as const, emoji: '🙏', label: 'Oración' },
  { type: 'fire' as const, emoji: '🔥', label: 'En fuego' },
  { type: 'lightning' as const, emoji: '⚡', label: 'Increíble' },
]

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

// ─── Types ───────────────────────────────────────────────────────────────────
interface Hero {
  id: string
  nombre_usuario: string
}

interface Comment {
  id: string
  contenido: string
  created_at: string
  user: { id: string; nombre_usuario: string }
}

type ReactionType = 'like' | 'prayer' | 'fire' | 'lightning'

// ─── ReactionPicker ──────────────────────────────────────────────────────────
function ReactionPicker({
  userReactions,
  totalLikes,
  onReact,
  isPending,
}: {
  userReactions: Set<ReactionType>
  totalLikes: number
  onReact: (type: ReactionType) => void
  isPending: boolean
}) {
  const [showPicker, setShowPicker] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPicker])

  const hasAnyReaction = userReactions.size > 0
  const subClr = 'hsl(var(--muted-foreground))'

  const handleLongPressStart = () => {
    timerRef.current = setTimeout(() => {
      setShowPicker(true)
    }, 400)
  }

  const handleLongPressEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handleQuickTap = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!showPicker) {
      onReact('like')
    }
  }

  return (
    <div className="relative" ref={pickerRef}>
      {/* Main button */}
      <button
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onClick={handleQuickTap}
        disabled={isPending}
        className="flex items-center gap-1.5 transition-opacity active:scale-95 disabled:opacity-50"
      >
        <Heart
          className="size-4"
          style={{
            color: hasAnyReaction ? '#FF6B6B' : subClr,
            fill: hasAnyReaction ? '#FF6B6B' : 'transparent',
          }}
        />
        <span className="text-[12px] font-sans" style={{ color: hasAnyReaction ? '#FF6B6B' : subClr }}>
          {totalLikes}
        </span>
      </button>

      {/* Emoji picker popup */}
      {showPicker && (
        <div
          className="absolute -top-12 left-0 z-50 flex items-center gap-1 rounded-full px-2 py-1.5 shadow-lg"
          style={{
            backgroundColor: 'hsl(var(--bg-surface))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          {REACTION_TYPES.map(({ type, emoji }) => (
            <button
              key={type}
              onClick={() => {
                onReact(type)
                setShowPicker(false)
              }}
              className="flex size-8 items-center justify-center rounded-full transition-transform hover:scale-125 active:scale-90"
              style={{
                backgroundColor: userReactions.has(type)
                  ? 'hsl(var(--primary) / 0.15)'
                  : 'transparent',
              }}
              title={REACTION_TYPES.find(r => r.type === type)?.label}
            >
              <span className="text-[18px]">{emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ActivityItem ────────────────────────────────────────────────────────────
function ActivityItem({ act, userReactions: initialReactions, currentUserId }: {
  act: FeedActivity
  userReactions: Set<ReactionType>
  currentUserId: string
}) {
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(initialReactions)
  const [likeCount, setLikeCount] = useState(Number(act.likes_count) || 0)
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Comments state
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentCount, setCommentCount] = useState(Number(act.comentarios_count) || 0)

  // Sync counts from Realtime updates (prop changes)
  useEffect(() => { setLikeCount(Number(act.likes_count) || 0) }, [act.likes_count])
  useEffect(() => { setCommentCount(Number(act.comentarios_count) || 0) }, [act.comentarios_count])

  const cardBg = 'hsl(var(--bg-surface) / 0.60)'
  const border = 'hsl(var(--border))'
  const textClr = 'hsl(var(--foreground))'
  const subClr = 'hsl(var(--muted-foreground))'
  const dotClr = 'hsl(var(--muted))'
  const accentBlue = '#7B8FFF'
  const accentPurple = '#B97BFF'

  // Extract name
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
  const isVictoria = tipo === 'victoria'
  const isPeticion = tipo === 'peticion_compartida'
  const isPeticionRespondida = tipo === 'peticion_respondida'
  const accentGold = '#FFD700'
  const accentRose = '#F43F5E'

  // Reaction handler
  function handleReaction(type: ReactionType) {
    const wasActive = userReactions.has(type)

    // Optimistic update
    setUserReactions(prev => {
      const next = new Set(prev)
      if (wasActive) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
    setLikeCount(c => wasActive ? Math.max(0, c - 1) : c + 1)

    startTransition(async () => {
      const result = await toggleReactionAction(Number(act.id), type, wasActive)
      if (!result.success) {
        // Revert
        setUserReactions(prev => {
          const next = new Set(prev)
          if (wasActive) next.add(type)
          else next.delete(type)
          return next
        })
        setLikeCount(c => wasActive ? c + 1 : c - 1)
        toast.error('Error', { description: result.error })
      }
    })
  }

  // Comments handlers
  async function loadComments() {
    if (commentsLoaded) return
    const result = await getCommentsAction(Number(act.id))
    if (result.success) {
      setComments(result.comments)
      setCommentsLoaded(true)
    } else {
      toast.error('No se pudieron cargar los comentarios')
    }
  }

  function handleCommentsClick() {
    setShowComments(!showComments)
    if (!showComments && !commentsLoaded) {
      loadComments()
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    setIsSubmittingComment(true)

    const result = await postCommentAction(Number(act.id), commentText)
    if (result.success && result.comment) {
      setComments([result.comment, ...comments])
      setCommentText('')
      setCommentCount(c => c + 1)
      toast.success('Comentario publicado')
    } else {
      toast.error('Error', { description: result.error })
    }
    setIsSubmittingComment(false)
  }

  async function handleDeleteComment(commentId: string) {
    const result = await deleteCommentAction(commentId)
    if (result.success) {
      setComments(comments.filter(c => c.id !== commentId))
      setCommentCount(c => Math.max(0, c - 1))
      toast.success('Comentario eliminado')
    } else {
      toast.error('Error', { description: result.error })
    }
  }

  return (
    <div
      className="flex flex-col rounded-[20px] p-4 transition-all duration-300"
      style={{
        backgroundColor: isVictoria
          ? 'rgba(255,215,0,0.07)'
          : isPeticion
            ? 'rgba(244,63,94,0.05)'
            : isPeticionRespondida
              ? 'rgba(59,130,246,0.07)'
              : cardBg,
        border: `1px solid ${
          isVictoria
            ? 'rgba(255,215,0,0.22)'
            : isPeticion
              ? 'rgba(244,63,94,0.15)'
              : isPeticionRespondida
                ? 'rgba(59,130,246,0.2)'
                : border
        }`,
      }}
    >
      {/* Main row */}
      <div className="flex items-start gap-3">
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
            {isVictoria ? (
              <Trophy className="size-3.5 shrink-0" style={{ color: accentGold }} />
            ) : isPeticion ? (
              <HandHeart className="size-3.5 shrink-0" style={{ color: accentRose }} />
            ) : isPeticionRespondida ? (
              <Trophy className="size-3.5 shrink-0" style={{ color: '#3B82F6' }} />
            ) : isLectura ? (
              <BookOpen className="size-3.5 shrink-0" style={{ color: accentBlue }} />
            ) : String(act.referencia_contenido || '').includes('Bonus') ? (
              <Flame className="size-3.5 shrink-0" style={{ color: accentGold }} />
            ) : (
              <Timer className="size-3.5 shrink-0" style={{ color: accentPurple }} />
            )}
            <span className="text-[12px] font-sans" style={{
              color: isVictoria
                ? accentGold
                : isPeticion
                  ? accentRose
                  : isPeticionRespondida
                    ? '#3B82F6'
                    : String(act.referencia_contenido || '').includes('Bonus')
                      ? accentGold
                      : subClr
            }}>
              {isVictoria
                ? `🏆 ${act.resumen_actividad || `¡${act.referencia_contenido}!`}`
                : isPeticion
                  ? 'compartió una petición de oración'
                  : isPeticionRespondida
                    ? '¡Su petición fue respondida! ✨'
                    : isLectura
                      ? `Leyó ${act.referencia_contenido || 'la lectura de hoy'}`
                      : `Oró · ${act.referencia_contenido || 'Tiempo de Oración'}`
              }
            </span>
          </div>

          {/* Expandable reflection */}
          {isLectura && act.resumen_actividad && (
            <div className="mb-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                style={{ color: accentBlue }}
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
                    backgroundColor: 'hsl(var(--primary) / 0.08)',
                    borderLeft: `2px solid ${accentBlue}`,
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  {act.resumen_actividad}
                </div>
              )}
            </div>
          )}

          {/* Petition card in feed */}
          {(isPeticion || isPeticionRespondida) && act.resumen_actividad && (
            <div
              className="mb-3 rounded-xl px-3 py-2.5"
              style={{
                backgroundColor: isPeticion ? 'rgba(244,63,94,0.06)' : 'rgba(59,130,246,0.06)',
                border: `1px solid ${isPeticion ? 'rgba(244,63,94,0.12)' : 'rgba(59,130,246,0.12)'}`,
              }}
            >
              <p className="text-[13px] font-sans font-medium" style={{ color: textClr }}>
                {act.resumen_actividad}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span
                  className="text-[11px] font-sans px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isPeticion ? 'rgba(244,63,94,0.1)' : 'rgba(59,130,246,0.1)',
                    color: isPeticion ? accentRose : '#3B82F6',
                  }}
                >
                  {isPeticion ? 'Petición' : 'Respondida'}
                </span>
                {isPeticion && (
                  <OrarPorPeticionButton
                    peticionId={String(act.referencia_contenido || '')}
                    initialOracionesCount={0}
                    compact
                  />
                )}
              </div>
            </div>
          )}

          {/* Actions row: Reactions + Comments */}
          <div className="flex items-center gap-4">
            <ReactionPicker
              userReactions={userReactions}
              totalLikes={likeCount}
              onReact={handleReaction}
              isPending={isPending}
            />

            <button
              onClick={handleCommentsClick}
              className="flex items-center gap-1.5 transition-colors"
              style={{ color: showComments ? accentBlue : subClr }}
            >
              <MessageCircle className="size-4" />
              <span className="text-[12px] font-sans">
                {commentCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div
          className="mt-3 pt-3 flex flex-col gap-3"
          style={{ borderTop: `1px solid ${border}` }}
        >
          {/* Comment form */}
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 rounded-full px-4 py-2 text-[13px] font-sans outline-none transition-colors"
              style={{
                backgroundColor: 'hsl(var(--input))',
                color: textClr,
                border: `1px solid ${border}`,
              }}
              disabled={isSubmittingComment}
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              className="flex size-9 items-center justify-center rounded-full transition-opacity disabled:opacity-30"
              style={{ backgroundColor: accentBlue, color: '#FFFFFF' }}
            >
              <Send className="size-3.5" />
            </button>
          </form>

          {!commentsLoaded && (
            <p className="text-center text-[12px] font-sans" style={{ color: subClr }}>
              Cargando comentarios...
            </p>
          )}

          {commentsLoaded && comments.length === 0 && (
            <p className="text-center text-[12px] font-sans" style={{ color: subClr }}>
              Sé el primero en comentar
            </p>
          )}

          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <div
                className="size-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold font-display"
                style={{ backgroundColor: dotClr, color: subClr }}
              >
                {comment.user.nombre_usuario?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-[600] font-sans truncate" style={{ color: textClr }}>
                    {comment.user.nombre_usuario}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-sans" style={{ color: subClr }}>
                      {formatRelativeTime(comment.created_at)}
                    </span>
                    {comment.user.id === currentUserId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="opacity-40 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="size-3" style={{ color: '#FF6B6B' }} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[12px] font-sans leading-relaxed mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {comment.contenido}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── FeedClient ──────────────────────────────────────────────────────────────
export function FeedClient({
  groupedActivities: initialGroupedActivities,
  likedActivityIds,
  userReactionsMap,
  currentUserId,
  todaysHeroes,
  memberIds,
  timezone,
  grupoId,
}: {
  groupedActivities: Record<string, FeedActivity[]>
  likedActivityIds: Set<number>
  userReactionsMap: Record<number, string[]>
  currentUserId: string
  todaysHeroes: Hero[]
  memberIds: string[]
  timezone: string
  grupoId?: string | null
}) {
  // Realtime feed updates
  const { groupedActivities } = useRealtimeFeed(initialGroupedActivities, { memberIds, timezone, grupoId })
  const activityDates = Object.keys(groupedActivities)

  const sectionLbl = 'hsl(var(--quest-text-secondary))'
  const dateClr = 'hsl(var(--muted-foreground))'

  // Build per-activity reaction sets
  function getUserReactions(activityId: number): Set<ReactionType> {
    const reactions = userReactionsMap[activityId] || []
    return new Set(reactions as ReactionType[])
  }

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
                    backgroundColor: 'hsl(var(--muted))',
                    color: 'hsl(var(--primary))',
                    boxShadow: '0 0 0 2px hsl(var(--primary) / 0.35)',
                  }}
                >
                  {hero.nombre_usuario[0]?.toUpperCase()}
                  <Flame className="absolute -bottom-1 -right-1 size-3.5" style={{ color: '#FF6B35' }} />
                </div>
                <span className="text-[10px] font-sans text-muted-foreground">
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
                userReactions={getUserReactions(act.id)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ))
      )}
    </div>
  )
}
