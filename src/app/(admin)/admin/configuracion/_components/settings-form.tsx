'use client'
import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { actualizarConfiguracionAction } from '../actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toaster } from '@/components/ui/sonner'
function SubmitButton() {
const { pending } = useFormStatus()
return <Button type="submit" disabled={pending}>{pending ? 'Guardando...' : 'Guardar Cambios'}</Button>
}
export function SettingsForm({ initialPenaltyAmount }: { initialPenaltyAmount: string }) {
const [state, formAction] = useActionState(actualizarConfiguracionAction, { errors: {}, message: undefined, error: undefined })
useEffect(() => {
if (state.message) {
toast.success('Éxito', { description: state.message })
} else if (state.error) {
toast.error('Error', { description: state.error })
}
}, [state])
  return (
    <>
      <form action={formAction}>
        <div className="mx-4 rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="p-6">
            <h2 className="mb-2 font-display text-lg font-bold text-slate-900">Parámetros de Penalización</h2>
            <p className="mb-6 text-sm text-slate-500">Define el valor de la penalización por incumplimiento diario.</p>
            <div className="space-y-2">
              <Label htmlFor="monto_penalizacion" className="text-sm font-medium text-slate-700">Monto de Penalización (USD)</Label>
              <Input
                id="monto_penalizacion"
                name="monto_penalizacion"
                type="number"
                step="0.01"
                defaultValue={initialPenaltyAmount}
                required
                className="mt-1.5"
              />
              {state.errors?.monto_penalizacion && <p className="text-sm text-destructive">{state.errors.monto_penalizacion[0]}</p>}
            </div>
          </div>
          <div className="border-t border-slate-100 px-6 py-4">
            <SubmitButton />
          </div>
        </div>
      </form>
      <Toaster richColors />
    </>
  )
}
