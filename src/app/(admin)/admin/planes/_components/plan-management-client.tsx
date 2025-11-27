'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Tables } from '@/types/database'
import { ActionState } from '@/types/definitions'
import { LIBROS_BIBLIA } from '@/lib/bible-data'
import { generarPlanAction, programarPlanSiguienteAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { PackageOpen } from 'lucide-react'

// Componente para el botón de envío para mostrar estado de carga
function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? 'Generando...' : 'Generar Plan'}</Button>
}

const estadoInicialCreacion: ActionState = { errors: {}, message: undefined };

export function PlanManagementClient({ planes }: { planes: Tables<'planes_lectura'>[] }) {
  const [createState, formAction] = useActionState(generarPlanAction, estadoInicialCreacion)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Tables<'planes_lectura'> | null>(null)

  useEffect(() => {
    if (createState.message) {
      toast.success('Éxito', { description: createState.message })
    } else if (createState.errors?._form) {
      toast.error('Error al crear el plan', { description: createState.errors._form[0] })
    }
  }, [createState])

  const handleScheduleClick = (plan: Tables<'planes_lectura'>) => {
    setSelectedPlan(plan)
    setIsDialogOpen(true)
  }

  const handleScheduleConfirm = async () => {
    if (!selectedPlan) return
    const result = await programarPlanSiguienteAction(selectedPlan.id)
    if (result.error) {
      toast.error('Error', { description: result.error })
    } else if (result.message) {
      toast.success('Éxito', { description: result.message })
    }
    setIsDialogOpen(false)
    setSelectedPlan(null)
  }

  return (
    <div className="space-y-6">
      <div className="mx-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-6 font-display text-lg font-bold text-slate-900">Crear Nuevo Plan</h2>
        <form action={formAction} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700">Libro de la Biblia</Label>
            <Select name="nombre_libro" required>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecciona un libro" />
              </SelectTrigger>
              <SelectContent>
                {LIBROS_BIBLIA.map(libro => (
                  <SelectItem key={libro.nombre} value={libro.nombre}>{libro.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fecha_inicio" className="text-sm font-medium text-slate-700">Fecha de Inicio</Label>
            <Input id="fecha_inicio" name="fecha_inicio" type="date" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="minutos_oracion" className="text-sm font-medium text-slate-700">Minutos de Oración Diarios</Label>
            <Input id="minutos_oracion" name="minutos_oracion" type="number" defaultValue="15" required className="mt-1.5" />
          </div>
          <SubmitButton />
        </form>
      </div>
      
      <div className="mx-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-6 font-display text-lg font-bold text-slate-900">Planes Existentes</h2>
        {planes.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden sm:table-cell">Duración</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planes.map(plan => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.nombre_libro}</TableCell>
                    <TableCell><Badge variant={plan.estado === 'activo' ? 'default' : plan.estado === 'proximo' ? 'secondary' : 'outline'}>{plan.estado}</Badge></TableCell>
                    <TableCell className="hidden text-sm text-slate-600 sm:table-cell">{new Date(plan.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - {new Date(plan.fecha_fin).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</TableCell>
                    <TableCell className="text-right">
                      {plan.estado === 'inactivo' && (
                        <Button variant="outline" size="sm" onClick={() => handleScheduleClick(plan)}>
                          Programar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            Icon={PackageOpen}
            title="No Hay Planes Creados"
            description="Parece que aún no has generado ningún plan de lectura. ¡Usa el formulario para crear el primero!"
          />
        )}
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Programación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres programar el plan de lectura de <strong>{selectedPlan?.nombre_libro}</strong> como el próximo? Si ya existe un plan programado, será reemplazado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleScheduleConfirm}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster richColors />
    </div>
  )
}
