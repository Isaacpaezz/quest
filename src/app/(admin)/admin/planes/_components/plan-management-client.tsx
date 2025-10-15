'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
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

// Componente para el botón de envío para mostrar estado de carga
function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? 'Generando...' : 'Generar Plan'}</Button>
}

type EstadoAccion = {
  errors?: {
    nombre_libro?: string[]
    fecha_inicio?: string[]
    minutos_oracion?: string[]
    _form?: string[]
  }
  message?: string
}

const estadoInicial: EstadoAccion = { errors: {}, message: undefined };

export function PlanManagementClient({ planes }: { planes: any[] }) {
  const [createState, formAction] = useActionState<EstadoAccion, FormData>(
    generarPlanAction,
    estadoInicial
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null)

  useEffect(() => {
    if (createState.message) {
      toast.success('Éxito', { description: createState.message })
    } else if (createState.errors?._form) {
      toast.error('Error al crear el plan', { description: createState.errors._form[0] })
    }
  }, [createState, toast])

  const handleScheduleClick = (plan: any) => {
    setSelectedPlan(plan)
    setIsDialogOpen(true)
  }

  const handleScheduleConfirm = async () => {
    if (!selectedPlan) return
    const result = await programarPlanSiguienteAction(selectedPlan.id)
    if ((result as any).error) {
      toast.error('Error', { description: (result as any).error })
    } else if ((result as any).message) {
      toast.success('Éxito', { description: (result as any).message })
    }
    setIsDialogOpen(false)
    setSelectedPlan(null)
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader><CardTitle>Crear Nuevo Plan</CardTitle></CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div>
              <Label>Libro de la Biblia</Label>
              <Select name="nombre_libro" required>
                <SelectTrigger><SelectValue placeholder="Selecciona un libro" /></SelectTrigger>
                <SelectContent>
                  {LIBROS_BIBLIA.map(libro => (
                    <SelectItem key={libro.nombre} value={libro.nombre}>{libro.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
              <Input id="fecha_inicio" name="fecha_inicio" type="date" required />
            </div>
            <div>
              <Label htmlFor="minutos_oracion">Minutos de Oración Diarios</Label>
              <Input id="minutos_oracion" name="minutos_oracion" type="number" defaultValue="15" required />
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader><CardTitle>Planes Existentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planes.map(plan => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.nombre_libro}</TableCell>
                  <TableCell><Badge variant={plan.estado === 'activo' ? 'default' : plan.estado === 'proximo' ? 'secondary' : 'outline'}>{plan.estado}</Badge></TableCell>
                  <TableCell>{new Date(plan.fecha_inicio).toLocaleDateString()} - {new Date(plan.fecha_fin).toLocaleDateString()}</TableCell>
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
        </CardContent>
      </Card>
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
