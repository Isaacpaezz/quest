'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { registrarProgresoLecturaAction } from '../actions'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapterId: number
  chapterReference: string
}

export function RegisterReadingDialog({ open, onOpenChange, chapterId, chapterReference }: Props) {
  const [reflection, setReflection] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

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
        toast.success('¡Lectura registrada! 📖', { description: '+30 XP' })
        onOpenChange(false)
        setReflection('')
      }
    } catch {
      toast.error('Ocurrió un error al registrar la lectura')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Theme colors
  const bg = isDark ? '#151925' : '#FFFFFF'
  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const tp = isDark ? '#FFFFFF' : '#111318'
  const ts = isDark ? '#5A6075' : '#8C9099'
  const teal = isDark ? '#2DDAB0' : '#1AAF8B'
  const inputBg = isDark ? '#1A1E28' : '#F5F6F8'
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border p-0 sm:max-w-[400px]"
        style={{
          background: bg,
          borderColor: border,
          borderRadius: 28,
          boxShadow: isDark
            ? '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)'
            : '0 24px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90"
          style={{
            background: isDark ? '#1E2330' : '#F0F1F3',
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
            style={{ color: isDark ? '#FFFFFF90' : '#111318A0' }}
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
              background: isDark
                ? 'linear-gradient(135deg, #2DDAB0, #1AAF8B)'
                : 'linear-gradient(135deg, #1AAF8B, #17917A)',
              color: isDark ? '#080A10' : '#FFFFFF',
              boxShadow: `0 4px 24px ${teal}40`,
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
