'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { registrarProgresoLecturaAction } from '../actions'

// Componentes de UI
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Botón de envío para el formulario
function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? 'Guardando...' : 'Guardar Progreso'}</Button>
}

type RegisterReadingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapterId: number
  chapterReference: string
}

export function RegisterReadingDialog({ open, onOpenChange, chapterId, chapterReference }: RegisterReadingDialogProps) {
  const [state, formAction] = useActionState(registrarProgresoLecturaAction, { errors: {}, message: undefined, error: undefined })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (state.message) {
      toast.success('Éxito', { description: state.message })
      onOpenChange(false) // Cerrar el modal en caso de éxito
    } else if (state.error) {
      toast.error('Error', { description: state.error })
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resumen de {chapterReference}</DialogTitle>
          <DialogDescription>
            Escribe una breve reflexión sobre lo que has leído. Este es un paso importante en tu senda.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="capituloId" value={chapterId} />
          <div>
            <Label htmlFor="resumen">Tu Resumen</Label>
            <Textarea
              id="resumen"
              name="resumen"
              placeholder="¿Qué te enseñó este capítulo? ¿Qué versículo te impactó más?"
              className="mt-2 min-h-[150px]"
              required
            />
            {state.errors?.resumen && <p className="text-sm text-destructive mt-1">{state.errors.resumen[0]}</p>}
          </div>
          <div className="flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
