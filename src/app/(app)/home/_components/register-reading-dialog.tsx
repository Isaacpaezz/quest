'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { registrarProgresoLecturaAction } from '../actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapterId: number
  chapterReference: string
  onXpGained?: (data: { xpGanado: number; nuevoNivel?: number; subioNivel?: boolean }) => void
}

export function RegisterReadingDialog({ open, onOpenChange, chapterId, chapterReference, onXpGained }: Props) {
  const [reflection, setReflection] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reflection.trim()) {
      toast.error('Por favor escribe una reflexión')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('capituloId', chapterId.toString())
      formData.append('resumen', reflection)
      formData.append('capituloReferencia', chapterReference)

      const result = await registrarProgresoLecturaAction({}, formData)

      if (result?.error) {
        toast.error(result.error)
      } else if (result?.errors) {
        const errorMessages = Object.values(result.errors).flat().join(', ')
        toast.error(errorMessages || 'Error de validación')
      } else {
        const xp = result?.xpGanado ?? 0
        toast.success('¡Lectura registrada! 📖', { description: xp > 0 ? `+${xp} XP` : undefined })
        if (xp > 0 && onXpGained) {
          onXpGained({
            xpGanado: xp,
            nuevoNivel: result?.nuevoNivel,
            subioNivel: result?.subioNivel,
          })
        }
        onOpenChange(false)
        setReflection('')
      }
    } catch {
      toast.error('Ocurrió un error al registrar la lectura')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Theme colors (CSS variables — auto dark/light)
  const bg = 'hsl(var(--bg-surface))'
  const border = 'hsl(var(--border))'
  const tp = 'hsl(var(--foreground))'
  const ts = 'hsl(var(--muted-foreground))'
  const teal = 'hsl(var(--primary))'
  const inputBg = 'hsl(var(--muted))'
  const inputBorder = 'hsl(var(--input))'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border p-0 sm:max-w-[400px]"
        style={{
          background: bg,
          borderColor: border,
          borderRadius: 28,
          boxShadow: '0 24px 80px rgba(0,0,0,0.15), 0 0 0 1px hsl(var(--border))',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90"
          style={{
            background: 'hsl(var(--muted))',
          }}
        >
          <X className="h-4 w-4" style={{ color: ts }} />
        </button>

        <div className="p-7">
          {/* Header */}
          <div className="mb-5">
            <h2
              className="font-sora text-[22px] font-bold"
              style={{ color: tp, letterSpacing: -0.5 }}
            >
              Tu Reflexión
            </h2>
            <p
              className="mt-1.5 text-[11px] font-bold tracking-[2px]"
              style={{ color: teal }}
            >
              SOBRE {chapterReference.toUpperCase()}
            </p>
          </div>

          {/* Question */}
          <p
            className="mb-5 text-[14px] leading-relaxed"
            style={{ color: 'hsl(var(--foreground) / 0.60)' }}
          >
            ¿Qué te enseñó Dios en este capítulo? Escribe una breve nota para guardar en tu historial.
          </p>

          {/* Textarea */}
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Escribe aquí..."
            rows={5}
            className="mb-5 w-full resize-none rounded-2xl border p-4 text-[14px] leading-relaxed transition-colors focus:outline-none"
            style={{
              background: inputBg,
              borderColor: inputBorder,
              color: tp,
              caretColor: teal,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = teal
              e.target.style.boxShadow = `0 0 0 2px ${teal}30`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = inputBorder
              e.target.style.boxShadow = 'none'
            }}
          />

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex h-[50px] w-full items-center justify-center rounded-[14px] text-[15px] font-semibold transition-all active:scale-[0.97] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.80))',
              color: 'hsl(var(--primary-foreground))',
              boxShadow: `0 4px 24px hsl(var(--primary) / 0.25)`,
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Guardando…
              </span>
            ) : (
              'Guardar Reflexión'
            )}
          </button>

          {/* Skip option */}
          <button
            onClick={() => onOpenChange(false)}
            className="mt-3 w-full text-center text-xs font-medium transition-all"
            style={{ color: ts }}
          >
            Cerrar sin guardar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
