'use client'

import { useState, useTransition } from 'react'
import { Heart, MessageCircle, Sparkles, MoreHorizontal, Send, Trash2 } from 'lucide-react'
import { toggleLikeAction, postCommentAction, getCommentsAction, deleteCommentAction } from '../actions'
import { toast } from 'sonner'

function timeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " años";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " meses";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " días";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " min";
  return "ahora";
}

interface Comment {
  id: string
  contenido: string
  created_at: string
  user: {
    id: string
    nombre_usuario: string
  }
}

interface ActivityCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activity: any
  initialLikesCount: number
  initialCommentsCount: number
  currentUserLiked: boolean
  currentUserId?: string
}

export function ActivityCard({ 
  activity, 
  initialLikesCount, 
  initialCommentsCount, 
  currentUserLiked,
  currentUserId 
}: ActivityCardProps) {
  const isReading = activity.tipo_actividad === 'lectura_completada';
  
  // Estado local para UI optimista
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isLiked, setIsLiked] = useState(currentUserLiked)
  const [isPending, startTransition] = useTransition()
  
  // Estado para comentarios
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Manejar click en Like (UI Optimista)
  const handleLikeClick = () => {
    // Actualización optimista inmediata
    const newIsLiked = !isLiked
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1
    
    setIsLiked(newIsLiked)
    setLikesCount(newLikesCount)

    // Ejecutar Server Action en background
    startTransition(async () => {
      const result = await toggleLikeAction(activity.id, !newIsLiked)
      
      if (!result.success) {
        // Revertir cambios si falla
        setIsLiked(!newIsLiked)
        setLikesCount(newIsLiked ? newLikesCount - 1 : newLikesCount + 1)
        toast.error('Error', { description: result.error })
      }
    })
  }

  // Cargar comentarios
  const loadComments = async () => {
    if (commentsLoaded) return
    
    const result = await getCommentsAction(activity.id)
    if (result.success) {
      setComments(result.comments)
      setCommentsLoaded(true)
    } else {
      toast.error('Error', { description: 'No se pudieron cargar los comentarios' })
    }
  }

  // Toggle sección de comentarios
  const handleCommentsClick = () => {
    setShowComments(!showComments)
    if (!showComments && !commentsLoaded) {
      loadComments()
    }
  }

  // Publicar comentario
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!commentText.trim()) return

    setIsSubmittingComment(true)

    const result = await postCommentAction(activity.id, commentText)
    
    if (result.success && result.comment) {
      // Agregar comentario a la lista local
      setComments([result.comment, ...comments])
      setCommentText('')
      toast.success('Comentario publicado')
    } else {
      toast.error('Error', { description: result.error })
    }

    setIsSubmittingComment(false)
  }

  // Eliminar comentario
  const handleDeleteComment = async (commentId: string) => {
    const result = await deleteCommentAction(commentId)
    
    if (result.success) {
      setComments(comments.filter(c => c.id !== commentId))
      toast.success('Comentario eliminado')
    } else {
      toast.error('Error', { description: result.error })
    }
  }

  return (
    <div className="relative mb-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <span className="font-bold">{activity.perfiles.nombre_usuario[0]}</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-900">{activity.perfiles.nombre_usuario}</h4>
            <p className="text-xs text-slate-400">{timeAgo(activity.creado_en)}</p>
          </div>
        </div>
        <button className="text-slate-300 transition-colors hover:text-slate-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* CONTENT BLOCK (Gray Box) */}
      <div className="mt-3 rounded-2xl border border-slate-100/50 bg-slate-50 p-4">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {isReading ? 'Lectura Bíblica' : 'Oración Completada'}
        </div>
        
        <h3 className="font-display text-lg font-bold leading-tight text-slate-900">
          {isReading ? activity.referencia_contenido : (activity.referencia_contenido ?? 'ha terminado su tiempo con Dios.')}
        </h3>

        {/* Mostrar resumen de la actividad si existe (lectura u oración) */}
        {activity.resumen_actividad && (
          <div className="mt-4 flex gap-3 rounded-xl border border-indigo-100 bg-[#EEF2FF] p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
            <div className="space-y-1">
              <p className="text-sm leading-relaxed text-slate-700">
                {activity.resumen_actividad}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* INTERACTIONS FOOTER (Hidden for Prayer) */}
      {isReading && (
        <div className="mt-4">
          <div className="flex items-center gap-6">
            {/* LIKE BUTTON */}
            <button 
              onClick={handleLikeClick}
              disabled={isPending}
              className="group flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Heart 
                className={`h-5 w-5 stroke-2 transition-all group-active:scale-90 ${
                  isLiked 
                    ? 'fill-rose-500 text-rose-500' 
                    : 'text-slate-400 group-hover:text-rose-500'
                }`}
              />
              <span className={`text-sm font-medium ${isLiked ? 'text-rose-500' : 'text-slate-400'}`}>
                {likesCount}
              </span>
            </button>

            {/* COMMENTS BUTTON */}
            <button 
              onClick={handleCommentsClick}
              className="flex items-center gap-1.5 text-slate-400 transition-colors hover:text-indigo-500"
            >
              <MessageCircle className="h-5 w-5 stroke-2" />
              <span className="text-sm font-medium">{initialCommentsCount + comments.filter(c => !commentsLoaded).length}</span>
            </button>
          </div>

          {/* COMMENTS SECTION */}
          {showComments && (
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 rounded-full border-none bg-slate-100 px-4 py-2 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                  disabled={isSubmittingComment}
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              {/* Comments List */}
              {!commentsLoaded && (
                <p className="text-center text-sm text-slate-400">Cargando comentarios...</p>
              )}
              
              {commentsLoaded && comments.length === 0 && (
                <p className="text-center text-sm text-slate-400">Sé el primero en comentar</p>
              )}

              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
                    {comment.user.nombre_usuario[0]}
                  </div>
                  <div className="flex-1 rounded-2xl bg-slate-50 px-3 py-2">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-bold text-slate-900">{comment.user.nombre_usuario}</span>
                      {comment.user.id === currentUserId && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700">{comment.contenido}</p>
                    <span className="mt-1 text-xs text-slate-400">{timeAgo(comment.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
