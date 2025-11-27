'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { registrarProgresoLecturaAction } from '../actions'

type RegisterReadingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapterId: number
  chapterReference: string
}

export function RegisterReadingDialog({
  open,
  onOpenChange,
  chapterId,
  chapterReference,
}: RegisterReadingDialogProps) {
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
        // Handle validation errors
        const errorMessages = Object.values(result.errors).flat().join(', ')
        toast.error(errorMessages || 'Error de validación')
      } else {
        toast.success('Lectura registrada correctamente')
        onOpenChange(false)
        setReflection('')
      }
    } catch (error) {
      toast.error('Ocurrió un error al registrar la lectura')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2rem] border-none bg-white p-0 shadow-2xl sm:max-w-[400px]">
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Tu Reflexión
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              SOBRE {chapterReference}
            </p>
          </div>

          {/* Question */}
          <p className="mb-6 text-sm font-medium leading-relaxed text-slate-600">
            ¿Qué te enseñó Dios en este capítulo? Escribe una breve nota para guardar en tu historial.
          </p>

          {/* Text Area */}
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Escribe aquí..."
            className="mb-6 h-40 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {/* Save Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex h-[50px] w-full items-center justify-center rounded-xl bg-slate-500 font-medium text-white transition-all hover:bg-slate-600 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Reflexión'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
